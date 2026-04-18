interface HealthScoreCardProps {
  score: number;
  trend: string;
  anomalyRisk: string;
}

export default function HealthScoreCard({ score, trend, anomalyRisk }: HealthScoreCardProps) {
  const getScoreColor = (s: number) => {
    if (s >= 75) return "text-emerald-400";
    if (s >= 50) return "text-yellow-400";
    return "text-red-400";
  };

  const getGlowHex = (s: number) => {
    if (s >= 75) return "#4ade80";
    if (s >= 50) return "#facc15";
    return "#f87171";
  };

  const getRiskBadge = (risk: string) => {
    const colors: Record<string, string> = {
      low: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
      medium: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
      high: "bg-red-500/15 text-red-400 border-red-500/30",
    };
    return colors[risk] || colors.low;
  };

  const getTrendIcon = (t: string) => {
    if (t === "improving") return "\u2191";
    if (t === "declining") return "\u2193";
    return "\u2192";
  };

  const radius = 60;
  const circumference = Math.PI * radius;
  const progress = (score / 100) * circumference;

  return (
    <div className="relative bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-2xl p-6 border border-slate-700/30 flex flex-col items-center overflow-hidden h-full justify-center">
      {/* Background glow */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-44 h-44 rounded-full blur-[60px] opacity-20 transition-colors duration-1000"
        style={{ backgroundColor: getGlowHex(score) }}
      />

      <h3 className="relative text-slate-400 text-sm font-medium mb-4">Reactor Health</h3>

      <svg width="160" height="90" viewBox="0 0 160 90" className="relative">
        {/* Background arc */}
        <path
          d="M 15 85 A 65 65 0 0 1 145 85"
          fill="none"
          stroke="#1e293b"
          strokeWidth="12"
          strokeLinecap="round"
        />
        {/* Score arc */}
        <path
          d="M 15 85 A 65 65 0 0 1 145 85"
          fill="none"
          stroke={getGlowHex(score)}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${progress} ${circumference}`}
          style={{
            filter: `drop-shadow(0 0 8px ${getGlowHex(score)}40)`,
            transition: "stroke-dasharray 0.5s ease, stroke 0.5s ease",
          }}
        />
      </svg>

      <div className={`relative text-5xl font-bold -mt-3 ${getScoreColor(score)}`}>
        {Math.round(score)}
      </div>
      <div className="relative text-slate-500 text-sm mt-1">out of 100</div>

      <div className="relative flex gap-3 mt-5">
        <span className="text-sm text-slate-400">
          {getTrendIcon(trend)} {trend}
        </span>
        <span className={`text-xs px-2.5 py-0.5 rounded-full border ${getRiskBadge(anomalyRisk)}`}>
          {anomalyRisk} risk
        </span>
      </div>
    </div>
  );
}
