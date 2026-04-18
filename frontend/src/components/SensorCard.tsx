interface SensorCardProps {
  label: string;
  value: number | null;
  unit: string;
  icon: string;
  min?: number;
  max?: number;
}

export default function SensorCard({ label, value, unit, icon, min, max }: SensorCardProps) {
  const displayValue = value !== null ? value.toFixed(1) : "--";

  let statusColor = "text-emerald-400";
  let glowColor = "shadow-emerald-500/0";
  if (value !== null && min !== undefined && max !== undefined) {
    if (value < min || value > max) {
      statusColor = "text-red-400";
      glowColor = "shadow-red-500/10";
    } else {
      const mid = (min + max) / 2;
      const range = (max - min) / 2;
      const deviation = Math.abs(value - mid) / range;
      if (deviation > 0.7) {
        statusColor = "text-yellow-400";
        glowColor = "shadow-yellow-500/5";
      }
    }
  }

  return (
    <div
      className={`bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-2xl p-5 border border-slate-700/30 hover:border-slate-600/50 transition-all duration-300 shadow-lg ${glowColor}`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-slate-400 text-sm font-medium">{label}</span>
        <span className="text-base w-8 h-8 rounded-lg bg-slate-700/40 flex items-center justify-center">
          {icon}
        </span>
      </div>
      <div className={`text-3xl font-bold ${statusColor}`}>
        {displayValue}
        <span className="text-base font-normal text-slate-500 ml-1">{unit}</span>
      </div>
      {min !== undefined && max !== undefined && (
        <div className="text-xs text-slate-500 mt-2.5">
          Target: {min}–{max} {unit}
        </div>
      )}
    </div>
  );
}
