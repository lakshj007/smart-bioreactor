interface RecommendationCardProps {
  recommendation: string;
  anomalyRisk: string;
}

export default function RecommendationCard({ recommendation, anomalyRisk }: RecommendationCardProps) {
  const borderColor =
    anomalyRisk === "high"
      ? "border-red-500/50"
      : anomalyRisk === "medium"
        ? "border-yellow-500/50"
        : "border-green-500/50";

  const iconBg =
    anomalyRisk === "high"
      ? "bg-red-500/20"
      : anomalyRisk === "medium"
        ? "bg-yellow-500/20"
        : "bg-green-500/20";

  return (
    <div className={`bg-slate-800/80 rounded-xl p-5 border ${borderColor}`}>
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center shrink-0 mt-0.5`}>
          {anomalyRisk === "high" ? (
            <span className="text-red-400 text-lg">!</span>
          ) : anomalyRisk === "medium" ? (
            <span className="text-yellow-400 text-lg">~</span>
          ) : (
            <span className="text-green-400 text-lg">{"\u2713"}</span>
          )}
        </div>
        <div>
          <h3 className="text-slate-300 text-sm font-medium mb-1">Recommendation</h3>
          <p className="text-slate-400 text-sm leading-relaxed">{recommendation}</p>
        </div>
      </div>
    </div>
  );
}
