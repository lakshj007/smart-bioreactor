import { ArrowLeft, Wifi, WifiOff, Activity } from "lucide-react";

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
  const scoreColor =
    healthScore >= 75
      ? "var(--accent)"
      : healthScore >= 50
        ? "var(--warning)"
        : "var(--danger)";

  const riskStyles: Record<string, { bg: string; color: string; border: string }> = {
    low: {
      bg: "var(--accent-dim)",
      color: "var(--accent)",
      border: "rgba(94, 231, 200, 0.25)",
    },
    medium: {
      bg: "var(--warning-dim)",
      color: "var(--warning)",
      border: "rgba(255, 180, 84, 0.25)",
    },
    high: {
      bg: "var(--danger-dim)",
      color: "var(--danger)",
      border: "rgba(255, 107, 107, 0.25)",
    },
  };

  const risk = riskStyles[anomalyRisk] || riskStyles.low;

  return (
    <header
      className="sticky top-0 z-50 backdrop-blur-xl"
      style={{
        background: "rgba(0, 0, 0, 0.6)",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8 h-14 flex items-center justify-between">
        <div className="flex items-center gap-5">
          <button
            id="back-home-btn"
            onClick={onBack}
            className="flex items-center gap-1.5 transition-colors duration-200 cursor-pointer text-sm"
            style={{ color: "var(--text-muted)", background: "none", border: "none" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
          >
            <ArrowLeft size={14} />
            <span>Home</span>
          </button>

          <div className="h-4 w-px" style={{ backgroundColor: "rgba(255,255,255,0.08)" }} />

          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded-full"
              style={{
                background:
                  "radial-gradient(circle at 30% 30%, #B8FFE5, #5EE7C8 50%, #1E5A82)",
                boxShadow: "0 0 8px rgba(94, 231, 200, 0.5)",
              }}
            />
            <h1 className="text-sm font-semibold tracking-tight">BioSphere</h1>
          </div>

          <div className="hidden sm:flex items-center gap-1.5">
            {connected ? (
              <Wifi size={11} style={{ color: "var(--accent)" }} />
            ) : (
              <WifiOff size={11} style={{ color: "var(--danger)" }} />
            )}
            <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
              {connected ? "Live" : "Offline"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div
            className="hidden sm:flex items-center gap-1.5 text-xs"
            style={{ color: "var(--text-muted)" }}
          >
            <Activity size={12} style={{ color: scoreColor }} />
            <span>
              Health{" "}
              <span className="font-semibold tabular-nums" style={{ color: scoreColor }}>
                {Math.round(healthScore)}
              </span>
            </span>
          </div>

          <span
            className="text-[10px] px-2.5 py-1 rounded-full font-medium capitalize tracking-wider"
            style={{
              background: risk.bg,
              color: risk.color,
              border: `1px solid ${risk.border}`,
            }}
          >
            {anomalyRisk} risk
          </span>
        </div>
      </div>
    </header>
  );
}
