interface AlertBannerProps {
  anomalyRisk: string;
  recommendation: string;
}

export default function AlertBanner({ anomalyRisk, recommendation }: AlertBannerProps) {
  if (anomalyRisk === "low") return null;

  const isHigh = anomalyRisk === "high";

  return (
    <div
      className={`rounded-xl p-4 border ${
        isHigh
          ? "bg-red-500/10 border-red-500/30 text-red-300"
          : "bg-yellow-500/10 border-yellow-500/30 text-yellow-300"
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="text-lg">{isHigh ? "\u26A0" : "\u26A0"}</span>
        <span className="font-medium text-sm">
          {isHigh ? "Critical Alert" : "Warning"}
        </span>
      </div>
      <p className="text-sm mt-1 opacity-80">{recommendation}</p>
    </div>
  );
}
