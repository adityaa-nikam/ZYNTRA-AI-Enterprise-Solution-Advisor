/**
 * vectorSearchService.js — Production Upgrade
 *
 * Implements:
 *   - PART 2: Hybrid scoring (Vector + Keyword + Industry + Department + Business Function)
 *   - PART 3: Diversity filter (max 2 chunks per source document)
 *   - PART 4: Metadata pre-filtering before vector search (when industryConfidence >= 70)
 *   - PART 7: Retrieval Quality Score calculation
 */

const dns = require("dns");
// Force Node.js internal DNS resolver to use Google & Cloudflare DNS (fixes Windows SRV ECONNREFUSED)
dns.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);

const KnowledgeDoc = require("../models/KnowledgeDoc");
const { generateEmbedding, generateEmbeddingsBatch } = require("../scripts/embedKnowledgeBase");

// ─── In-Memory Document Cache (5-minute TTL) for Instant Fallback ────────────
let docCache = null;
let docCacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

async function getCachedKnowledgeDocs() {
  const now = Date.now();
  if (docCache && (now - docCacheTimestamp) < CACHE_TTL_MS) {
    return docCache;
  }
  try {
    const docs = await KnowledgeDoc.find({})
      .select("_id documentId chunkNumber title industry department subcategory category businessProcess source summary excerpt content keywords technologies tokenCount embeddingModel embedding")
      .lean();
    if (docs && docs.length > 0) {
      docCache = docs;
      docCacheTimestamp = now;
      console.log(`📦 [DocCache] Cached ${docs.length} knowledge base documents in Node.js memory.`);
    }
    return docCache || docs;
  } catch (err) {
    console.warn("[DocCache] Failed to fetch candidate docs:", err.message);
    return docCache || [];
  }
}

// Time-bounded $vectorSearch wrapper (rejects after 1200ms if Atlas hangs)
async function executeVectorSearchWithTimeout(pipeline, timeoutMs = 1200) {
  let timerId;
  const timeoutPromise = new Promise((_, reject) => {
    timerId = setTimeout(() => reject(new Error(`Atlas $vectorSearch timed out after ${timeoutMs}ms`)), timeoutMs);
  });
  try {
    const res = await Promise.race([KnowledgeDoc.aggregate(pipeline).exec(), timeoutPromise]);
    clearTimeout(timerId);
    return res;
  } catch (err) {
    clearTimeout(timerId);
    throw err;
  }
}


// ─── English Stop Words ───────────────────────────────────────────────────────
const STOP_WORDS = new Set([
  "our", "the", "and", "for", "with", "that", "this", "from", "has", "have",
  "been", "were", "was", "will", "would", "could", "should", "your", "their",
  "its", "are", "is", "000", "department", "company", "system", "process",
  "solution", "using", "into", "over", "under", "about", "more", "most", "some",
  "help", "improve", "need", "want", "also", "when", "how", "what", "which"
]);

// ─── PART 2: Hybrid Score Weights ────────────────────────────────────────────
const HYBRID_WEIGHTS = {
  vectorSimilarity:     0.45,
  industryMatch:        0.20,
  departmentMatch:      0.15,
  businessFunctionMatch: 0.10,
  keywordMatch:         0.10
};

// ─── Normalize string for fuzzy matching ─────────────────────────────────────
function normStr(str = "") {
  return str.toLowerCase().replace(/[^a-z0-9\s]/g, " ").trim();
}

// ─── Cosine Similarity (in-memory fallback) ───────────────────────────────────
function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot   += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB) || 1);
}

