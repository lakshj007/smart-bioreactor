interface HealthScoreCardProps {
  score: number;
  trend: string;
  anomalyRisk: string;
}

export default function HealthScoreCard({ score, trend, anomalyRisk }: HealthScoreCardProps) {
  const getScoreColor = (s: number) => {
    if (s >= 75) return "text-green-400";
    if (s >= 50) return "text-yellow-400";
    return "text-red-400";
  };

  const getRiskBadge = (risk: string) => {
    const colors: Record<string, string> = {
      low: "bg-green-500/20 text-green-400 border-green-500/30",
      medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      high: "bg-red-500/20 text-red-400 border-red-500/30",
    };
    return colors[risk] || colors.low;
  };

  const getTrendIcon = (t: string) => {
    if (t === "improving") return "\u2191";
    if (t === "declining") return "\u2193";
    return "\u2192";
  };

  // SVG arc for the gauge
  const radius = 60;
  const circumference = Math.PI * radius;
  const progress = (score / 100) * circumference;

  return (
    <div className="bg-slate-800/80 rounded-xl p-6 border border-slate-700/50 flex flex-col items-center">
      <h3 className="text-slate-400 text-sm font-medium mb-4">Reactor Health</h3>

      <svg width="150" height="85" viewBox="0 0 150 85">
        {/* Background arc */}
        <path
          d="M 15 80 A 60 60 0 0 1 135 80"
          fill="none"
          stroke="#334155"
          strokeWidth="10"
          strokeLinecap="round"
        />
        {/* Score arc */}
        <path
          d="M 15 80 A 60 60 0 0 1 135 80"
          fill="none"
          stroke={score >= 75 ? "#4ade80" : score >= 50 ? "#facc15" : "#f87171"}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${progress} ${circumference}`}
        />
      </svg>

      <div className={`text-5xl font-bold -mt-4 ${getScoreColor(score)}`}>
        {Math.round(score)}
      </div>
      <div className="text-slate-500 text-sm mt-1">out of 100</div>

      <div className="flex gap-3 mt-4">
        <span className="text-sm text-slate-400">
          {getTrendIcon(trend)} {trend}
        </span>
        <span className={`text-xs px-2 py-0.5 rounded-full border ${getRiskBadge(anomalyRisk)}`}>
          {anomalyRisk} risk
        </span>
      </div>
    </div>
  );
}
