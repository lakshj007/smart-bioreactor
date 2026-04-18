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

  let statusColor = "text-green-400";
  if (value !== null && min !== undefined && max !== undefined) {
    if (value < min || value > max) {
      statusColor = "text-red-400";
    } else {
      const mid = (min + max) / 2;
      const range = (max - min) / 2;
      const deviation = Math.abs(value - mid) / range;
      if (deviation > 0.7) statusColor = "text-yellow-400";
    }
  }

  return (
    <div className="bg-slate-800/80 rounded-xl p-5 border border-slate-700/50">
      <div className="flex items-center justify-between mb-2">
        <span className="text-slate-400 text-sm font-medium">{label}</span>
        <span className="text-xl">{icon}</span>
      </div>
      <div className={`text-3xl font-bold ${statusColor}`}>
        {displayValue}
        <span className="text-base font-normal text-slate-500 ml-1">{unit}</span>
      </div>
      {min !== undefined && max !== undefined && (
        <div className="text-xs text-slate-500 mt-2">
          Target: {min}–{max} {unit}
        </div>
      )}
    </div>
  );
}
