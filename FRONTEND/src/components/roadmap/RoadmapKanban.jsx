import { CheckCircle, Clock } from "lucide-react";

function RoadmapKanban({ roadmap }) {
  if (!roadmap || !Array.isArray(roadmap) || roadmap.length === 0) return null;

  const columns = [
    { key: "completed", title: "Completed",     badge: "badge-green",  colBg: "bg-green-50/50 border-green-200" },
    { key: "current",   title: "In Progress",   badge: "badge-blue",   colBg: "bg-blue-50/50 border-blue-200" },
    { key: "upcoming",  title: "Upcoming",      badge: "badge-amber",  colBg: "bg-amber-50/50 border-amber-200" },
    { key: "future",    title: "Future Phases", badge: "badge-slate",  colBg: "bg-[#F8FAFC] border-[#E2E8F0]" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {columns.map((col) => {
        const items = roadmap.filter((item) => (item.status || "future") === col.key);
        return (
          <div key={col.key} className={`rounded-xl border p-3 ${col.colBg}`}>
            {/* Column Header */}
            <div className="flex items-center justify-between mb-3">
              <span className={`badge ${col.badge} text-[11px]`}>{col.title}</span>
              <span className="w-5 h-5 rounded-full bg-white border border-[#E2E8F0] text-[#64748B] text-[10px] font-bold flex items-center justify-center shadow-sm">
                {items.length}
              </span>
            </div>

            {/* Cards */}
            <div className="space-y-3 min-h-[180px]">
              {items.length === 0 ? (
                <div className="text-center py-8 text-[#94A3B8] text-[12px] border border-dashed border-[#CBD5E1] rounded-lg">
                  No phases
                </div>
              ) : (
                items.map((item, i) => (
                  <div key={i} className="bg-white border border-[#E2E8F0] rounded-xl p-3.5 shadow-sm space-y-2 card-hover">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">{item.phase}</span>
                      {item.duration && (
                        <span className="flex items-center gap-1 text-[10px] text-[#94A3B8]">
                          <Clock size={9} /> {item.duration}
                        </span>
                      )}
                    </div>
                    <h5 className="text-[13px] font-semibold text-[#0F172A] leading-snug">{item.title}</h5>
                    <p className="text-[12px] text-[#64748B] line-clamp-2 leading-relaxed">{item.description}</p>
                    {item.deliverables?.length > 0 && (
                      <div className="pt-2 border-t border-[#F1F5F9] space-y-1">
                        <p className="text-[9px] font-bold text-[#94A3B8] uppercase tracking-wider">Key Deliverables:</p>
                        {item.deliverables.slice(0, 2).map((d, di) => (
                          <div key={di} className="flex items-start gap-1.5 text-[11px] text-[#334155] font-medium">
                            <CheckCircle size={10} className="text-green-500 shrink-0 mt-0.5" />
                            <span className="line-clamp-1">{d}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default RoadmapKanban;
