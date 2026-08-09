function TimelineConnector({ status, isLast }) {
  const statusColors = {
    completed: "bg-emerald-500 text-emerald-100 ring-4 ring-emerald-500/20 shadow-emerald-500/30",
    current: "bg-blue-600 text-blue-100 ring-4 ring-blue-500/30 animate-pulse shadow-blue-500/40",
    upcoming: "bg-amber-500 text-amber-100 ring-4 ring-amber-500/20 shadow-amber-500/20",
    future: "bg-slate-400 text-slate-100 ring-4 ring-slate-400/20"
  };

  const lineColors = {
    completed: "bg-emerald-500",
    current: "bg-blue-500",
    upcoming: "bg-amber-400",
    future: "bg-slate-300"
  };

  return (
    <div className="flex flex-col items-center self-stretch min-w-[32px] pt-4">
      {/* Circle Status Node */}
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-transform duration-300 z-10 shadow-md ${
          statusColors[status] || statusColors.future
        }`}
      >
        {status === "completed" ? "✓" : status === "current" ? "▶" : "●"}
      </div>

      {/* Connecting Vertical Line */}
      {!isLast && (
        <div
          className={`w-0.5 flex-grow my-1 transition-colors duration-500 ${
            lineColors[status] || "bg-slate-300"
          }`}
        ></div>
      )}
    </div>
  );
}

export default TimelineConnector;
