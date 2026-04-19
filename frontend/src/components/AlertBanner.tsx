import { AlertTriangle } from "lucide-react";

interface AlertBannerProps {
  anomalyRisk: string;
  recommendation: string;
}

export default function AlertBanner({ anomalyRisk, recommendation }: AlertBannerProps) {
  if (anomalyRisk === "low") return null;

  const isHigh = anomalyRisk === "high";
  const bg = isHigh ? "var(--danger-dim)" : "var(--warning-dim)";
  const borderColor = isHigh ? "rgba(255, 107, 107, 0.3)" : "rgba(255, 180, 84, 0.3)";
  const textColor = isHigh ? "var(--danger)" : "var(--warning)";
  const iconBg = isHigh ? "rgba(255, 107, 107, 0.15)" : "rgba(255, 180, 84, 0.15)";

  return (
    <div
      className="rounded-2xl p-5 backdrop-blur-md transition-all duration-500"
      style={{
        background: bg,
        border: `1px solid ${borderColor}`,
        color: textColor,
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: iconBg }}
        >
          <AlertTriangle size={16} />
        </div>
        <span className="font-semibold text-sm tracking-tight">
          {isHigh ? "Critical Alert" : "Warning"}
        </span>
      </div>
      <p
        className="text-sm mt-3 leading-relaxed ml-12"
        style={{ opacity: 0.9 }}
      >
        {recommendation}
      </p>
    </div>
  );
}
