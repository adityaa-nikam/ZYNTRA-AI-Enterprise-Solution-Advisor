/**
 * STAGE 3 — Reranker Service (Production Upgrade)
 *
 * Now uses the pre-computed hybridScore from vectorSearchService as Signal 1.
 * Adds final rerank signals on top for domain alignment verification.
 *
 * Score signals:
 *   hybridScore (from vector search)  × 0.50
 *   industryMatch                     × 0.20
 *   departmentMatch                   × 0.15
 *   businessFunctionOverlap           × 0.10
 *   technologyOverlap                 × 0.05
 *
 * Interface remains modular — replace scoreChunk() with a CrossEncoder/Cohere call.
 */

const WEIGHTS = {
  hybridScore:             0.50,  // Pre-computed hybrid score from vector + keyword signals
  industryMatch:           0.20,  // Exact or fuzzy industry match
  departmentMatch:         0.15,  // Department / business unit match
  businessFunctionOverlap: 0.10,  // Business function & keyword overlap
  technologyOverlap:       0.05   // Technology stack overlap
};

function normStr(str = "") {
  return str.toLowerCase().replace(/[^a-z0-9\s]/g, " ").trim();
}

function overlapRatio(setA = [], setB = []) {
  if (!setA.length || !setB.length) return 0;
  const lowerB = setB.map((s) => s.toLowerCase());
  const matches = setA.filter((item) =>
    lowerB.some((b) => b.includes(item.toLowerCase()) || item.toLowerCase().includes(b))
  );
  return Math.min(matches.length / Math.max(setA.length, 1), 1.0);
}

/**
 * Score a single chunk against business context for reranking.
 * Modular: replace with CrossEncoder or Cohere Rerank API by swapping this fn.
 */
function scoreChunk(chunk, context) {
  const breakdown = {};

  // ── Signal 1: Pre-computed hybrid score from vector search ────────────────
  const baseHybrid = Math.min(chunk.hybridScore || chunk.rawScore || 0.5, 1.0);
  breakdown.hybridScore = Number((baseHybrid * WEIGHTS.hybridScore).toFixed(4));

  // ── Signal 2: Industry Match ──────────────────────────────────────────────
  const docInd = normStr(chunk.metadata?.industry || "");
  const ctxInd = normStr(context.industry || "");
  let indScore = 0;
  if (docInd && ctxInd) {
    if (docInd === ctxInd) indScore = 1.0;
    else if (docInd.includes(ctxInd.split(" ")[0]) || ctxInd.includes(docInd.split(" ")[0])) indScore = 0.6;
  }
  breakdown.industryMatch = Number((indScore * WEIGHTS.industryMatch).toFixed(4));

  // ── Signal 3: Department Match ────────────────────────────────────────────
  const docDept = normStr(chunk.metadata?.department || chunk.metadata?.category || "");
  const ctxDept = normStr(context.department || "");
  let deptScore = 0;
  if (ctxDept && docDept) {
    if (docDept.includes(ctxDept) || ctxDept.includes(docDept)) deptScore = 1.0;
  }
  breakdown.departmentMatch = Number((deptScore * WEIGHTS.departmentMatch).toFixed(4));

  // ── Signal 4: Business Function & Keyword Overlap ─────────────────────────
  const docKeywords = [
    ...(chunk.metadata?.keywords || []),
    chunk.metadata?.title || "",
    chunk.metadata?.summary || ""
  ];
  const allContextTerms = [
    ...(context.businessFunctions || []),
    ...(context.painPoints || []).flatMap((p) => p.split(" ").filter((w) => w.length > 4)),
    ...(context.businessGoals || []).flatMap((g) => g.split(" ").filter((w) => w.length > 4))
  ];
  const fnOverlap = overlapRatio(allContextTerms, docKeywords);
  breakdown.businessFunctionOverlap = Number((fnOverlap * WEIGHTS.businessFunctionOverlap).toFixed(4));

  // ── Signal 5: Technology Overlap ──────────────────────────────────────────
  const docTech = chunk.metadata?.technologies || [];
  const ctxTech = context.technologies || [];
  const techOverlap = overlapRatio(ctxTech, [
    ...docTech,
    chunk.metadata?.title || "",
    (chunk.content || "").substring(0, 500)
  ]);
  breakdown.technologyOverlap = Number((techOverlap * WEIGHTS.technologyOverlap).toFixed(4));

  // ── Final score ───────────────────────────────────────────────────────────
  const finalScore = Number(Object.values(breakdown).reduce((s, v) => s + v, 0).toFixed(4));

  return { finalScore, scoreBreakdown: breakdown };
}

