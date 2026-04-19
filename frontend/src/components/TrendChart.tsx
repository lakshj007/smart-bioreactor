import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
} from "recharts";
import type { HistoryPoint } from "../types";

interface TrendChartProps {
  history: HistoryPoint[];
}

export default function TrendChart({ history }: TrendChartProps) {
  const data = history.map((h, i) => ({
    index: i,
    time: new Date(h.timestamp * 1000).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }),
    health: h.healthScore,
    temp: h.temperature,
    ph: h.ph,
    turbidity: h.turbidity != null ? h.turbidity * 50 : null,
  }));

  const axisProps = {
    stroke: "#6E6E73",
    fontSize: 11,
    tickLine: false,
    axisLine: false,
    fontFamily: "Inter",
  } as const;

  const tooltipStyle = {
    background: "rgba(17, 17, 20, 0.95)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 10,
    fontSize: 12,
    color: "#F5F5F7",
    fontFamily: "Inter",
    backdropFilter: "blur(12px)",
  };

  const healthColor = "#5EE7C8";
  const tempColor = "#FFB454";
  const phColor = "#A193F0";
  const turbidityColor = "#4FB6FF";

  return (
    <div className="glass rounded-2xl p-6 space-y-7">
      {/* Health Score Chart */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[10px] font-semibold tracking-[0.25em] uppercase" style={{ color: "var(--text-muted)" }}>
            Health Score
          </h3>
          <span
            className="text-[10px] rounded-full px-2.5 py-1 font-medium"
            style={{
              color: healthColor,
              border: `1px solid ${healthColor}30`,
              background: `${healthColor}10`,
            }}
          >
            target 70–100
          </span>
        </div>
        <ResponsiveContainer width="100%" height={150}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="time" {...axisProps} interval="preserveStartEnd" />
            <YAxis {...axisProps} domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} />
            <Tooltip contentStyle={tooltipStyle} />
            <ReferenceArea y1={70} y2={100} fill={healthColor} fillOpacity={0.06} />
            <ReferenceArea y1={50} y2={70} fill="#FFB454" fillOpacity={0.04} />
            <ReferenceArea y1={0} y2={50} fill="#FF6B6B" fillOpacity={0.04} />
            <ReferenceLine y={70} stroke={healthColor} strokeDasharray="6 3" strokeOpacity={0.4} />
            <ReferenceLine y={50} stroke="#FFB454" strokeDasharray="6 3" strokeOpacity={0.4} />
            <Line
              type="monotone"
              dataKey="health"
              name="Health Score"
              stroke={healthColor}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Sensor Charts */}
      <div>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h3 className="text-[10px] font-semibold tracking-[0.25em] uppercase" style={{ color: "var(--text-muted)" }}>
            Sensors
          </h3>
          <div className="flex flex-wrap gap-3 text-[11px]" style={{ color: "var(--text-secondary)" }}>
            <Legend color={tempColor} label="Temp" />
            <Legend color={phColor} label="pH" />
            <Legend color={turbidityColor} label="Turbidity" />
          </div>
        </div>

        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={data} margin={{ left: 5, right: 5 }}>
            <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="time" {...axisProps} interval="preserveStartEnd" />
            <YAxis yAxisId="left" {...axisProps} domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} />
            <YAxis yAxisId="right" orientation="right" {...axisProps} domain={[4, 10]} ticks={[4, 6, 8, 10]} />
            <Tooltip contentStyle={tooltipStyle} />

            <ReferenceArea yAxisId="left" y1={20} y2={28} fill={tempColor} fillOpacity={0.06} />
            <ReferenceArea yAxisId="right" y1={6.5} y2={8.0} fill={phColor} fillOpacity={0.05} />

            <Line
              yAxisId="left"
              type="monotone"
              dataKey="temp"
              name="Water Temp (°C)"
              stroke={tempColor}
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="turbidity"
              name="Turbidity (NTU)"
              stroke={turbidityColor}
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="ph"
              name="pH"
              stroke={phColor}
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}` }}
      />
      {label}
    </span>
  );
}
