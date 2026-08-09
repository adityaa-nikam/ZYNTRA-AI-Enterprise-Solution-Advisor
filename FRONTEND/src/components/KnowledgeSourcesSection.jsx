import { useState } from "react";
import { BookOpen, Code2, ChevronDown, CheckCircle, Database, Hash } from "lucide-react";

function KnowledgeSourcesSection({ sources = [] }) {
  const [devMode, setDevMode]           = useState(false);
  const [expandedIdx, setExpandedIdx]   = useState(null);

  if (!sources || sources.length === 0) return null;

  return (
    <div className="card p-8 animate-fadeInUp">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="section-header mb-0">
          <div className="section-header-icon bg-purple-50">
            <BookOpen size={16} className="text-purple-600" />
          </div>
          <div>
            <p className="section-header-title font-heading">ZYNTRA Knowledge Sources</p>
            <p className="section-header-subtitle">
              {sources.length} playbook document{sources.length !== 1 ? "s" : ""} retrieved · ZYNTRA RAG Grounded
            </p>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-[12px] font-medium ${!devMode ? "text-[#0F172A]" : "text-[#64748B]"}`}>Executive</span>
          <button
            onClick={() => setDevMode((v) => !v)}
            className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${devMode ? "bg-blue-600" : "bg-[#E2E8F0]"}`}
          >
            <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${devMode ? "translate-x-5" : "translate-x-0.5"}`} />
          </button>
          <span className={`text-[12px] font-medium flex items-center gap-1 ${devMode ? "text-blue-600" : "text-[#64748B]"}`}>
            <Code2 size={12} /> Developer
          </span>
        </div>
      </div>

      {/* Sources Grid */}
      <div className="space-y-3">
        {sources.map((src, i) => (
          <SourceCard
            key={i}
            src={src}
            index={i}
            devMode={devMode}
            expanded={expandedIdx === i}
            onToggle={() => setExpandedIdx(expandedIdx === i ? null : i)}
          />
        ))}
      </div>

      {/* Dev mode banner */}
      {devMode && (
        <div className="mt-4 flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
          <Code2 size={12} className="text-blue-600 shrink-0" />
          <p className="text-[11px] text-blue-700 font-medium">
            Developer mode active — showing raw vector scores, chunk IDs, and embedding metadata
          </p>
        </div>
      )}
    </div>
  );
}

function SourceCard({ src, index, devMode, expanded, onToggle }) {
  const similarityPct  = src.similarityPercentage || Math.round((src.hybridScore || src.rawScore || 0) * 100);
  const finalScore     = src.finalScore ? Number(src.finalScore).toFixed(3) : null;
  const industry       = src.industry || "Enterprise";
  const category       = src.category || "General Consulting";

  const scoreColor = similarityPct >= 90 ? "text-green-600" : similarityPct >= 75 ? "text-amber-600" : "text-red-600";
  const scoreBg    = similarityPct >= 90 ? "bg-green-50 border-green-200" : similarityPct >= 75 ? "bg-amber-50 border-amber-200" : "bg-red-50 border-red-200";

  return (
    <div className="border border-[#E2E8F0] rounded-xl overflow-hidden card-hover">
      {/* Row */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-[#F8FAFC] transition-colors"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Rank badge */}
          <div className="w-7 h-7 rounded-lg bg-purple-50 border border-purple-100 text-purple-700 text-[11px] font-bold flex items-center justify-center shrink-0">
            #{index + 1}
          </div>
          {/* Title + meta */}
          <div className="min-w-0">
            <p className="text-[14px] font-semibold text-[#0F172A] truncate">{src.title}</p>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="badge badge-slate text-[10px]">{industry}</span>
              <span className="badge badge-slate text-[10px]">{category}</span>
            </div>
          </div>
        </div>

        {/* Scores */}
        <div className="flex items-center gap-3 shrink-0">
          <div className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[12px] font-bold ${scoreBg} ${scoreColor}`}>
            <CheckCircle size={11} />
            {similarityPct}%
          </div>
          {devMode && finalScore && (
            <span className="text-[11px] font-mono text-[#64748B] bg-[#F8FAFC] border border-[#E2E8F0] px-2 py-0.5 rounded">
              score: {finalScore}
            </span>
          )}
          <ChevronDown size={15} className={`text-[#94A3B8] transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
        </div>
      </button>

      {/* Expanded Detail */}
      {expanded && (
        <div className="px-5 pb-5 pt-2 border-t border-[#F1F5F9] space-y-4 animate-fadeIn">
          {/* Executive View */}
          {!devMode ? (
            <div className="space-y-3">
              {src.excerpt || src.summary ? (
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-4">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] mb-2">Content Excerpt</p>
                  <p className="text-[13px] text-[#334155] leading-relaxed">{src.excerpt || src.summary}</p>
                </div>
              ) : null}
              {src.whySelected && (
                <div className="flex items-start gap-2 text-[13px] text-green-700 bg-green-50 border border-green-200 rounded-lg p-3">
                  <CheckCircle size={14} className="shrink-0 mt-0.5" />
                  <span>{src.whySelected}</span>
                </div>
              )}
            </div>
          ) : (
            /* Developer View */
            <div className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <DevField label="Source File" value={src.source} mono />
                <DevField label="Chunk Number" value={`#${src.chunkNumber || 1}`} mono />
                <DevField label="Embedding Model" value={src.embeddingModel || "text-embedding-3-small"} mono />
                <DevField label="Raw Score" value={src.rawScore || "N/A"} mono />
                <DevField label="Final Hybrid Score" value={finalScore || "N/A"} mono />
                <DevField label="Industry" value={industry} />
                {src.chunkId && <DevField label="Chunk ID" value={src.chunkId} mono />}
                {src.vectorId && <DevField label="Vector ID" value={src.vectorId} mono />}
              </div>
              {(src.hybridBreakdown || src.scoreBreakdown) && (
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] mb-2 flex items-center gap-1">
                    <Hash size={10} /> Score Breakdown
                  </p>
                  <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                    {Object.entries(src.hybridBreakdown || src.scoreBreakdown || {}).map(([k, v]) => (
                      <div key={k} className="text-center bg-white border border-[#E2E8F0] rounded p-2">
                        <p className="text-[9px] text-[#94A3B8] truncate">{k.replace(/([A-Z])/g, " $1")}</p>
                        <p className="text-[12px] font-bold text-blue-600 font-mono">{v}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {(src.excerpt || src.summary) && (
                <div className="bg-[#0F172A] rounded-lg p-3">
                  <p className="text-[10px] font-mono text-[#475569] mb-1 flex items-center gap-1">
                    <Database size={9} /> content_excerpt
                  </p>
                  <p className="text-[12px] font-mono text-[#94A3B8] leading-relaxed">{src.excerpt || src.summary}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DevField({ label, value, mono }) {
  return (
    <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-2.5">
      <p className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] mb-1">{label}</p>
      <p className={`text-[12px] text-[#334155] truncate ${mono ? "font-mono" : "font-medium"}`}>{value || "—"}</p>
    </div>
  );
}

export default KnowledgeSourcesSection;
