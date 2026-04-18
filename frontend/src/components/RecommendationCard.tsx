interface RecommendationCardProps {
  recommendation: string;
  anomalyRisk: string;
}

export default function RecommendationCard({ recommendation, anomalyRisk }: RecommendationCardProps) {
  const borderColor =
    anomalyRisk === "high"
      ? "border-red-500/40"
      : anomalyRisk === "medium"
        ? "border-yellow-500/40"
        : "border-emerald-500/30";

  const iconBg =
    anomalyRisk === "high"
      ? "bg-red-500/15"
      : anomalyRisk === "medium"
        ? "bg-yellow-500/15"
        : "bg-emerald-500/15";

  return (
    <div className={`bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-2xl p-5 border ${borderColor}`}>
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center shrink-0 mt-0.5`}>
          {anomalyRisk === "high" ? (
            <span className="text-red-400 text-lg font-bold">!</span>
          ) : anomalyRisk === "medium" ? (
            <span className="text-yellow-400 text-lg">~</span>
          ) : (
            <span className="text-emerald-400 text-lg">{"\u2713"}</span>
          )}
        </div>
        <div>
          <h3 className="text-slate-300 text-sm font-semibold mb-1.5">Recommendation</h3>
          <p className="text-slate-400 text-sm leading-relaxed">{recommendation}</p>
        </div>
      </div>
    </div>
  );
}