/**
 * PART 5: Build source citation for a chunk.
 * Every chunk gets: source, chunkId, similarity, confidence label.
 */
function buildSourceCitation(chunk) {
  const simPct = chunk.similarityPercentage || Math.round((chunk.hybridScore || chunk.rawScore || 0) * 100);
  const confidence = simPct >= 85 ? "High" : simPct >= 70 ? "Medium" : "Low";
  return {
    source:     chunk.metadata?.source,
    chunkId:    chunk.metadata?.chunkNumber,
    documentId: chunk.metadata?.documentId,
    similarity: simPct,
    confidence,
    title:      chunk.metadata?.title,
    industry:   chunk.metadata?.industry
  };
}

/**
 * Rerank retrieved chunks and return Top K with diversity guarantee.
 *
 * @param {object} businessContext - Extracted business context
 * @param {Array}  retrievedChunks - Top 15 chunks from multi-query search
 * @param {number} topK            - Number to keep (default 5)
 * @returns {object} { topChunks, allScores, rerankTimeMs, sourceCitations }
 */
function rerankChunks(businessContext, retrievedChunks, topK = 5) {
  const start = Date.now();

  if (!retrievedChunks || retrievedChunks.length === 0) {
    return { topChunks: [], allScores: [], rerankTimeMs: 0, sourceCitations: [] };
  }

  // Score every chunk
  const scored = retrievedChunks.map((chunk) => {
    const { finalScore, scoreBreakdown } = scoreChunk(chunk, businessContext);
    return { ...chunk, finalScore, scoreBreakdown };
  });

  // Sort by finalScore descending
  scored.sort((a, b) => b.finalScore - a.finalScore);

  // ── PART 3: Enforce diversity in final Top K (max 2 per source) ───────────
  const sourceCount = new Map();
  const MAX_PER_SOURCE = 2;
  const topChunks = [];

  for (const chunk of scored) {
    const src = chunk.metadata?.source;
    const count = sourceCount.get(src) || 0;
    if (count < MAX_PER_SOURCE) {
      sourceCount.set(src, count + 1);
      topChunks.push(chunk);
    }
    if (topChunks.length >= topK) break;
  }

  const allScores = scored.map((c) => ({
    title:          c.metadata?.title,
    source:         c.metadata?.source,
    industry:       c.metadata?.industry,
    finalScore:     c.finalScore,
    scoreBreakdown: c.scoreBreakdown,
    hybridScore:    c.hybridScore,
    rawVectorScore: c.rawScore
  }));

  // ── PART 5: Build source citations ────────────────────────────────────────
  const sourceCitations = topChunks.map(buildSourceCitation);

  const rerankTimeMs = Date.now() - start;
  const uniqueSources = new Set(topChunks.map((c) => c.metadata?.source)).size;

  console.log(`🎯 [Reranker] ${retrievedChunks.length} → Top${topK} (${uniqueSources} unique sources) in ${rerankTimeMs}ms`);
  topChunks.forEach((c, i) => {
    console.log(`   Top ${i + 1}: [${c.metadata?.source}·chunk${c.metadata?.chunkNumber}] ${c.metadata?.title} finalScore=${c.finalScore}`);
  });

  return { topChunks, allScores, rerankTimeMs, sourceCitations };
}

module.exports = { rerankChunks, scoreChunk, buildSourceCitation, WEIGHTS };
