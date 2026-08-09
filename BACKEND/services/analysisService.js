/**
 * STAGE 6 — Analysis Orchestrator (Production Upgrade)
 *
 * Pipeline:
 *   1. extractBusinessContext()    — LLM Call 1: Structured context + 10-15 typed queries
 *   2. searchWithMultipleQueries() — Hybrid vector+keyword search, metadata pre-filter, diversity filter
 *   3. rerankChunks()              — Multi-signal reranker → Top 5 with source citations
 *   4. aggregateEvidenceBlocks()   — Merge related chunks into evidence blocks (PART 6)
 *   5. calculateRetrievalQuality() — Retrieval Quality Score (PART 7)
 *   6. generateReportFromEvidence()— LLM Call 2: Evidence-grounded report with citations (PART 5)
 *   7. validateReport()            — LLM Call 3: Evidence validation
 *   8. Return final report with full debug payload
 *
 * Backward-compatible: Returns the same shape as the old analyzeBusinessData().
 */

const { extractBusinessContext }                                  = require("./contextExtractionService");
const { searchWithMultipleQueries, aggregateEvidenceBlocks,
        calculateRetrievalQuality }                               = require("./vectorSearchService");
const { rerankChunks }                                            = require("./rerankService");
const { generateReportFromEvidence }                              = require("./aiService");
const { validateReport }                                          = require("./validationService");

// ─── Helper: categorize employee count & revenue ─────────────────────────────
function getEmployeeCategory(employees) {
  const n = Number(employees);
  if (n < 50)   return "Small Business";
  if (n < 250)  return "Medium Business";
  return "Large Enterprise";
}

function getRevenueCategory(revenue) {
  const n = Number(revenue);
  if (n < 10_000_000)  return "Low Revenue";
  if (n < 100_000_000) return "Growing Business";
  return "Enterprise";
}

function buildCompanySize(formData) {
  const empCat = getEmployeeCategory(formData.employees);
  return `${empCat} (${Number(formData.employees).toLocaleString()} employees)`;
}

/**
 * Run the full multi-stage RAG pipeline.
 *
 * @param {object}   formData   - { companyName, industry, employees, revenue, challenges }
 * @param {Function} onProgress - Callback: onProgress(message: string)
 * @returns {object}             Full analysis result compatible with frontend
 */
