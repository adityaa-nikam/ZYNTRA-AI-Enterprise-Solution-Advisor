import { useState } from "react";
import { CheckCircle, Clock, TrendingUp, DollarSign, ChevronDown, Check } from "lucide-react";

function RoadmapCard({ phaseItem, index }) {
  const [expanded, setExpanded] = useState(index === 0 || phaseItem.status === "current");

  const statusConfig = {
    completed: { label: "Completed",       cls: "badge-green" },
    current:   { label: "In Progress",     cls: "badge-blue" },
    upcoming:  { label: "Upcoming",        cls: "badge-amber" },
    future:    { label: "Future Phase",    cls: "badge-slate" },
  };
  const sc = statusConfig[phaseItem.status] || statusConfig.future;

  return (
    <div className={`timeline-item mb-5`}>
      {/* Timeline dot */}
      <div className={`timeline-dot border-2 text-[11px] font-bold
        ${phaseItem.status === "completed"
          ? "bg-green-50 border-green-400 text-green-700"
          : phaseItem.status === "current"
            ? "bg-blue-50 border-blue-500 text-blue-700"
            : "bg-white border-[#CBD5E1] text-[#94A3B8]"
        }`}>
        {phaseItem.status === "completed" ? <Check size={11} /> : index + 1}
      </div>

      {/* Card */}
      <div className="card overflow-hidden card-hover">
        {/* Header */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 text-left hover:bg-[#F8FAFC] transition-colors border-b border-[#F1F5F9]"
        >
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] bg-[#F1F5F9] px-2 py-1 rounded">
              {phaseItem.phase || `Phase ${index + 1}`}
            </span>
            <h4 className="text-[15px] font-bold text-[#0F172A]">{phaseItem.title}</h4>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {phaseItem.duration && (
              <span className="flex items-center gap-1 text-[12px] text-[#64748B] bg-white border border-[#E2E8F0] px-2.5 py-1 rounded-lg">
                <Clock size={11} /> {phaseItem.duration}
              </span>
            )}
            <span className={`badge ${sc.cls}`}>{sc.label}</span>
            <ChevronDown size={15} className={`text-[#94A3B8] transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
          </div>
        </button>

        {/* Body */}
        <div className="px-5 py-4">
          <p className="text-[13px] text-[#334155] leading-relaxed">{phaseItem.description}</p>

          {expanded && (
            <div className="space-y-4 mt-4 animate-fadeIn">
              {/* Deliverables */}
              {phaseItem.deliverables?.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] mb-2.5">Key Deliverables</p>
                  <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {phaseItem.deliverables.map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-[12px] text-[#334155] bg-[#F8FAFC] border border-[#E2E8F0] p-2.5 rounded-lg">
                        <CheckCircle size={13} className="text-green-500 shrink-0" />
                        <span className="truncate font-medium">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Metrics row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-[#F1F5F9]">
                <MetricMini icon={<TrendingUp size={11} />} label="Impact Score" value={`${phaseItem.impactScore || 8}/10`} color="blue" />
                <MetricMini icon={<Clock size={11} />} label="Difficulty" value={phaseItem.difficultyLevel || "Medium"} color="amber" />
                <MetricMini icon={<TrendingUp size={11} />} label="Expected ROI" value={`+${phaseItem.roiPercentage || 15}%`} color="green" />
                <MetricMini icon={<DollarSign size={11} />} label="Est. Cost" value={phaseItem.estimatedCostUSD ? `$${phaseItem.estimatedCostUSD.toLocaleString()}` : "Included"} color="slate" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricMini({ icon, label, value, color }) {
  const cols = { blue: "bg-blue-50 border-blue-100 text-blue-700", amber: "bg-amber-50 border-amber-100 text-amber-700", green: "bg-green-50 border-green-100 text-green-700", slate: "bg-[#F8FAFC] border-[#E2E8F0] text-[#334155]" };
  return (
    <div className={`p-2.5 rounded-lg border ${cols[color] || cols.slate}`}>
      <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider opacity-70 mb-1">{icon} {label}</div>
      <p className="text-[13px] font-bold">{value}</p>
    </div>
  );
}

export default RoadmapCard;