// ─── Auto-detect industry from query text ─────────────────────────────────────
function detectQueryIndustry(queryText) {
  const q = queryText.toLowerCase();
  if (q.includes("finan") || q.includes("invoic") || q.includes("accoun") || q.includes("payable") || q.includes("erp")) return "Finance & Accounting";
  if (q.includes("health") || q.includes("patient") || q.includes("triage") || q.includes("clinic") || q.includes("hospital")) return "Healthcare & Life Sciences";
  if (q.includes("manuf") || q.includes("factory") || q.includes("plant") || q.includes("quality control")) return "Manufacturing";
  if (q.includes("retail") || q.includes("demand") || q.includes("inventory") || q.includes("store")) return "Retail & E-Commerce";
  if (q.includes("bank") || q.includes("loan") || q.includes("credit") || q.includes("kyc") || q.includes("aml")) return "Banking & Capital Markets";
  if (q.includes("insur") || q.includes("claim") || q.includes("underwr") || q.includes("premium")) return "Insurance";
  if (q.includes("logistics") || q.includes("fleet") || q.includes("shipment") || q.includes("warehouse")) return "Logistics & Supply Chain";
  if (q.includes("edu") || q.includes("student") || q.includes("learning") || q.includes("course")) return "Education";
  if (q.includes("telecom") || q.includes("network") || q.includes("tower") || q.includes("churn")) return "Telecommunications";
  if (q.includes("energy") || q.includes("utility") || q.includes("grid") || q.includes("solar")) return "Energy & Utilities";
  if (q.includes("legal") || q.includes("contract") || q.includes("compliance") || q.includes("litigation")) return "Legal Services";
  if (q.includes("real estate") || q.includes("property") || q.includes("tenant") || q.includes("mortgage")) return "Real Estate";
  if (q.includes("hotel") || q.includes("hospitality") || q.includes("guest") || q.includes("booking")) return "Hospitality & Tourism";
  if (q.includes("hr") || q.includes("recruit") || q.includes("payroll") || q.includes("workforce")) return "Human Resources";
  if (q.includes("helpdesk") || q.includes("ticket") || q.includes("incident") || q.includes("software") || q.includes("devops")) return "Information Technology & Software Services";
  if (q.includes("government") || q.includes("public sector") || q.includes("citizen") || q.includes("municipal")) return "Government & Public Sector";
  return null;
}

/**
 * PART 2: Compute hybrid retrieval score for a single document.
 * FinalScore = 0.45 VectorSim + 0.20 Industry + 0.15 Dept + 0.10 BizFunction + 0.10 Keyword
 */
function computeHybridScore(doc, queryKeywords, targetIndustry, targetDepartment, businessFunctions) {
  const rawVector = typeof doc.score === "number" ? doc.score : 0.25;
  const vectorContrib = rawVector * HYBRID_WEIGHTS.vectorSimilarity;

  // Industry match
  const docInd = normStr(doc.industry || "");
  const tgtInd = normStr(targetIndustry || "");
  let indScore = 0;
  if (tgtInd && docInd) {
    if (docInd === tgtInd) indScore = 1.0;
    else if (docInd.includes(tgtInd.split(" ")[0]) || tgtInd.includes(docInd.split(" ")[0])) indScore = 0.5;
  }
  const indContrib = indScore * HYBRID_WEIGHTS.industryMatch;

  // Department match
  const docDept = normStr(doc.department || doc.category || "");
  const tgtDept = normStr(targetDepartment || "");
  let deptScore = 0;
  if (tgtDept && docDept) {
    if (docDept.includes(tgtDept) || tgtDept.includes(docDept)) deptScore = 1.0;
  }
  const deptContrib = deptScore * HYBRID_WEIGHTS.departmentMatch;

  // Business function match
  const docText = `${doc.title} ${(doc.keywords || []).join(" ")} ${doc.subcategory || ""} ${(doc.technologies || []).join(" ")} ${doc.summary || ""}`.toLowerCase();
  const fnMatches = (businessFunctions || []).filter((fn) => docText.includes(fn.toLowerCase()));
  const fnScore = businessFunctions?.length > 0 ? fnMatches.length / businessFunctions.length : 0;
  const fnContrib = fnScore * HYBRID_WEIGHTS.businessFunctionMatch;

  // Keyword match
  const kwMatches = queryKeywords.filter((kw) => docText.includes(kw));
  const kwScore = queryKeywords.length > 0 ? Math.min(kwMatches.length / queryKeywords.length, 1.0) : 0;
  const kwContrib = kwScore * HYBRID_WEIGHTS.keywordMatch;

  const hybridScore = Number((vectorContrib + indContrib + deptContrib + fnContrib + kwContrib).toFixed(4));

  return {
    hybridScore,
    breakdown: {
      vectorSimilarity:      Number(vectorContrib.toFixed(4)),
      industryMatch:         Number(indContrib.toFixed(4)),
      departmentMatch:       Number(deptContrib.toFixed(4)),
      businessFunctionMatch: Number(fnContrib.toFixed(4)),
      keywordMatch:          Number(kwContrib.toFixed(4))
    },
    rawVectorScore: Number(rawVector.toFixed(4))
  };
}

