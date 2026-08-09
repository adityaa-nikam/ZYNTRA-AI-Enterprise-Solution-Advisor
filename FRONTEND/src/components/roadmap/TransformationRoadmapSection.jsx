import { useState } from "react";
import { LayoutList, Columns, Map, ChevronRight } from "lucide-react";
import RoadmapTimeline from "./RoadmapTimeline";
import RoadmapKanban from "./RoadmapKanban";

function TransformationRoadmapSection({ roadmap, totalROI, implementationTime }) {
  const [viewMode, setViewMode] = useState("timeline");

  if (!roadmap || !Array.isArray(roadmap) || roadmap.length === 0) return null;

  return (
    <section className="card p-8 animate-fadeInUp">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div className="section-header mb-0">
          <div className="section-header-icon bg-blue-50">
            <Map size={16} className="text-blue-600" />
          </div>
          <div>
            <p className="section-header-title">Implementation Roadmap</p>
            <p className="section-header-subtitle">
              {roadmap.length}-phase transformation journey
              {implementationTime ? ` · ${implementationTime}` : ""}
              {totalROI ? ` · +${totalROI}% projected ROI` : ""}
            </p>
          </div>
        </div>

        {/* View switcher */}
        <div className="flex items-center bg-[#F1F5F9] p-1 rounded-lg border border-[#E2E8F0] self-start">
          <ViewBtn active={viewMode === "timeline"} onClick={() => setViewMode("timeline")}>
            <LayoutList size={13} /> Timeline
          </ViewBtn>
          <ViewBtn active={viewMode === "kanban"} onClick={() => setViewMode("kanban")}>
            <Columns size={13} /> Kanban
          </ViewBtn>
        </div>
      </div>

      {/* Phase summary pills */}
      <div className="flex flex-wrap gap-2 mb-6">
        {roadmap.map((p, i) => (
          <div key={i} className="flex items-center gap-1.5 badge badge-slate text-[11px] py-1 px-2.5">
            <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
            {p.title || p.phase}
            {p.duration && <span className="text-[#94A3B8]">· {p.duration}</span>}
          </div>
        ))}
      </div>

      {viewMode === "timeline" ? (
        <RoadmapTimeline roadmap={roadmap} />
      ) : (
        <RoadmapKanban roadmap={roadmap} />
      )}
    </section>
  );
}

function ViewBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-semibold transition-colors
        ${active ? "bg-white text-[#0F172A] shadow-sm border border-[#E2E8F0]" : "text-[#64748B] hover:text-[#0F172A]"}`}
    >
      {children}
    </button>
  );
}

export default TransformationRoadmapSection;
