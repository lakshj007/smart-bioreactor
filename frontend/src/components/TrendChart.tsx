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
    humidity: h.humidity,
    ph: h.ph,
  }));

  const axisProps = {
    stroke: "#94a3b8",
    fontSize: 12,
    tickLine: false,
    axisLine: false,
  } as const;

  const tooltipStyle = {
    background: "#1e293b",
    border: "1px solid #475569",
    borderRadius: 8,
    fontSize: 12,
    color: "#e2e8f0",
  };

  return (
    <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-2xl p-5 border border-slate-700/30 space-y-5">
      {/* Health Score Chart */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-slate-300 text-sm font-semibold">Health Score</h3>
          <span className="text-[10px] text-slate-400 border border-slate-600 rounded px-1.5 py-0.5">
            target: 70–100
          </span>
        </div>
        <ResponsiveContainer width="100%" height={150}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="time" {...axisProps} interval="preserveStartEnd" />
            <YAxis {...axisProps} domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} />
            <Tooltip contentStyle={tooltipStyle} />
            {/* Healthy zone */}
            <ReferenceArea y1={70} y2={100} fill="#4ade80" fillOpacity={0.1} />
            {/* Warning zone */}
            <ReferenceArea y1={50} y2={70} fill="#facc15" fillOpacity={0.07} />
            {/* Critical zone */}
            <ReferenceArea y1={0} y2={50} fill="#f87171" fillOpacity={0.07} />
            <ReferenceLine y={70} stroke="#4ade80" strokeDasharray="6 3" strokeOpacity={0.7} />
            <ReferenceLine y={50} stroke="#facc15" strokeDasharray="6 3" strokeOpacity={0.7} />
            <Line
              type="monotone"
              dataKey="health"
              name="Health Score"
              stroke="#4ade80"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Sensor Charts */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <h3 className="text-slate-300 text-sm font-semibold">Sensors</h3>
          <div className="flex gap-3 text-xs">
            <span className="text-orange-400">&#9679; Temp (°C)</span>
            <span className="text-sky-400">&#9679; Humidity (%)</span>
            <span className="text-violet-400">&#9679; pH</span>
          </div>
        </div>
        <div className="mb-3 flex flex-wrap gap-2 text-[11px]">
          <span className="rounded-full border border-orange-400/25 bg-orange-400/10 px-2.5 py-1 text-orange-300">
            Temp target: 20-28°C
          </span>
          <span className="rounded-full border border-sky-400/25 bg-sky-400/10 px-2.5 py-1 text-sky-300">
            Humidity target: 50-80%
          </span>
          <span className="rounded-full border border-violet-400/25 bg-violet-400/10 px-2.5 py-1 text-violet-300">
            pH target: 6.5-8.0
          </span>
        </div>
        <ResponsiveContainer width="100%" height={170}>
          <LineChart data={data} margin={{ left: 5, right: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="time" {...axisProps} interval="preserveStartEnd" />
            {/* Left axis: temp & humidity */}
            <YAxis yAxisId="left" {...axisProps} domain={[0, 100]} ticks={[0, 20, 40, 60, 80, 100]} />
            {/* Right axis: pH */}
            <YAxis yAxisId="right" orientation="right" {...axisProps} domain={[4, 10]} ticks={[4, 5, 6, 7, 8, 9, 10]} />
            <Tooltip contentStyle={tooltipStyle} />

            {/* Temperature target band: 20–28°C */}
            <ReferenceArea yAxisId="left" y1={20} y2={28} fill="#fb923c" fillOpacity={0.1} />
            <ReferenceLine
              yAxisId="left"
              y={20}
              stroke="#fb923c"
              strokeDasharray="6 3"
              strokeOpacity={0.6}
            />
            <ReferenceLine
              yAxisId="left"
              y={28}
              stroke="#fb923c"
              strokeDasharray="6 3"
              strokeOpacity={0.6}
            />

            {/* Humidity target band: 50–80% */}
            <ReferenceArea yAxisId="left" y1={50} y2={80} fill="#38bdf8" fillOpacity={0.06} />
            <ReferenceLine
              yAxisId="left"
              y={50}
              stroke="#38bdf8"
              strokeDasharray="6 3"
              strokeOpacity={0.5}
            />
            <ReferenceLine
              yAxisId="left"
              y={80}
              stroke="#38bdf8"
              strokeDasharray="6 3"
              strokeOpacity={0.5}
            />

            {/* pH target band: 6.5–8.0 */}
            <ReferenceArea yAxisId="right" y1={6.5} y2={8.0} fill="#a78bfa" fillOpacity={0.08} />
            <ReferenceLine
              yAxisId="right"
              y={6.5}
              stroke="#a78bfa"
              strokeDasharray="6 3"
              strokeOpacity={0.6}
            />
            <ReferenceLine
              yAxisId="right"
              y={8.0}
              stroke="#a78bfa"
              strokeDasharray="6 3"
              strokeOpacity={0.6}
            />

            <Line
              yAxisId="left"
              type="monotone"
              dataKey="temp"
              name="Temperature (°C)"
              stroke="#fb923c"
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="humidity"
              name="Humidity (%)"
              stroke="#38bdf8"
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="ph"
              name="pH"
              stroke="#a78bfa"
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