/**
 * Meaningful explanation of WHY a chunk was selected (semantic terms only).
 */
function generateWhySelectedReason(query, doc, businessFunctions, technologies) {
  const queryWords = (query.toLowerCase().match(/\b[a-z0-9]{4,}\b/g) || []).filter((w) => !STOP_WORDS.has(w));
  const docText = `${doc.title} ${(doc.keywords || []).join(" ")} ${doc.subcategory || ""} ${(doc.technologies || []).join(" ")} ${doc.summary || ""}`.toLowerCase();

  const matchedQueryTerms = queryWords.filter((w) => docText.includes(w)).slice(0, 3);
  const matchedFunctions = (businessFunctions || []).filter((fn) => docText.includes(fn.toLowerCase())).slice(0, 2);
  const matchedTech = (technologies || []).filter((t) => docText.includes(t.toLowerCase())).slice(0, 2);

  const reasons = [...matchedQueryTerms, ...matchedFunctions, ...matchedTech].filter(Boolean);
  if (reasons.length > 0) {
    return `Matched via: ${reasons.slice(0, 5).join(", ")} in ${doc.industry || "Enterprise"} domain`;
  }
  return `Matched via: ${doc.title} (${doc.industry || "Enterprise"} consulting use case)`;
}

/**
 * PART 7: Calculate Retrieval Quality Score for the final result set.
 */
function calculateRetrievalQuality(topChunks, targetIndustry, allRetrievedChunks) {
  if (!topChunks || topChunks.length === 0) {
    return { retrievalScore: 0, industryConfidence: 0, averageSimilarity: 0, documentDiversity: 0, evidenceCoverage: 0 };
  }

  // Industry confidence: % of top chunks that match target industry
  const indMatches = topChunks.filter((c) => {
    const docInd = normStr(c.metadata?.industry || "");
    const tgtInd = normStr(targetIndustry || "");
    return docInd.includes(tgtInd.split(" ")[0]) || tgtInd.includes(docInd.split(" ")[0]);
  });
  const industryConfidence = Math.round((indMatches.length / topChunks.length) * 100);

  // Average similarity of top chunks
  const avgSim = topChunks.reduce((sum, c) => sum + (c.rawScore || 0), 0) / topChunks.length;
  const averageSimilarity = Math.round(avgSim * 100);

  // Document diversity: unique sources / total top chunks
  const uniqueSources = new Set(topChunks.map((c) => c.metadata?.source)).size;
  const documentDiversity = Math.round((uniqueSources / topChunks.length) * 100);

  // Evidence coverage: top chunks / total retrieved
  const evidenceCoverage = allRetrievedChunks.length > 0
    ? Math.round((topChunks.length / allRetrievedChunks.length) * 100)
    : 0;

  // Overall retrieval score (weighted composite)
  const retrievalScore = Math.round(
    industryConfidence * 0.40 +
    averageSimilarity  * 0.30 +
    documentDiversity  * 0.20 +
    evidenceCoverage   * 0.10
  );

  return { retrievalScore, industryConfidence, averageSimilarity, documentDiversity, evidenceCoverage };
}

