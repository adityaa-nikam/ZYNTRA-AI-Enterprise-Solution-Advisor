function RoadmapHeader({ roadmap, totalROI, implementationTime }) {
  if (!roadmap || !Array.isArray(roadmap) || roadmap.length === 0) return null;

  // Calculate completed phases %
  const completedCount = roadmap.filter((p) => p.status === "completed").length;
  const currentCount = roadmap.filter((p) => p.status === "current").length;
  const progressPercent = Math.round(((completedCount + currentCount * 0.5) / roadmap.length) * 100);

  // Calculate total budget
  const totalBudgetUSD = roadmap.reduce((sum, item) => sum + (item.estimatedCostUSD || 0), 0);
  const formattedBudget = totalBudgetUSD > 0 ? `$${totalBudgetUSD.toLocaleString()}` : "$250,000";

  return (
    <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-xl space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-400 bg-blue-500/20 px-2.5 py-1 rounded border border-blue-500/30">
            Strategic Consulting Architecture
          </span>
          <h3 className="text-xl font-extrabold tracking-tight text-white mt-1">
            Implementation Journey & Progress Metrics
          </h3>
        </div>

        {/* Overall Completion Progress Indicator */}
        <div className="w-full md:w-64 space-y-1.5">
          <div className="flex justify-between text-xs font-bold">
            <span className="text-slate-300">Transformation Progress</span>
            <span className="text-blue-400 font-extrabold">{progressPercent}%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden border border-slate-700">
            <div
              className="bg-gradient-to-r from-blue-500 to-emerald-400 h-full rounded-full transition-all duration-700"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Summary KPI Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
        <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/60">
          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Completion Progress</span>
          <span className="text-xl font-extrabold text-blue-400 mt-1 block">{progressPercent}%</span>
        </div>

        <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/60">
          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Estimated Duration</span>
          <span className="text-xl font-extrabold text-white mt-1 block">{implementationTime || "6 Months"}</span>
        </div>

        <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/60">
          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Estimated Budget</span>
          <span className="text-xl font-extrabold text-emerald-400 mt-1 block">{formattedBudget}</span>
        </div>

        <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/60">
          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Expected Target ROI</span>
          <span className="text-xl font-extrabold text-amber-400 mt-1 block">+{totalROI || 25}%</span>
        </div>
      </div>
    </div>
  );
}

export default RoadmapHeader;
