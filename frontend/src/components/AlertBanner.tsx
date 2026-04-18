interface AlertBannerProps {
  anomalyRisk: string;
  recommendation: string;
}

export default function AlertBanner({ anomalyRisk, recommendation }: AlertBannerProps) {
  if (anomalyRisk === "low") return null;

  const isHigh = anomalyRisk === "high";

  return (
    <div
      className={`rounded-2xl p-4 border transition-all duration-500 ${
        isHigh
          ? "bg-red-500/10 border-red-500/30 text-red-300 shadow-[0_0_20px_rgba(239,68,68,0.12)]"
          : "bg-yellow-500/10 border-yellow-500/30 text-yellow-300 shadow-[0_0_15px_rgba(234,179,8,0.08)]"
      }`}
    >
      <div className="flex items-center gap-2.5">
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
            isHigh ? "bg-red-500/20" : "bg-yellow-500/20"
          }`}
        >
          {"\u26A0"}
        </div>
        <span className="font-semibold text-sm">
          {isHigh ? "Critical Alert" : "Warning"}
        </span>
      </div>
      <p className="text-sm mt-2 opacity-80 leading-relaxed ml-[42px]">{recommendation}</p>
    </div>
  );
}