// ─────────────────────────────────────────────────────────────────────────────
// PRIMARY SEARCH FUNCTION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Perform hybrid vector + keyword search with metadata pre-filtering.
 *
 * @param {string} queryText        - Query string
 * @param {object} options          - { industry, department, businessFunctions, limit, strictIndustryFilter, industryConfidence }
 * @returns {Promise<Array>}
 */
async function searchVectorKnowledgeBase(queryText, options = {}) {
  const {
    limit = 5,
    strictIndustryFilter = true,
    businessFunctions = [],
    industryConfidence = 70,
    queryEmbedding: precomputedEmbedding
  } = options;

  let targetIndustry  = options.industry  || detectQueryIndustry(queryText);
  let targetDepartment = options.department || "";

  if (!queryText || typeof queryText !== "string") {
    throw new Error("A valid search query string is required.");
  }

  const startTime = Date.now();

  // Generate query embedding if not provided
  const embedStart = Date.now();
  const queryEmbedding = precomputedEmbedding || (await generateEmbedding(queryText));
  const embedTimeMs = Date.now() - embedStart;

  // Derive meaningful keywords from query (no stop words)
  const queryKeywords = (queryText.toLowerCase().match(/\b[a-z0-9]{4,}\b/g) || [])
    .filter((w) => !STOP_WORDS.has(w));

  const searchStart = Date.now();
  let searchResults = [];

  // ── PART 4: Apply metadata pre-filter if industry confidence >= threshold ──
  try {
    const filterConditions = {};
    const shouldFilter = targetIndustry && targetIndustry !== "All" && strictIndustryFilter && industryConfidence >= 70;

    if (shouldFilter) {
      const lowerInd = targetIndustry.toLowerCase();
      let canonicalIndustry = targetIndustry;

      if (lowerInd.includes("manuf"))                            canonicalIndustry = "Manufacturing";
      else if (lowerInd.includes("finan") || lowerInd.includes("accoun")) canonicalIndustry = "Finance & Accounting";
      else if (lowerInd.includes("health") || lowerInd.includes("medic")) canonicalIndustry = "Healthcare & Life Sciences";
      else if (lowerInd.includes("retail") || lowerInd.includes("e-com")) canonicalIndustry = "Retail & E-Commerce";
      else if (lowerInd.includes("bank") || lowerInd.includes("capital")) canonicalIndustry = "Banking & Capital Markets";
      else if (lowerInd.includes("insur"))                       canonicalIndustry = "Insurance";
      else if (lowerInd.includes("logist") || lowerInd.includes("supply")) canonicalIndustry = "Logistics & Supply Chain";
      else if (lowerInd.includes("edu"))                         canonicalIndustry = "Education";
      else if (lowerInd.includes("energy") || lowerInd.includes("util"))  canonicalIndustry = "Energy & Utilities";
      else if (lowerInd.includes("telecom"))                     canonicalIndustry = "Telecommunications";
      else if (lowerInd.includes("legal"))                       canonicalIndustry = "Legal Services";
      else if (lowerInd.includes("real estate") || lowerInd.includes("property")) canonicalIndustry = "Real Estate";
      else if (lowerInd.includes("hotel") || lowerInd.includes("hospit")) canonicalIndustry = "Hospitality & Tourism";
      else if (lowerInd.includes(" hr") || lowerInd.includes("human res")) canonicalIndustry = "Human Resources";
      else if (lowerInd.includes("it ") || lowerInd.includes("tech") || lowerInd.includes("soft")) canonicalIndustry = "Information Technology & Software Services";
      else if (lowerInd.includes("gov") || lowerInd.includes("public")) canonicalIndustry = "Government & Public Sector";

      filterConditions.industry = canonicalIndustry;
    }

    const vectorPipeline = [
      {
        $vectorSearch: {
          index: "vector_index",
          path: "embedding",
          queryVector: queryEmbedding,
          numCandidates: 120,
          limit: limit * 8,
          ...(Object.keys(filterConditions).length > 0 && { filter: filterConditions })
        }
      },
      {
        $project: {
          _id: 1, documentId: 1, chunkNumber: 1, title: 1,
          industry: 1, department: 1, subcategory: 1, category: 1,
          businessProcess: 1, source: 1, summary: 1, excerpt: 1,
          content: 1, keywords: 1, technologies: 1, tokenCount: 1,
          embeddingModel: 1,
          score: { $meta: "vectorSearchScore" }
        }
      }
    ];

    searchResults = await executeVectorSearchWithTimeout(vectorPipeline, 1200);

    // If pre-filtered vector search yielded 0 results, retry without industry filter before fallback
    if ((!searchResults || searchResults.length === 0) && Object.keys(filterConditions).length > 0) {
      const fallbackPipeline = [
        {
          $vectorSearch: {
            index: "vector_index",
            path: "embedding",
            queryVector: queryEmbedding,
            numCandidates: 120,
            limit: limit * 8
          }
        },
        {
          $project: {
            _id: 1, documentId: 1, chunkNumber: 1, title: 1,
            industry: 1, department: 1, subcategory: 1, category: 1,
            businessProcess: 1, source: 1, summary: 1, excerpt: 1,
            content: 1, keywords: 1, technologies: 1, tokenCount: 1,
            embeddingModel: 1,
            score: { $meta: "vectorSearchScore" }
          }
        }
      ];
      searchResults = await executeVectorSearchWithTimeout(fallbackPipeline, 1200);
    }
  } catch (err) {
    console.warn("Atlas $vectorSearch fallback mode:", err.message);
  }

  // Fast In-Memory Fallback using Node.js cached docs (0ms latency, zero DB hangs)
  if (!searchResults || searchResults.length === 0) {
    const candidateDocs = await getCachedKnowledgeDocs();
    searchResults = candidateDocs.map((doc) => {
      let vecScore = 0;
      if (doc.embedding && doc.embedding.length === queryEmbedding.length) {
        vecScore = cosineSimilarity(queryEmbedding, doc.embedding);
      }
      return { ...doc, score: vecScore };
    });
  }

  const vectorSearchTimeMs = Date.now() - searchStart;

  // ── PART 2: Compute Hybrid Score for every result ─────────────────────────
  const scoredDocs = searchResults.map((doc) => {
    const { hybridScore, breakdown, rawVectorScore } = computeHybridScore(
      doc, queryKeywords, targetIndustry, targetDepartment, businessFunctions
    );

    // Cross-domain detection: cap similarity for wrong-domain docs
    const docInd = normStr(doc.industry || "");
    const tgtInd = normStr(targetIndustry || "");
    const isCrossDomain = tgtInd && !docInd.includes(tgtInd.split(" ")[0]) && !tgtInd.includes(docInd.split(" ")[0]);

    const similarityPercentage = isCrossDomain
      ? Math.min(Math.round(rawVectorScore * 100), 42)
      : Math.min(Math.round(hybridScore * 100), 96);

    const matchedKeywords = (doc.keywords || [])
      .filter((k) => queryKeywords.includes(k.toLowerCase()) && !STOP_WORDS.has(k.toLowerCase()));

    const whySelected = generateWhySelectedReason(queryText, doc, businessFunctions, doc.technologies || []);

    return {
      rawScore:            rawVectorScore,
      hybridScore,
      hybridBreakdown:     breakdown,
      similarityPercentage,
      isCrossDomain,
      targetIndustry,
      matchedKeywords:     matchedKeywords.length > 0 ? matchedKeywords : (doc.keywords?.slice(0, 4) || []),
      whySelected,
      metadata: {
        id:              doc._id,
        documentId:      doc.documentId || `doc_${doc.source}`,
        chunkNumber:     doc.chunkNumber || 1,
        title:           doc.title,
        industry:        doc.industry,
        department:      doc.department || "Operations",
        subcategory:     doc.subcategory || doc.category || "General",
        category:        doc.category || "General",
        businessProcess: doc.businessProcess || "Workflow",
        source:          doc.source,
        summary:         doc.summary || "",
        excerpt:         doc.excerpt || (doc.content?.substring(0, 350) + "..."),
        technologies:    doc.technologies || [],
        keywords:        doc.keywords || [],
        tokenCount:      doc.tokenCount || 400,
        embeddingModel:  doc.embeddingModel || "text-embedding-3-small"
      },
      content: doc.content
    };
  });

  // Sort: same-domain first, then by hybridScore descending
  scoredDocs.sort((a, b) => {
    if (a.isCrossDomain !== b.isCrossDomain) return a.isCrossDomain ? 1 : -1;
    return b.hybridScore - a.hybridScore;
  });

  // ── PART 3: Diversity Filter — max 2 chunks per source document ───────────
  const sourceCountMap = new Map();
  const MAX_CHUNKS_PER_SOURCE = 2; // Was 3 — stricter for diversity
  const diverseResults = [];

  for (const doc of scoredDocs) {
    const src = doc.metadata.source;
    const count = sourceCountMap.get(src) || 0;
    if (count < MAX_CHUNKS_PER_SOURCE) {
      sourceCountMap.set(src, count + 1);
      diverseResults.push(doc);
    }
    if (diverseResults.length >= limit) break;
  }

  const totalTimeMs = Date.now() - startTime;

  console.log(`📊 [HybridSearch] "${queryText}" | ${targetIndustry || "All"} | Embed:${embedTimeMs}ms Search:${vectorSearchTimeMs}ms Total:${totalTimeMs}ms`);
  diverseResults.forEach((d, i) => {
    console.log(`   #${i + 1}: [${d.metadata.source} ·chunk${d.metadata.chunkNumber}] ${d.metadata.title} hybrid=${d.hybridScore} vec=${d.rawScore}`);
  });

  return diverseResults;
}

