import { useEffect, useRef, useState } from "react";
import type { ReactorState } from "./types";
import SensorCard from "./components/SensorCard";
import HealthScoreCard from "./components/HealthScoreCard";
import TrendChart from "./components/TrendChart";
import RecommendationCard from "./components/RecommendationCard";
import CameraPanel from "./components/CameraPanel";
import AlertBanner from "./components/AlertBanner";

const WS_URL = `ws://${window.location.hostname}:8000/ws`;

function App() {
  const [state, setState] = useState<ReactorState | null>(null);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    function connect() {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => setConnected(true);

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as ReactorState;
          setState(data);
        } catch {
          // ignore parse errors
        }
      };

      ws.onclose = () => {
        setConnected(false);
        reconnectTimer.current = setTimeout(connect, 2000);
      };

      ws.onerror = () => ws.close();
    }

    connect();
    return () => {
      clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-6">
      {/* Header */}
      <header className="max-w-6xl mx-auto mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">
              BioSphere
            </h1>
            <p className="text-slate-500 text-sm">Smart Bioreactor Monitor</p>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                connected ? "bg-green-400" : "bg-red-400"
              }`}
            />
            <span className="text-xs text-slate-500">
              {connected ? "Live" : "Disconnected"}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto space-y-5">
        {/* Alert banner */}
        {state && (
          <AlertBanner
            anomalyRisk={state.anomalyRisk}
            recommendation={state.recommendation}
          />
        )}

        {/* Top row: Health + Sensors */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* Health score — spans 2 cols */}
          <div className="lg:col-span-2">
            <HealthScoreCard
              score={state?.healthScore ?? 0}
              trend={state?.trend ?? "stable"}
              anomalyRisk={state?.anomalyRisk ?? "low"}
            />
          </div>

          {/* Sensor cards — 3 cols */}
          <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-2 gap-4">
            <SensorCard
              label="Temperature"
              value={state?.temperature ?? null}
              unit="°C"
              icon="&#127777;"
              min={20}
              max={28}
            />
            <SensorCard
              label="Humidity"
              value={state?.humidity ?? null}
              unit="%"
              icon="&#128167;"
              min={50}
              max={80}
            />
            <SensorCard
              label="pH Level"
              value={state?.ph ?? null}
              unit=""
              icon="&#129514;"
              min={6.5}
              max={8.0}
            />
            <SensorCard
              label="Light"
              value={state?.light ?? null}
              unit="lux"
              icon="&#9728;"
              min={200}
              max={600}
            />
          </div>
        </div>

        {/* Middle row: Trend chart + Recommendation */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2">
            <TrendChart history={state?.history ?? []} />
          </div>
          <div className="space-y-5">
            <RecommendationCard
              recommendation={state?.recommendation ?? "Waiting for data..."}
              anomalyRisk={state?.anomalyRisk ?? "low"}
            />
            <CameraPanel />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto mt-8 pt-4 border-t border-slate-800/50 text-center">
        <p className="text-xs text-slate-600">
          BioSphere &middot; Intelligent Bioreactor Monitoring &middot; POC
        </p>
      </footer>
    </div>
  );
}

export default App;
