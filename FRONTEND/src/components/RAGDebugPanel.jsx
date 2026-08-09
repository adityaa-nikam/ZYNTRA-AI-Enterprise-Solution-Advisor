import { useState } from "react";

/**
 * RAGDebugPanel — Extended Multi-Stage Pipeline Debug Console
 *
 * 11 tabs covering all pipeline stages:
 * 1. Timings       — Per-stage millisecond breakdown
 * 2. Quality       — Retrieval Quality Score (Part 7)
 * 3. Context       — Extracted business context
 * 4. Queries       — Generated search queries (10–15)
 * 5. Filters       — Metadata pre-filters + per-query stats (Part 4)
 * 6. Retrieved     — All retrieved chunks before reranking
 * 7. Hybrid Scores — Per-chunk 5-signal hybrid score breakdown (Part 2)
 * 8. Top 5 Ranked  — Final reranked scores with breakdown
 * 9. Evidence Blocks — Merged evidence blocks (Part 6)
 * 10. Validation   — Evidence validation result
 * 11. Evidence Used — Top 5 source citations
 */
function RAGDebugPanel({ ragDebug, sourcesUsed }) {
  const [isOpen, setIsOpen]       = useState(false);
  const [activeTab, setActiveTab] = useState("timings");

  if (!ragDebug && (!sourcesUsed || sourcesUsed.length === 0)) return null;

  const debug   = ragDebug || {};
  const context = debug.extractedContext || {};
  const timings = debug.timings || {};
  const quality = debug.retrievalQuality || {};

  const tabs = [
    { id: "timings",    label: "⏱ Timings" },
    { id: "quality",    label: "📊 Quality" },
    { id: "context",    label: "🧠 Context" },
    { id: "queries",    label: "🔍 Queries" },
    { id: "filters",    label: "🎛 Filters" },
    { id: "retrieved",  label: "📦 Retrieved" },
    { id: "hybrid",     label: "⚖️ Hybrid Scores" },
    { id: "reranked",   label: "🎯 Top 5 Ranked" },
    { id: "evidence",   label: "📎 Evidence Blocks" },
    { id: "validation", label: "✅ Validation" },
    { id: "sources",    label: "📚 Evidence Used" },
  ];

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="bg-purple-900/90 hover:bg-purple-800 text-purple-200 border border-purple-700 px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition shadow-sm flex items-center gap-2"
      >
        <span>🐞</span> RAG Debug Panel
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-5xl w-full text-slate-100 shadow-2xl p-6 space-y-4 max-h-[92vh] overflow-y-auto">

            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2 font-heading">
                  <span>🐞</span> ZYNTRA AI Multi-Stage RAG Debug Console
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  5-stage pipeline: Context Extraction → Multi-Query Hybrid Search → Reranking → Report → Validation
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white text-sm font-bold bg-slate-800 px-3 py-1 rounded"
              >
                ✕ Close
              </button>
            </div>

            {/* Quick Stats Ribbon */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-xs font-mono">
              <StatCard label="Embedding Model"   value={debug.embeddingModel || "text-embedding-3-small"} color="emerald" />
              <StatCard label="Retrieved Chunks"  value={`${debug.retrievedCount || 0} raw`}               color="blue" />
              <StatCard label="After Rerank"      value={`${(debug.topChunks || []).length} used`}         color="amber" />
              <StatCard label="Retrieval Quality" value={`${quality.retrievalScore || 0}/100`}             color="purple" />
              <StatCard label="Industry Match"    value={`${quality.industryConfidence || 0}%`}            color="emerald" />
              <StatCard label="Confidence Score"  value={`${debug.confidenceScore || 0}%`}                 color="blue" />
            </div>

            {/* Tab Nav */}
            <div className="flex flex-wrap gap-1 border-b border-slate-800 pb-2">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`px-3 py-1.5 rounded text-xs font-mono font-bold transition ${
                    activeTab === t.id
                      ? "bg-blue-700 text-white"
                      : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* ── Tab Content ─────────────────────────────────────────────── */}
            <div className="min-h-48">

              {/* TIMINGS */}
              {activeTab === "timings" && (
                <div className="space-y-3">
                  <SectionHeader>Pipeline Stage Timings</SectionHeader>
                  <table className="w-full text-xs font-mono border-collapse">
                    <thead>
                      <tr className="text-slate-400 border-b border-slate-700">
                        <th className="text-left py-2 pr-4">Stage</th>
                        <th className="text-right py-2">Time (ms)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ["1. Context Extraction (LLM Call 1)",    timings.contextExtractionMs],
                        ["2. Multi-Query Hybrid Search",           timings.vectorSearchMs],
                        ["3. Reranking",                           timings.rerankMs],
                        ["4. Report Generation (LLM Call 2)",     timings.reportGenerationMs],
                        ["5. Evidence Validation (LLM Call 3)",   timings.validationMs],
                        ["Total Pipeline",                         timings.totalMs],
                      ].map(([label, ms], i) => (
                        <tr key={i} className={`border-b border-slate-800 ${i === 5 ? "font-bold text-emerald-400" : "text-slate-300"}`}>
                          <td className="py-2 pr-4">{label}</td>
                          <td className="text-right py-2">{ms != null ? `${ms} ms` : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* QUALITY SCORE (Part 7) */}
              {activeTab === "quality" && (
                <div className="space-y-4">
                  <SectionHeader>Retrieval Quality Score (Part 7)</SectionHeader>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <QualityCard label="Overall Retrieval Score" value={quality.retrievalScore      || 0} color="emerald" />
                    <QualityCard label="Industry Confidence"     value={quality.industryConfidence  || 0} color="blue" />
                    <QualityCard label="Average Similarity"      value={quality.averageSimilarity   || 0} color="amber" />
                    <QualityCard label="Document Diversity"      value={quality.documentDiversity   || 0} color="purple" />
                    <QualityCard label="Evidence Coverage"       value={quality.evidenceCoverage    || 0} color="pink" />
                  </div>
                  <div className="bg-slate-800 p-3 rounded-lg border border-slate-700 text-xs font-mono text-slate-400 space-y-1">
                    <p className="text-slate-300 font-bold mb-2">Score Composition:</p>
                    <p>Overall = Industry Confidence (40%) + Avg Similarity (30%) + Diversity (20%) + Coverage (10%)</p>
                    <p className="text-emerald-400 mt-2">Score ≥ 80: Excellent | 60–79: Good | Below 60: Needs improvement</p>
                  </div>
                </div>
              )}

              {/* CONTEXT */}
              {activeTab === "context" && (
                <div className="space-y-3">
                  <SectionHeader>Extracted Business Context (Stage 1)</SectionHeader>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <ContextField label="Industry"           value={context.industry} />
                    <ContextField label="Department"         value={context.department} />
                    <ContextField label="Business Functions" value={(context.businessFunctions || []).join(", ")} />
                    <ContextField label="Current Systems"    value={(context.currentSystems || []).join(", ") || "None specified"} />
                  </div>
                  <div className="space-y-2">
                    <ListField label="Pain Points"    items={context.painPoints}    color="red" />
                    <ListField label="Business Goals" items={context.businessGoals} color="emerald" />
                    <ListField label="Technologies"   items={context.technologies}  color="blue" />
                  </div>
                </div>
              )}

              {/* QUERIES */}
              {activeTab === "queries" && (
                <div className="space-y-3">
                  <SectionHeader>Generated Search Queries — {(debug.searchQueries || []).length} queries (Stage 1 → Stage 2)</SectionHeader>
                  <p className="text-xs text-slate-400">
                    Structured queries across 5 types: keyword, semantic, business-function, technology, industry.
                  </p>
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {(debug.searchQueries || []).map((q, i) => (
                      <div key={i} className="flex items-center gap-3 bg-slate-800 p-3 rounded-lg border border-slate-700">
                        <span className="text-blue-400 font-mono font-bold text-xs shrink-0">Q{i + 1}</span>
                        <span className="text-slate-200 text-xs font-mono">"{q}"</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* METADATA FILTERS (Part 4) */}
              {activeTab === "filters" && (
                <div className="space-y-3">
                  <SectionHeader>Metadata Pre-Filters Applied (Part 4)</SectionHeader>
                  <p className="text-xs text-slate-400">
                    Applied to MongoDB before vector search when industryConfidence ≥ 70%.
                    Prevents Finance queries from returning Healthcare results.
                  </p>
                  {debug.metadataFilters ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <ContextField label="Industry Filter"     value={debug.metadataFilters.industry} />
                      <ContextField label="Department Filter"   value={debug.metadataFilters.department || "Not applied"} />
                      <ContextField label="Industry Confidence" value={`${debug.metadataFilters.industryConfidence || 0}%`} />
                    </div>
                  ) : (
                    <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 text-slate-400 text-xs font-mono">
                      No metadata filter data available. Submit a new assessment to see this.
                    </div>
                  )}
                  {(debug.queryStats || []).length > 0 && (
                    <div className="space-y-2 mt-2">
                      <p className="text-xs font-mono text-slate-300 font-bold">Per-Query Results ({debug.queryStats.length} queries run):</p>
                      <div className="space-y-1 max-h-52 overflow-y-auto">
                        {debug.queryStats.map((qs, i) => (
                          <div key={i} className="flex items-center gap-3 bg-slate-800/80 p-2.5 rounded border border-slate-700 text-xs font-mono">
                            <span className="text-blue-400 font-bold shrink-0 w-5">Q{i + 1}</span>
                            <span className="text-slate-300 flex-1 truncate">"{qs.query}"</span>
                            <span className={`font-bold shrink-0 ${qs.resultCount > 0 ? "text-emerald-400" : "text-red-400"}`}>
                              {qs.resultCount} results
                            </span>
                            <span className="text-slate-500 shrink-0">{qs.timeMs}ms</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* RETRIEVED CHUNKS */}
              {activeTab === "retrieved" && (
                <div className="space-y-3">
                  <SectionHeader>All {debug.retrievedCount || 0} Retrieved Chunks (Before Reranking)</SectionHeader>
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {(debug.retrievedChunks || []).map((c, i) => (
                      <div key={i} className="bg-slate-800/80 border border-slate-700 rounded-lg p-3 text-xs font-mono flex items-center gap-3">
                        <span className="text-slate-500 w-6 text-center shrink-0">#{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-slate-200 font-bold truncate">{c.title}</p>
                          <p className="text-slate-400 text-[10px]">{c.source} · {c.industry}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-amber-400 font-bold">vec: {Number(c.rawScore || 0).toFixed(3)}</p>
                          {c.hybridScore != null && (
                            <p className="text-emerald-400 text-[10px]">hyb: {c.hybridScore.toFixed(3)}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* HYBRID SCORES (Part 2) */}
              {activeTab === "hybrid" && (
                <div className="space-y-3">
                  <SectionHeader>Hybrid Retrieval Scores — All Retrieved Chunks (Part 2)</SectionHeader>
                  <p className="text-xs text-slate-400">
                    FinalScore = 0.45×Vector + 0.20×Industry + 0.15×Dept + 0.10×BizFunction + 0.10×Keyword
                  </p>
                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {(debug.retrievedChunks || []).map((c, i) => (
                      <div key={i} className="bg-slate-800/80 border border-slate-700 rounded-lg p-3 text-xs font-mono space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-200 font-bold truncate mr-2">#{i + 1} {c.title}</span>
                          <span className="text-emerald-400 font-bold shrink-0">
                            {c.hybridScore != null ? `hybrid: ${c.hybridScore.toFixed(3)}` : `vec: ${Number(c.rawScore || 0).toFixed(3)}`}
                          </span>
                        </div>
                        <p className="text-slate-400 text-[10px]">{c.source} · {c.industry}</p>
                        {c.hybridBreakdown && (
                          <div className="grid grid-cols-5 gap-1 text-[9px]">
                            {Object.entries(c.hybridBreakdown).map(([k, v]) => (
                              <div key={k} className="bg-slate-900 p-1 rounded border border-slate-700 text-center">
                                <p className="text-slate-500 truncate">{k.replace(/([A-Z])/g, " $1").replace("Match", "").trim()}</p>
                                <p className="text-blue-300 font-bold">{v}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                    {(debug.retrievedChunks || []).length === 0 && (
                      <div className="text-slate-400 text-xs font-mono p-4 bg-slate-800 rounded border border-slate-700">
                        No retrieved chunks yet. Submit a new assessment.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* RERANKED TOP 5 */}
              {activeTab === "reranked" && (
                <div className="space-y-3">
                  <SectionHeader>Reranked Top 5 (Stage 3)</SectionHeader>
                  <p className="text-xs text-slate-400">
                    Signals: Hybrid Score (50%) + Industry (20%) + Department (15%) + Business Function (10%) + Technology (5%)
                  </p>
                  <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                    {(debug.rerankScores || []).slice(0, 5).map((c, i) => (
                      <div key={i} className="bg-slate-800/90 border border-slate-700 rounded-xl p-4 text-xs font-mono space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-blue-300 font-bold">#{i + 1} {c.title}</span>
                          <span className="text-emerald-400 font-bold">finalScore: {c.finalScore}</span>
                        </div>
                        <p className="text-slate-400 text-[10px]">{c.source} · {c.industry}</p>
                        {c.scoreBreakdown && (
                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-[10px]">
                            {Object.entries(c.scoreBreakdown).map(([k, v]) => (
                              <div key={k} className="bg-slate-900 p-1.5 rounded border border-slate-700">
                                <p className="text-slate-400">{k.replace(/([A-Z])/g, " $1")}</p>
                                <p className="text-blue-300 font-bold">{v}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                    {(debug.rerankScores || []).length === 0 && (
                      <div className="text-slate-400 text-xs font-mono p-4 bg-slate-800 rounded border border-slate-700">
                        No rerank scores yet. Submit a new assessment.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* EVIDENCE BLOCKS (Part 6) */}
              {activeTab === "evidence" && (
                <div className="space-y-3">
                  <SectionHeader>Merged Evidence Blocks (Part 6)</SectionHeader>
                  <p className="text-xs text-slate-400">
                    Related chunks from the same source document are merged into a single rich block before being sent to the LLM.
                  </p>
                  <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                    {(debug.evidenceBlocks || []).map((b, i) => (
                      <div key={i} className="bg-slate-800/90 border border-slate-700 rounded-xl p-4 text-xs font-mono space-y-2">
                        <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
                          <span className="text-blue-300 font-bold">Block {i + 1}: {b.title}</span>
                          <span className="text-emerald-400 text-[10px] font-bold">
                            score: {b.hybridScore != null ? b.hybridScore.toFixed(3) : "—"}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-[10px] text-slate-400">
                          <p>Source: <span className="text-slate-200">{b.source}</span></p>
                          <p>Industry: <span className="text-slate-200">{b.industry}</span></p>
                          <p>Chunks merged: <span className="text-slate-200">{(b.chunkIds || []).join(", ")}</span></p>
                        </div>
                      </div>
                    ))}
                    {(!debug.evidenceBlocks || debug.evidenceBlocks.length === 0) && (
                      <div className="text-slate-400 text-xs font-mono p-4 bg-slate-800 rounded border border-slate-700">
                        No evidence blocks available. Submit a new assessment.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* VALIDATION */}
              {activeTab === "validation" && (
                <div className="space-y-3">
                  <SectionHeader>Evidence Validation Result (Stage 5)</SectionHeader>
                  <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                    <StatCard label="Confidence Score"  value={`${debug.confidenceScore || 0}%`}                            color="emerald" />
                    <StatCard label="Unsupported Claims" value={`${(debug.unsupportedClaims || []).length} removed`}         color="red" />
                  </div>
                  {debug.validationNotes && (
                    <div className="bg-slate-800 p-3 rounded-lg border border-slate-700 text-xs text-slate-300">
                      <span className="text-slate-400 font-mono block text-[10px] mb-1">// Validation Notes:</span>
                      {debug.validationNotes}
                    </div>
                  )}
                  {(debug.unsupportedClaims || []).length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs text-slate-400 font-mono">Removed / Modified Claims:</p>
                      {debug.unsupportedClaims.map((c, i) => (
                        <div key={i} className="bg-red-950/40 border border-red-800 p-2 rounded text-xs text-red-300">
                          ✕ {c}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* EVIDENCE USED (Sources) */}
              {activeTab === "sources" && (
                <div className="space-y-3">
                  <SectionHeader>Top Evidence Chunks Used ({sourcesUsed?.length || 0})</SectionHeader>
                  <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                    {(sourcesUsed || []).map((src, i) => (
                      <div key={i} className="bg-slate-800/90 border border-slate-700 rounded-xl p-4 text-xs font-mono space-y-2">
                        <div className="flex items-center justify-between text-blue-300 font-bold border-b border-slate-700/60 pb-2">
                          <span>Rank #{i + 1}: {src.title}</span>
                          <span className="text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800 text-[10px]">
                            {src.finalScore ? `Final: ${src.finalScore}` : `${src.similarityPercentage}% Match`}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-slate-400 bg-slate-900/60 p-2.5 rounded border border-slate-700/80">
                          <p>Doc: <span className="text-slate-200 font-bold">{src.source}</span></p>
                          <p>Chunk: <span className="text-slate-200 font-bold">#{src.chunkNumber || 1}</span></p>
                          <p>Industry: <span className="text-slate-200 font-bold">{src.industry}</span></p>
                          <p>Category: <span className="text-slate-200 font-bold">{src.category || "General"}</span></p>
                          <p>Raw Score: <span className="text-slate-200 font-bold">{src.rawScore}</span></p>
                          <p>Model: <span className="text-slate-200 font-bold">{src.embeddingModel || "text-embedding-3-small"}</span></p>
                        </div>
                        {src.whySelected && (
                          <p className="text-emerald-300 text-[11px] font-sans bg-slate-900 p-2 rounded border border-slate-700">
                            ✓ {src.whySelected}
                          </p>
                        )}
                        <div className="bg-slate-950 p-3 rounded text-[10px] text-slate-300 leading-relaxed font-sans max-h-24 overflow-y-auto">
                          <span className="text-slate-500 font-mono block mb-1">// Content Excerpt:</span>
                          {src.excerpt || src.summary}
                        </div>
                      </div>
                    ))}
                    {(!sourcesUsed || sourcesUsed.length === 0) && (
                      <div className="text-slate-400 text-xs font-mono p-4 bg-slate-800 rounded border border-slate-700">
                        No evidence sources available. Submit a new assessment.
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
            {/* ── End Tab Content ─────────────────────────────────────────── */}

          </div>
        </div>
      )}
    </>
  );
}

// ─── Reusable sub-components ─────────────────────────────────────────────────

function StatCard({ label, value, color = "blue" }) {
  const colors = {
    blue:    "text-blue-400",
    emerald: "text-emerald-400",
    amber:   "text-amber-400",
    purple:  "text-purple-400",
    red:     "text-red-400",
  };
  return (
    <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700 text-xs font-mono">
      <span className="text-slate-400 block text-[10px]">{label}</span>
      <span className={`${colors[color] || colors.blue} font-bold`}>{value}</span>
    </div>
  );
}

function SectionHeader({ children }) {
  return (
    <h4 className="text-sm font-bold text-slate-200 font-mono">{children}</h4>
  );
}

function ContextField({ label, value }) {
  return (
    <div className="bg-slate-800 p-3 rounded-lg border border-slate-700">
      <p className="text-slate-400 text-[10px] font-mono uppercase tracking-wider mb-1">{label}</p>
      <p className="text-slate-200 text-xs font-mono">{value || "—"}</p>
    </div>
  );
}

function ListField({ label, items = [], color = "blue" }) {
  const colors = {
    red:     "bg-red-950/40 text-red-300 border-red-800",
    emerald: "bg-emerald-950/40 text-emerald-300 border-emerald-800",
    blue:    "bg-blue-950/40 text-blue-300 border-blue-800",
  };
  return (
    <div className="bg-slate-800 p-3 rounded-lg border border-slate-700">
      <p className="text-slate-400 text-[10px] font-mono uppercase tracking-wider mb-2">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {(items || []).map((item, i) => (
          <span key={i} className={`text-[10px] font-mono px-2 py-0.5 rounded border ${colors[color] || colors.blue}`}>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function QualityCard({ label, value, max = 100, color = "emerald" }) {
  const pct = Math.min(Math.round((value / max) * 100), 100);
  const barColors = {
    emerald: "bg-emerald-500",
    blue:    "bg-blue-500",
    amber:   "bg-amber-500",
    purple:  "bg-purple-500",
    pink:    "bg-pink-500",
  };
  const textColors = {
    emerald: "text-emerald-400",
    blue:    "text-blue-400",
    amber:   "text-amber-400",
    purple:  "text-purple-400",
    pink:    "text-pink-400",
  };
  return (
    <div className="bg-slate-800 p-3 rounded-lg border border-slate-700 space-y-2">
      <div className="flex justify-between items-center">
        <p className="text-slate-400 text-[10px] font-mono uppercase tracking-wider">{label}</p>
        <p className={`text-sm font-bold font-mono ${textColors[color] || textColors.emerald}`}>{value}</p>
      </div>
      <div className="bg-slate-700 rounded-full h-1.5 overflow-hidden">
        <div
          className={`${barColors[color] || barColors.emerald} h-full rounded-full transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default RAGDebugPanel;