// ─────────────────────────────────────────────────────────────────────────────
// STAGE 2 — MULTI-QUERY SEARCH (upgraded with hybrid scoring + diversity)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Run multiple queries in parallel, merge, deduplicate, and return Top N.
 *
 * @param {string[]} searchQueries  - 10-15 queries from contextExtractionService
 * @param {string}   industry       - Target industry
 * @param {number}   totalLimit     - Max chunks to return (default 15)
 * @param {object}   context        - Full business context for metadata filtering
 * @returns {Promise<object>}        { chunks, queryStats }
 */
async function searchWithMultipleQueries(searchQueries, industry, totalLimit = 15, context = {}) {
  if (!Array.isArray(searchQueries) || searchQueries.length === 0) {
    throw new Error("searchWithMultipleQueries: searchQueries must be a non-empty array.");
  }

  const start = Date.now();
  const perQueryLimit = Math.max(8, Math.ceil(totalLimit * 0.7));
  const industryConfidence = context.metadataFilters?.industryConfidence ?? 70;
  const department = context.department || "";
  const businessFunctions = context.businessFunctions || [];

  console.log(`\n🔍 [MultiQuerySearch] ${searchQueries.length} queries | industry:${industry} | confidence:${industryConfidence}%`);

  // Run up to first 12 queries
  const queriesToRun = searchQueries.slice(0, 12);

  // Batch generate all query embeddings in a single OpenAI request (10x speedup)
  const embedBatchStart = Date.now();
  const precomputedEmbeddings = await generateEmbeddingsBatch(queriesToRun);
  console.log(`⚡ [MultiQuerySearch] Batch embedded ${queriesToRun.length} queries in ${Date.now() - embedBatchStart}ms`);

  const queryStats = [];
  const queryResults = await Promise.all(
    queriesToRun.map(async (query, idx) => {
      const qStart = Date.now();
      try {
        const results = await searchVectorKnowledgeBase(query, {
          limit: perQueryLimit,
          industry,
          department,
          businessFunctions,
          strictIndustryFilter: true,
          industryConfidence,
          queryEmbedding: precomputedEmbeddings[idx]
        });
        const elapsed = Date.now() - qStart;
        queryStats.push({ query, resultCount: results.length, timeMs: elapsed });
        console.log(`   Q${idx + 1}: "${query}" → ${results.length} results (${elapsed}ms)`);
        return results;
      } catch (err) {
        console.warn(`   Q${idx + 1} failed: "${query}" — ${err.message}`);
        queryStats.push({ query, resultCount: 0, timeMs: 0, error: err.message });
        return [];
      }
    })
  );

  // Merge all results, deduplicate by source::chunkNumber
  // Keep the best hybridScore when the same chunk appears from multiple queries
  const chunkMap = new Map();
  for (const results of queryResults) {
    for (const chunk of results) {
      const key = `${chunk.metadata?.source}::${chunk.metadata?.chunkNumber}`;
      const existing = chunkMap.get(key);
      if (!existing || chunk.hybridScore > existing.hybridScore) {
        chunkMap.set(key, chunk);
      }
    }
  }

  // Convert to array, sort by hybridScore descending
  const merged = Array.from(chunkMap.values());
  merged.sort((a, b) => (b.hybridScore || b.rawScore || 0) - (a.hybridScore || a.rawScore || 0));

  // Apply global diversity filter on merged set
  const sourceCountMap = new Map();
  const MAX_PER_SOURCE = 2;
  const diverseTop = [];

  for (const chunk of merged) {
    const src = chunk.metadata?.source;
    const count = sourceCountMap.get(src) || 0;
    if (count < MAX_PER_SOURCE) {
      sourceCountMap.set(src, count + 1);
      diverseTop.push(chunk);
    }
    if (diverseTop.length >= totalLimit) break;
  }

  const totalMs = Date.now() - start;
  const uniqueSources = new Set(diverseTop.map((c) => c.metadata?.source)).size;

  console.log(`✅ [MultiQuerySearch] ${merged.length} raw → ${diverseTop.length} diverse (${uniqueSources} sources) in ${totalMs}ms`);

  return { chunks: diverseTop, queryStats, totalMs };
}

