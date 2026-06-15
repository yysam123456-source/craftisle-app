import { getResourceScoreBreakdown, type Resource } from "@/lib/fmhy-data";

export function ScoreBreakdown({ resource }: { resource: Resource }) {
  const breakdown = getResourceScoreBreakdown(resource);
  const score = Math.round(
    Object.values(breakdown).reduce((a, b) => a + b, 0) / Object.values(breakdown).length
  );

  return (
    <div className="flex flex-wrap gap-3 mt-3 mb-2">
      {Object.entries(breakdown).map(([dim, sc]) => (
        <div key={dim} className="flex items-center gap-1.5 text-xs" title={`${dim}: ${sc}/100`}>
          <span className="text-muted-foreground capitalize w-14 truncate text-right">{dim}</span>
          <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full ${
                sc >= 80 ? "bg-green-500" : sc >= 60 ? "bg-yellow-500" : "bg-gray-400"
              }`}
              style={{ width: `${sc}%` }}
            />
          </div>
          <span className="font-mono text-muted-foreground w-8 text-right">{sc}</span>
        </div>
      ))}
    </div>
  );
}
