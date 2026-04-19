import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface HealthScoreCardProps {
  score: number;
  trend: string;
  anomalyRisk: string;
}

export default function HealthScoreCard({
  score,
  trend,
  anomalyRisk,
}: HealthScoreCardProps) {
  const getScoreColor = (s: number) => {
    if (s >= 75) return "var(--accent)";
    if (s >= 50) return "var(--warning)";
    return "var(--danger)";
  };

  const getRiskStyle = (risk: string) => {
    const styles: Record<string, { bg: string; color: string; border: string }> = {
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
    return styles[risk] || styles.low;
  };

  const getTrendIcon = (t: string) => {
    if (t === "improving") return <TrendingUp size={14} />;
    if (t === "declining") return <TrendingDown size={14} />;
    return <Minus size={14} />;
  };

  // Full circle progress
  const radius = 70;
  const stroke = 8;
  const circ = 2 * Math.PI * radius;
  const dash = (Math.max(0, Math.min(score, 100)) / 100) * circ;

  const scoreColor = getScoreColor(score);
  const riskStyle = getRiskStyle(anomalyRisk);

  return (
    <div className="glass rounded-2xl p-8 flex flex-col items-center justify-center relative overflow-hidden h-full">
      {/* Background ambient */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-[80px] transition-colors duration-1000"
        style={{ backgroundColor: scoreColor, opacity: 0.18 }}
      />

      <h3
        className="relative text-[10px] font-medium mb-6 tracking-[0.25em] uppercase"
        style={{ color: "var(--text-muted)" }}
      >
        Reactor Health
      </h3>

      <div className="relative">
        <svg width="180" height="180" viewBox="0 0 180 180">
          <circle
            cx="90"
            cy="90"
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={stroke}
          />
          <circle
            cx="90"
            cy="90"
            r={radius}
            fill="none"
            stroke={scoreColor}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circ}`}
            transform="rotate(-90 90 90)"
            style={{
              filter: `drop-shadow(0 0 8px ${scoreColor})`,
              transition: "stroke-dasharray 0.7s ease, stroke 0.5s ease",
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div
            className="text-5xl font-semibold tabular-nums"
            style={{ color: scoreColor }}
          >
            {Math.round(score)}
          </div>
          <div
            className="text-[10px] mt-1 tracking-[0.25em] uppercase"
            style={{ color: "var(--text-muted)" }}
          >
            of 100
          </div>
        </div>
      </div>

      <div className="relative flex items-center gap-3 mt-7">
        <span
          className="flex items-center gap-1.5 text-xs"
          style={{ color: "var(--text-secondary)" }}
        >
          {getTrendIcon(trend)}
          <span className="capitalize">{trend}</span>
        </span>
        <span
          className="text-[10px] px-3 py-1 rounded-full font-medium capitalize tracking-wider"
          style={{
            background: riskStyle.bg,
            color: riskStyle.color,
            border: `1px solid ${riskStyle.border}`,
          }}
        >
          {anomalyRisk} risk
        </span>
      </div>
    </div>
  );
}
