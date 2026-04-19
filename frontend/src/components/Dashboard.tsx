import type { ReactorState } from "../types";
import DashboardHeader from "./DashboardHeader";
import AlertBanner from "./AlertBanner";
import HealthScoreCard from "./HealthScoreCard";
import SensorCard from "./SensorCard";
import TrendChart from "./TrendChart";
import RecommendationCard from "./RecommendationCard";
import CameraPanel from "./CameraPanel";
import AssistantSidebar from "./AssistantSidebar";
import BubbleBackground from "./BubbleBackground";
import StirrerControl from "./StirrerControl";

interface DashboardProps {
  state: ReactorState | null;
  connected: boolean;
  onBack: () => void;
}

export default function Dashboard({ state, connected, onBack }: DashboardProps) {
  return (
    <div className="min-h-screen relative" style={{ background: "var(--bg)" }}>
      <BubbleBackground />

      <div className="relative z-10">
        <DashboardHeader
          connected={connected}
          healthScore={state?.healthScore ?? 0}
          anomalyRisk={state?.anomalyRisk ?? "low"}
          onBack={onBack}
        />

        <main className="max-w-7xl mx-auto px-6 sm:px-8 py-10 space-y-8 animate-fade-in-up">
          {/* Section header */}
          <div>
            <p
              className="text-[10px] tracking-[0.25em] uppercase mb-2"
              style={{ color: "var(--accent)" }}
            >
              Live Telemetry
            </p>
            <h2 className="font-display text-4xl sm:text-5xl text-gradient-soft">
              Reactor in real time.
            </h2>
            <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
              Streaming sensor data, AI-driven health analysis, and recommendations.
            </p>
          </div>

          {state && (
            <AlertBanner
              anomalyRisk={state.anomalyRisk}
              recommendation={state.recommendation}
            />
          )}

          {/* Top row: Health + Primary sensors */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            <div className="lg:col-span-2">
              <HealthScoreCard
                score={state?.healthScore ?? 0}
                trend={state?.trend ?? "stable"}
                anomalyRisk={state?.anomalyRisk ?? "low"}
              />
            </div>

            <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <SensorCard
                label="Water Temp"
                value={state?.temperature ?? null}
                unit="°C"
                iconKey="temperature"
                min={20}
                max={28}
              />
              <SensorCard
                label="pH Level"
                value={state?.ph ?? null}
                unit=""
                iconKey="ph"
                min={6.5}
                max={8.0}
              />
              <SensorCard
                label="Turbidity"
                value={state?.turbidity != null ? state.turbidity * 50 : null}
                unit="NTU"
                iconKey="turbidity"
                min={0}
                max={50}
                precision={1}
              />
            </div>
          </div>

          {/* Secondary sensors row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <SensorCard
              label="Humidity"
              value={state?.humidity ?? null}
              unit="%"
              iconKey="humidity"
              min={50}
              max={80}
            />
            <SensorCard
              label="Light"
              value={state?.light ?? null}
              unit="lux"
              iconKey="light"
              min={200}
              max={600}
              precision={0}
            />
            <StirrerControl on={state?.stirring ?? false} />
            <div
              className="glass rounded-2xl p-5 flex flex-col justify-between"
              style={{ minHeight: 132 }}
            >
              <span
                className="text-[11px] tracking-[0.18em] uppercase font-medium"
                style={{ color: "var(--text-muted)" }}
              >
                Last update
              </span>
              <div>
                <div
                  className="text-2xl font-semibold tabular-nums"
                  style={{ color: "var(--text-primary)" }}
                >
                  {state?.timestamp
                    ? new Date(state.timestamp * 1000).toLocaleTimeString()
                    : "—"}
                </div>
                <p
                  className="text-[10px] mt-1 tracking-widest uppercase"
                  style={{ color: "var(--text-muted)" }}
                >
                  {connected ? "Streaming live" : "Disconnected"}
                </p>
              </div>
            </div>
          </div>

          {/* Camera turbidity analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2">
              <CameraPanel />
            </div>
            <div>
              <RecommendationCard
                recommendation={state?.recommendation ?? "Waiting for data..."}
                anomalyRisk={state?.anomalyRisk ?? "low"}
              />
            </div>
          </div>

          {/* Charts */}
          <div>
            <TrendChart history={state?.history ?? []} />
          </div>
        </main>

        <footer
          className="max-w-7xl mx-auto px-8 py-10 mt-6 text-center"
          style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
        >
          <p
            className="text-[10px] tracking-[0.25em] uppercase"
            style={{ color: "var(--text-muted)" }}
          >
            BioSphere · Intelligent Bioreactor Monitoring
          </p>
        </footer>
      </div>

      <AssistantSidebar />
    </div>
  );
}
