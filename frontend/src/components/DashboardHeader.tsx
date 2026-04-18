interface DashboardHeaderProps {
  connected: boolean;
  healthScore: number;
  anomalyRisk: string;
  onBack: () => void;
}

export default function DashboardHeader({
  connected,
  healthScore,
  anomalyRisk,
  onBack,
}: DashboardHeaderProps) {
  const riskColors: Record<string, string> = {
    low: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    medium: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    high: "bg-red-500/15 text-red-400 border-red-500/30",
  };

  const scoreColor =
    healthScore >= 75
      ? "text-emerald-400"
      : healthScore >= 50
        ? "text-yellow-400"
        : "text-red-400";

  return (
    <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/60">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Left side */}
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="text-slate-500 hover:text-slate-300 transition-colors text-sm cursor-pointer"
          >
            &larr; Home
          </button>
          <div className="h-5 w-px bg-slate-700/60" />
          <h1 className="text-lg font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            BioSphere
          </h1>
          <div className="flex items-center gap-1.5">
            <div
              className={`w-2 h-2 rounded-full ${
                connected ? "bg-emerald-400 animate-pulse" : "bg-red-400"
              }`}
            />
            <span className="text-xs text-slate-500">
              {connected ? "Live" : "Offline"}
            </span>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-5">
          <div className="text-sm text-slate-400">
            Health:{" "}
            <span className={`font-semibold ${scoreColor}`}>
              {Math.round(healthScore)}
            </span>
          </div>
          <span
            className={`text-xs px-2.5 py-1 rounded-full border ${
              riskColors[anomalyRisk] || riskColors.low
            }`}
          >
            {anomalyRisk} risk
          </span>
        </div>
      </div>
    </header>
  );
}