// ─────────────────────────────────────────────────────────────────────────────
// PART 6: Evidence Aggregation — merge related chunks into blocks
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Group related chunks from the same source document into evidence blocks.
 * Chunks from the same .md file are merged into a single rich evidence block.
 *
 * @param {Array} topChunks - Top 5 reranked chunks
 * @returns {Array} evidenceBlocks - Merged evidence objects
 */
function aggregateEvidenceBlocks(topChunks) {
  const groups = new Map();

  for (const chunk of topChunks) {
    const key = chunk.metadata?.source;
    if (!groups.has(key)) {
      groups.set(key, {
        source:      chunk.metadata.source,
        title:       chunk.metadata.title,
        industry:    chunk.metadata.industry,
        department:  chunk.metadata.department,
        technologies: chunk.metadata.technologies || [],
        summary:     chunk.metadata.summary,
        chunkIds:    [],
        content:     "",
        hybridScore: chunk.hybridScore || chunk.rawScore || 0,
        chunks:      []
      });
    }
    const group = groups.get(key);
    group.chunkIds.push(chunk.metadata.chunkNumber);
    group.chunks.push(chunk);
    // Merge content (avoid repeating identical text)
    const newContent = chunk.content?.substring(0, 800) || "";
    if (!group.content.includes(newContent.substring(0, 100))) {
      group.content += (group.content ? "\n\n---\n\n" : "") + newContent;
    }
    // Keep highest hybridScore
    if ((chunk.hybridScore || 0) > group.hybridScore) group.hybridScore = chunk.hybridScore || 0;
  }

  const blocks = Array.from(groups.values());
  blocks.sort((a, b) => b.hybridScore - a.hybridScore);

  console.log(`📦 [EvidenceAggregation] ${topChunks.length} chunks → ${blocks.length} evidence blocks`);
  return blocks;
}

module.exports = {
  searchVectorKnowledgeBase,
  searchWithMultipleQueries,
  aggregateEvidenceBlocks,
  calculateRetrievalQuality,
  computeHybridScore,
  cosineSimilarity,
  HYBRID_WEIGHTS
};
