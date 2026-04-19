import { AlertTriangle, AlertCircle, CheckCircle, Lightbulb } from "lucide-react";
import type { JSX } from "react";

interface RecommendationCardProps {
  recommendation: string;
  anomalyRisk: string;
}

export default function RecommendationCard({
  recommendation,
  anomalyRisk,
}: RecommendationCardProps) {
  const styles: Record<string, { border: string; iconBg: string; color: string; icon: JSX.Element }> = {
    high: {
      border: "rgba(255, 107, 107, 0.3)",
      iconBg: "var(--danger-dim)",
      color: "var(--danger)",
      icon: <AlertTriangle size={18} />,
    },
    medium: {
      border: "rgba(255, 180, 84, 0.3)",
      iconBg: "var(--warning-dim)",
      color: "var(--warning)",
      icon: <AlertCircle size={18} />,
    },
    low: {
      border: "rgba(94, 231, 200, 0.25)",
      iconBg: "var(--accent-dim)",
      color: "var(--accent)",
      icon: <CheckCircle size={18} />,
    },
  };

  const s = styles[anomalyRisk] || styles.low;

  return (
    <div
      className="glass rounded-2xl p-5"
      style={{ borderColor: s.border }}
    >
      <div className="flex items-start gap-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
          style={{ background: s.iconBg, color: s.color }}
        >
          {s.icon}
        </div>
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb size={12} style={{ color: "var(--text-muted)" }} />
            <h3
              className="text-[10px] font-semibold tracking-[0.25em] uppercase"
              style={{ color: "var(--text-muted)" }}
            >
              Recommendation
            </h3>
          </div>
          <p
            className="text-sm leading-relaxed"
            style={{ color: "var(--text-secondary)" }}
          >
            {recommendation}
          </p>
        </div>
      </div>
    </div>
  );
}
