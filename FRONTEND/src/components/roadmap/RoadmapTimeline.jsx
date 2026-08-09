import RoadmapCard from "./RoadmapCard";

function RoadmapTimeline({ roadmap }) {
  if (!roadmap || !Array.isArray(roadmap) || roadmap.length === 0) return null;

  return (
    <div className="relative pl-2">
      {/* Vertical connector line */}
      <div className="absolute left-3 top-8 bottom-8 w-0.5 bg-[#E2E8F0]" />
      {roadmap.map((item, index) => (
        <RoadmapCard key={index} phaseItem={item} index={index} />
      ))}
    </div>
  );
}

export default RoadmapTimeline;
