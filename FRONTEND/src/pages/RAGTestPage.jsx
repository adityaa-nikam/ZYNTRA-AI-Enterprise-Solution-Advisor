import { useState } from "react";
import api from "../services/api";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

function RAGTestPage() {
  const [query, setQuery] = useState("Manual invoice processing");
  const [selectedIndustry, setSelectedIndustry] = useState("Finance & Accounting");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");

  const presetQueries = [
    { label: "Test 1: Finance", text: "Manual invoice processing", ind: "Finance & Accounting" },
    { label: "Test 2: Healthcare", text: "Patient scheduling and clinical triage", ind: "Healthcare & Life Sciences" },
    { label: "Test 3: Retail", text: "Demand forecasting and inventory stockout", ind: "Retail & E-Commerce" },
    { label: "Test 4: IT Helpdesk", text: "High customer support tickets and password resets", ind: "Information Technology & Software Services" },
    { label: "Test 5: Manufacturing", text: "Unplanned machine breakdown and predictive maintenance", ind: "Manufacturing" }
  ];

  const handleRunRetrievalTest = async (overrideQuery, overrideIndustry) => {
    const testQuery = overrideQuery || query;
    const testIndustry = overrideIndustry !== undefined ? overrideIndustry : selectedIndustry;

    if (!testQuery || !testQuery.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await api.post("/api/rag/test-search", {
        query: testQuery,
        industry: testIndustry !== "All" ? testIndustry : undefined,
        limit: 10
      });

      if (res.data.success) {
        setResults(res.data);
      } else {
        setError(res.data.message || "Vector retrieval test failed.");
      }
    } catch (err) {
      console.error("Retrieval Test Error:", err);
      setError("Failed to connect to MongoDB Atlas Vector Search API.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans flex flex-col justify-between">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-10 w-full flex-grow space-y-8">
        {/* Header Banner */}
        <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-6 md:p-8 space-y-3">
          <div className="flex items-center gap-2">
            <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold px-3 py-1 rounded">
              Vector Search Diagnostics
            </span>
            <span className="text-slate-400 text-xs font-mono">
              ZYNTRA AI · MongoDB Atlas Vector Search Lab
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl font-extrabold text-white font-heading">
            ZYNTRA RAG Retrieval Quality Tester
          </h1>
          <p className="text-slate-400 text-sm max-w-3xl">
            Test ZYNTRA AI semantic vector retrieval across enterprise consulting industries. Verify domain queries retrieve matching documents with similarity scores and source deduplication.
          </p>
        </div>

        {/* Query Input Form & Presets */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-3 space-y-2">
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                Enter Search Query or Business Challenge:
              </label>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleRunRetrievalTest()}
                placeholder="e.g. Manual invoice processing"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                Domain Industry Filter:
              </label>
              <select
                value={selectedIndustry}
                onChange={(e) => setSelectedIndustry(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-3 text-xs text-white outline-none focus:border-emerald-500 font-mono"
              >
                <option value="All">All Industries (Global Search)</option>
                <option value="Finance & Accounting">Finance & Accounting</option>
                <option value="Healthcare & Life Sciences">Healthcare & Life Sciences</option>
                <option value="Manufacturing">Manufacturing</option>
                <option value="Retail & E-Commerce">Retail & E-Commerce</option>
                <option value="Information Technology & Software Services">Information Technology</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => handleRunRetrievalTest()}
              disabled={loading || !query.trim()}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white font-bold text-sm px-8 py-3 rounded-xl transition flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Searching Vector Index...</span>
                </>
              ) : (
                <span>🚀 Run Retrieval Audit</span>
              )}
            </button>
          </div>

          {/* Benchmark Preset Test Buttons */}
          <div className="space-y-2 pt-2 border-t border-slate-700/60">
            <span className="text-[11px] font-mono font-bold text-slate-400 uppercase">
              Benchmark Verification Scenarios:
            </span>
            <div className="flex flex-wrap gap-2">
              {presetQueries.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setQuery(preset.text);
                    setSelectedIndustry(preset.ind);
                    handleRunRetrievalTest(preset.text, preset.ind);
                  }}
                  className="bg-slate-900 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs px-3.5 py-1.5 rounded-lg transition font-mono"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-950/80 border border-red-800 text-red-300 p-4 rounded-xl text-sm font-mono">
            ⚠️ {error}
          </div>
        )}

        {/* Results Render */}
        {results && (
          <div className="space-y-6">
            {/* Search Audit Metrics Ribbon */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
              <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700">
                <span className="text-slate-400 block text-[10px] uppercase">Retrieved Documents</span>
                <span className="text-emerald-400 font-bold text-lg">{results.count} Chunks</span>
              </div>
              <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700">
                <span className="text-slate-400 block text-[10px] uppercase">Vector Search Latency</span>
                <span className="text-blue-400 font-bold text-lg">{results.totalTimeMs} ms</span>
              </div>
              <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700">
                <span className="text-slate-400 block text-[10px] uppercase">Embedding Dimensions</span>
                <span className="text-amber-400 font-bold text-lg">{results.queryEmbeddingLength} Floats</span>
              </div>
              <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700">
                <span className="text-slate-400 block text-[10px] uppercase">Embedding Model</span>
                <span className="text-purple-400 font-bold text-lg">{results.embeddingModel}</span>
              </div>
            </div>

            {/* Top Ranked Retrieved Document Cards */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white font-mono flex items-center justify-between border-b border-slate-800 pb-2">
                <span>Top {results.documents?.length || 0} Ranked Vector Search Matches:</span>
                <span className="text-xs text-slate-400 font-normal">Sorted by Cosine Similarity</span>
              </h3>

              <div className="space-y-4">
                {(results.documents || []).map((doc, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-3 font-mono text-xs hover:border-emerald-500/50 transition"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-700/60 pb-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap text-[10px]">
                          <span className="bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded font-bold uppercase">
                            Rank #{idx + 1}
                          </span>
                          <span className="bg-blue-950 text-blue-300 border border-blue-800 px-2.5 py-0.5 rounded font-bold uppercase">
                            {doc.metadata.industry}
                          </span>
                          <span className="text-slate-400 font-mono">
                            📄 {doc.metadata.source} (Chunk #{doc.metadata.chunkNumber})
                          </span>
                        </div>

                        <h4 className="text-base font-bold text-white font-sans mt-1">
                          {doc.metadata.title}
                        </h4>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <div className={`px-3 py-1 rounded-full text-xs font-bold border ${
                          doc.similarityPercentage > 70
                            ? "bg-emerald-900/80 text-emerald-300 border-emerald-700"
                            : doc.similarityPercentage > 40
                            ? "bg-amber-900/80 text-amber-300 border-amber-700"
                            : "bg-slate-900 text-slate-400 border-slate-700"
                        }`}>
                          🎯 {doc.similarityPercentage}% Match
                        </div>
                        <div className="bg-slate-900 text-slate-400 border border-slate-700 px-2.5 py-1 rounded text-[10px]">
                          Raw: {doc.rawScore}
                        </div>
                      </div>
                    </div>

                    {/* Why Selected Match Reasoning */}
                    {doc.whySelected && (
                      <div className="bg-slate-900 text-emerald-400 p-2.5 rounded-lg border border-slate-700 text-xs font-sans">
                        ✓ {doc.whySelected}
                      </div>
                    )}

                    {/* Real Document Excerpt */}
                    <div className="bg-slate-950 p-4 rounded-lg border border-slate-900 text-slate-300 font-sans text-xs leading-relaxed">
                      <span className="text-slate-500 font-mono text-[10px] block mb-1 uppercase tracking-wider">
                        Retrieved Document Chunk Excerpt:
                      </span>
                      <p className="italic">{doc.metadata.excerpt || doc.content.substring(0, 350) + "..."}</p>
                    </div>

                    {/* Matched Keywords */}
                    {doc.matchedKeywords?.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                        <span className="text-slate-500 uppercase font-bold">Keywords:</span>
                        {doc.matchedKeywords.map((kw, kIdx) => (
                          <span key={kIdx} className="bg-slate-900 text-indigo-300 border border-slate-700 px-2 py-0.5 rounded">
                            #{kw}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default RAGTestPage;