async function analyzeBusinessData(formData, onProgress = () => {}) {
  const pipelineStart = Date.now();
  const timings = {};

  const companyName      = formData.companyName;
  const employeeCategory = getEmployeeCategory(formData.employees);
  const revenueCategory  = getRevenueCategory(formData.revenue);
  const companySize      = buildCompanySize(formData);

  // ─── STAGE 1: Business Context Extraction ────────────────────────────────
  onProgress("Understanding business challenge...");
  console.log("\n═══ STAGE 1: Context Extraction ═══");
  const t1 = Date.now();
  const businessContext = await extractBusinessContext(formData);
  timings.contextExtractionMs = Date.now() - t1;

  onProgress(`Identifying department: ${businessContext.department}...`);
  onProgress(`Extracted ${businessContext.businessFunctions?.length || 0} business functions...`);
  onProgress(`Building ${businessContext.searchQueries?.length || 0} semantic search queries...`);

  console.log(`✅ Context extracted in ${timings.contextExtractionMs}ms`);
  console.log(`   Industry: ${businessContext.industry} | Dept: ${businessContext.department}`);
  console.log(`   Queries (${businessContext.searchQueries?.length}): ${businessContext.searchQueries?.join(", ")}`);

  // ─── STAGE 2: Multi-Query Hybrid Vector Search ───────────────────────────
  onProgress("Searching enterprise knowledge base...");
  console.log("\n═══ STAGE 2: Multi-Query Hybrid Search ═══");
  const t2 = Date.now();
  let retrievedChunks = [];
  let queryStats = [];
  try {
    const searchResult = await searchWithMultipleQueries(
      businessContext.searchQueries,
      businessContext.industry,
      15,
      businessContext   // Pass full context for metadata filtering
    );
    retrievedChunks = searchResult.chunks;
    queryStats = searchResult.queryStats || [];
  } catch (err) {
    console.warn("[Orchestrator] Vector search error, continuing with 0 chunks:", err.message);
  }
  timings.vectorSearchMs = Date.now() - t2;
  onProgress(`Retrieved ${retrievedChunks.length} enterprise documents from ${new Set(retrievedChunks.map(c => c.metadata?.source)).size} unique sources...`);
  console.log(`✅ Retrieved ${retrievedChunks.length} chunks in ${timings.vectorSearchMs}ms`);

  // ─── STAGE 3: Reranking ───────────────────────────────────────────────────
  onProgress("Ranking consulting case studies by relevance...");
  console.log("\n═══ STAGE 3: Reranking ═══");
  const t3 = Date.now();
  const { topChunks, allScores, rerankTimeMs, sourceCitations } = rerankChunks(businessContext, retrievedChunks, 5);
  timings.rerankMs = rerankTimeMs;
  onProgress(`Selected ${topChunks.length} strongest evidence documents from ${new Set(topChunks.map(c => c.metadata?.source)).size} sources...`);
  console.log(`✅ Reranked to Top ${topChunks.length} in ${rerankTimeMs}ms`);

  // ─── STAGE 4a: Evidence Aggregation (PART 6) ─────────────────────────────
  console.log("\n═══ STAGE 4a: Evidence Aggregation ═══");
  const evidenceBlocks = aggregateEvidenceBlocks(topChunks);

  // ─── STAGE 4b: Retrieval Quality Score (PART 7) ──────────────────────────
  const retrievalQuality = calculateRetrievalQuality(topChunks, businessContext.industry, retrievedChunks);
  console.log(`📊 [Quality] Score:${retrievalQuality.retrievalScore} Industry:${retrievalQuality.industryConfidence}% AvgSim:${retrievalQuality.averageSimilarity}% Diversity:${retrievalQuality.documentDiversity}%`);

  // ─── STAGE 4c: Report Generation ─────────────────────────────────────────
  onProgress("Generating enterprise recommendations from evidence...");
  console.log("\n═══ STAGE 4c: Report Generation ═══");
  const t4 = Date.now();
  let rawReport;
  try {
    rawReport = await generateReportFromEvidence(
      businessContext,
      topChunks,
      companyName,
      companySize,
      evidenceBlocks,   // PART 6: merged blocks
      sourceCitations   // PART 5: per-chunk citations
    );
  } catch (err) {
    console.error("[Orchestrator] Report generation failed:", err.message);
    throw err;
  }
  timings.reportGenerationMs = rawReport._llmLatencyMs || (Date.now() - t4);
  onProgress("Calculating ROI and building implementation roadmap...");
  console.log(`✅ Report generated in ${timings.reportGenerationMs}ms`);

  // ─── STAGE 5: Evidence Validation ────────────────────────────────────────
  onProgress("Validating recommendations against retrieved evidence...");
  console.log("\n═══ STAGE 5: Validation ═══");
  const t5 = Date.now();
  let validationResult;
  try {
    validationResult = await validateReport(rawReport, topChunks, businessContext);
  } catch (err) {
    console.warn("[Orchestrator] Validation failed, using raw report:", err.message);
    validationResult = {
      validatedReport: rawReport,
      confidenceScore: 75,
      requiresRegeneration: false,
      unsupportedClaims: [],
      validationNotes: "Validation skipped due to error.",
      evidenceUsed: topChunks.map((c) => c.metadata?.source).filter(Boolean),
      validationTimeMs: Date.now() - t5
    };
  }
  timings.validationMs = validationResult.validationTimeMs;
  onProgress("Finalizing executive report...");
  console.log(`✅ Validation complete. Confidence: ${validationResult.confidenceScore}%`);

  timings.totalMs = Date.now() - pipelineStart;

  // ─── BUILD SOURCES USED (frontend KnowledgeSources section) ──────────────
  const sourcesUsed = topChunks.map((chunk) => ({
    documentId:           chunk.metadata.documentId,
    chunkNumber:          chunk.metadata.chunkNumber,
    title:                chunk.metadata.title,
    source:               chunk.metadata.source,
    industry:             chunk.metadata.industry,
    category:             chunk.metadata.category,
    rawScore:             chunk.rawScore,
    hybridScore:          chunk.hybridScore,
    hybridBreakdown:      chunk.hybridBreakdown,
    finalScore:           chunk.finalScore,
    scoreBreakdown:       chunk.scoreBreakdown,
    similarityPercentage: chunk.similarityPercentage,
    whySelected:          chunk.whySelected,
    matchedKeywords:      chunk.matchedKeywords,
    summary:              chunk.metadata.summary,
    excerpt:              chunk.metadata.excerpt,
    embeddingModel:       chunk.metadata.embeddingModel
  }));

  // ─── FULL RAG DEBUG PAYLOAD ───────────────────────────────────────────────
  const ragDebug = {
    // Stage 1
    extractedContext:     businessContext,
    searchQueries:        businessContext.searchQueries,
    metadataFilters:      businessContext.metadataFilters,
    // Stage 2
    queryStats,
    retrievedCount:       retrievedChunks.length,
    retrievedChunks:      retrievedChunks.map((c) => ({
      title:      c.metadata?.title,
      source:     c.metadata?.source,
      industry:   c.metadata?.industry,
      rawScore:   c.rawScore,
      hybridScore: c.hybridScore,
      hybridBreakdown: c.hybridBreakdown
    })),
    // Stage 3
    rerankScores:         allScores,
    topChunks:            topChunks.map((c) => ({
      title:          c.metadata?.title,
      source:         c.metadata?.source,
      industry:       c.metadata?.industry,
      finalScore:     c.finalScore,
      hybridScore:    c.hybridScore,
      scoreBreakdown: c.scoreBreakdown
    })),
    sourceCitations,
    // Stage 4 — Evidence blocks
    evidenceBlocks:       evidenceBlocks.map((b) => ({
      source:      b.source,
      title:       b.title,
      industry:    b.industry,
      chunkIds:    b.chunkIds,
      hybridScore: b.hybridScore
    })),
    // Stage 4b — Quality score
    retrievalQuality,
    // Stage 5 — Validation
    confidenceScore:      validationResult.confidenceScore,
    unsupportedClaims:    validationResult.unsupportedClaims,
    validationNotes:      validationResult.validationNotes,
    evidenceUsed:         validationResult.evidenceUsed,
    // Timings
    timings,
    // Legacy fields for backward-compat with existing RAGDebugPanel
    searchQuery:          businessContext.searchQueries?.join("; "),
    queryEmbeddingLength: 1536,
    embeddingModel:       "text-embedding-3-small",
    vectorSearchMs:       timings.vectorSearchMs,
    llmLatencyMs:         timings.reportGenerationMs,
    totalPipelineMs:      timings.totalMs,
    promptInjectedLength: 0,
    promptInjectedSnippet: `Queries: ${businessContext.searchQueries?.join(", ")}\nTop Evidence: ${topChunks.map((c) => c.metadata?.title).join(", ")}`
  };

  // ─── ASSEMBLE FINAL RESPONSE ──────────────────────────────────────────────
  const finalReport = validationResult.validatedReport;

  console.log(`\n🏁 [Pipeline Complete] Total:${timings.totalMs}ms | Confidence:${validationResult.confidenceScore}% | Retrieval:${retrievalQuality.retrievalScore}`);
  console.log(`   Extract(${timings.contextExtractionMs}ms) Search(${timings.vectorSearchMs}ms) Rerank(${timings.rerankMs}ms) Generate(${timings.reportGenerationMs}ms) Validate(${timings.validationMs}ms)\n`);

  return {
    success: true,
    company: companyName,
    sourcesUsed,

    analysis: {
      industry: businessContext.industry,
      employeeCategory,
      revenueCategory,
      primaryChallenge: formData.challenges,

      executiveSummary:        finalReport.executiveSummary,
      sourcesUsed,

      painPoints:              finalReport.painPoints || [],
      painPointSeverity:       finalReport.painPointSeverity || [],

      recommendations:         finalReport.recommendations || [],

      businessMaturity:        finalReport.businessMaturity || {
        automationReadiness: 7, dataArchitecture: 6,
        processMaturity: 7,    securityGovernance: 8, aiAdoptionCapable: 8
      },

      digitalTransformationScore: finalReport.digitalTransformationScore ?? 78,
      riskScore:                  finalReport.riskScore ?? 4,

      implementationRoadmap:   finalReport.implementationRoadmap || [],
      roadmap:                 finalReport.roadmap || [],
      riskMitigation:          finalReport.riskMitigation || [],

      estimatedROI:            finalReport.estimatedROI,
      benchmarkEvidence:       finalReport.benchmarkEvidence,
      roiPercentage:           finalReport.roiPercentage ?? 25,
      annualSavingsUSD:        finalReport.annualSavingsUSD ?? 250000,

      implementationTime:      finalReport.implementationTime,
      implementationMonths:    finalReport.implementationMonths ?? 6,

      priority:                finalReport.priority,
      priorityScore:           finalReport.priorityScore ?? 8,

      suggestedTechStack:      finalReport.suggestedTechStack || [],
      nextSteps:               finalReport.nextSteps || [],

      // Full debug payload
      ragDebug,
      retrievalQuality,
      confidenceScore:         validationResult.confidenceScore,
      validationNotes:         validationResult.validationNotes,
      pipelineTimings:         timings
    }
  };
}

module.exports = { analyzeBusinessData };