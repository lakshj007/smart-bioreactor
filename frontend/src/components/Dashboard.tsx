import type { ReactorState } from "../types";
import DashboardHeader from "./DashboardHeader";
import AlertBanner from "./AlertBanner";
import HealthScoreCard from "./HealthScoreCard";
import SensorCard from "./SensorCard";
import TrendChart from "./TrendChart";
import RecommendationCard from "./RecommendationCard";
import CameraPanel from "./CameraPanel";

interface DashboardProps {
  state: ReactorState | null;
  connected: boolean;
  onBack: () => void;
}

export default function Dashboard({ state, connected, onBack }: DashboardProps) {
  return (
    <div className="min-h-screen">
      <DashboardHeader
        connected={connected}
        healthScore={state?.healthScore ?? 0}
        anomalyRisk={state?.anomalyRisk ?? "low"}
        onBack={onBack}
      />

      <main className="max-w-7xl mx-auto p-6 space-y-6 animate-fade-in-up">
        {/* Alert banner */}
        {state && (
          <AlertBanner
            anomalyRisk={state.anomalyRisk}
            recommendation={state.recommendation}
          />
        )}

        {/* Top row: Health + Sensors */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2">
            <HealthScoreCard
              score={state?.healthScore ?? 0}
              trend={state?.trend ?? "stable"}
              anomalyRisk={state?.anomalyRisk ?? "low"}
            />
          </div>

          <div className="lg:col-span-3 grid grid-cols-2 gap-4">
            <SensorCard
              label="Temperature"
              value={state?.temperature ?? null}
              unit="\u00B0C"
              icon={"\uD83C\uDF21\uFE0F"}
              min={20}
              max={28}
            />
            <SensorCard
              label="Humidity"
              value={state?.humidity ?? null}
              unit="%"
              icon={"\uD83D\uDCA7"}
              min={50}
              max={80}
            />
            <SensorCard
              label="pH Level"
              value={state?.ph ?? null}
              unit=""
              icon={"\uD83E\uDDEA"}
              min={6.5}
              max={8.0}
            />
            <SensorCard
              label="Light"
              value={state?.light ?? null}
              unit="lux"
              icon={"\u2600\uFE0F"}
              min={200}
              max={600}
            />
          </div>
        </div>

        {/* Middle row: Charts + Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <TrendChart history={state?.history ?? []} />
          </div>
          <div className="space-y-6">
            <RecommendationCard
              recommendation={state?.recommendation ?? "Waiting for data..."}
              anomalyRisk={state?.anomalyRisk ?? "low"}
            />
            <CameraPanel />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 py-6 mt-4 border-t border-slate-800/40 text-center">
        <p className="text-xs text-slate-600">
          BioSphere &middot; Intelligent Bioreactor Monitoring &middot; POC
        </p>
      </footer>
    </div>
  );
}
