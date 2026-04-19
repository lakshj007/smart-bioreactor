import type { ReactNode } from "react";
import {
  Thermometer,
  Droplets,
  FlaskConical,
  Sun,
  Eye,
  Activity,
} from "lucide-react";

interface SensorCardProps {
  label: string;
  value: number | null;
  unit: string;
  iconKey?: "temperature" | "humidity" | "ph" | "light" | "turbidity";
  min?: number;
  max?: number;
  precision?: number;
}

const ICON_MAP: Record<string, ReactNode> = {
  temperature: <Thermometer size={16} />,
  humidity: <Droplets size={16} />,
  ph: <FlaskConical size={16} />,
  light: <Sun size={16} />,
  turbidity: <Eye size={16} />,
};

export default function SensorCard({
  label,
  value,
  unit,
  iconKey,
  min,
  max,
  precision = 1,
}: SensorCardProps) {
  const displayValue = value !== null ? value.toFixed(precision) : "—";

  let statusColor = "var(--accent)";
  let statusLabel = "Optimal";
  if (value !== null && min !== undefined && max !== undefined) {
    if (value < min || value > max) {
      statusColor = "var(--danger)";
      statusLabel = "Out of range";
    } else {
      const mid = (min + max) / 2;
      const range = (max - min) / 2;
      const deviation = Math.abs(value - mid) / range;
      if (deviation > 0.7) {
        statusColor = "var(--warning)";
        statusLabel = "Drifting";
      }
    }
  } else if (value === null) {
    statusColor = "var(--text-muted)";
    statusLabel = "No signal";
  }

  // Bar position 0..1 within range
  const barPos =
    value !== null && min !== undefined && max !== undefined
      ? Math.max(0, Math.min(1, (value - min) / (max - min)))
      : 0.5;

  const icon = (iconKey && ICON_MAP[iconKey]) || <Activity size={16} />;

  return (
    <div
      className="glass rounded-2xl p-5 transition-all duration-300 hover:-translate-y-0.5"
      style={{
        boxShadow: "0 1px 0 rgba(255,255,255,0.04) inset",
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <span
          className="text-[11px] tracking-[0.18em] uppercase font-medium"
          style={{ color: "var(--text-muted)" }}
        >
          {label}
        </span>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.04)", color: "var(--text-secondary)" }}
        >
          {icon}
        </div>
      </div>

      <div className="flex items-baseline gap-1.5">
        <div
          className="text-4xl font-semibold tabular-nums"
          style={{ color: statusColor }}
        >
          {displayValue}
        </div>
        <span
          className="text-sm font-normal"
          style={{ color: "var(--text-muted)" }}
        >
          {unit}
        </span>
      </div>

      {min !== undefined && max !== undefined && (
        <>
          <div
            className="mt-4 h-1 rounded-full overflow-hidden relative"
            style={{ background: "rgba(255,255,255,0.05)" }}
          >
            <div
              className="absolute top-0 bottom-0 w-1 rounded-full transition-all duration-700"
              style={{
                left: `calc(${barPos * 100}% - 2px)`,
                background: statusColor,
                boxShadow: `0 0 8px ${statusColor}`,
              }}
            />
          </div>
          <div className="mt-2.5 flex items-center justify-between text-[10px]">
            <span style={{ color: "var(--text-muted)" }}>
              {min}–{max} {unit}
            </span>
            <span style={{ color: statusColor }}>{statusLabel}</span>
          </div>
        </>
      )}
    </div>
  );
}
