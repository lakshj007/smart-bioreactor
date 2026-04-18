import type { ReactorState } from "../types";
import BioreactorVisual from "./BioreactorVisual";
import BubbleBackground from "./BubbleBackground";

interface HomePageProps {
  connected: boolean;
  state: ReactorState | null;
  onEnter: () => void;
}

export default function HomePage({ connected, state, onEnter }: HomePageProps) {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-6 overflow-hidden">
      <BubbleBackground />

      <div className="relative z-10 flex flex-col items-center gap-8 animate-fade-in-up">
        {/* Bioreactor visual */}
        <BioreactorVisual />

        {/* Branding */}
        <div className="text-center">
          <h1 className="text-6xl sm:text-7xl font-extrabold bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent tracking-tight">
            BioSphere
          </h1>
          <p className="mt-3 text-lg sm:text-xl text-slate-400 font-light">
            Intelligent Bioreactor Monitoring
          </p>
        </div>

        {/* Status pill */}
        <div className="flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-slate-800/60 border border-slate-700/50 backdrop-blur-sm">
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              connected
                ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]"
                : "bg-red-400"
            }`}
            style={connected ? { animation: "glow-pulse 2s ease-in-out infinite" } : undefined}
          />
          <span className="text-sm text-slate-300">
            {connected ? "System Online" : "Connecting..."}
          </span>
        </div>

        {/* Live mini stats preview */}
        {state && connected && (
          <div className="flex gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-emerald-400">
                {Math.round(state.healthScore)}
              </div>
              <div className="text-xs text-slate-500 mt-1">Health</div>
            </div>
            <div className="w-px bg-slate-700/50" />
            <div>
              <div className="text-3xl font-bold text-orange-400">
                {state.temperature?.toFixed(1)}&deg;
              </div>
              <div className="text-xs text-slate-500 mt-1">Temp</div>
            </div>
            <div className="w-px bg-slate-700/50" />
            <div>
              <div className="text-3xl font-bold text-violet-400">
                {state.ph?.toFixed(1)}
              </div>
              <div className="text-xs text-slate-500 mt-1">pH</div>
            </div>
          </div>
        )}

        {/* CTA */}
        <button
          onClick={onEnter}
          className="group relative mt-2 px-10 py-4 bg-emerald-500/15 border border-emerald-500/40 rounded-2xl text-emerald-300 font-semibold text-lg transition-all duration-300 hover:bg-emerald-500/25 hover:border-emerald-400/60 hover:shadow-[0_0_40px_rgba(52,211,153,0.2)] hover:scale-[1.03] active:scale-[0.98] cursor-pointer"
        >
          Enter Dashboard
          <span className="ml-2 inline-block transition-transform duration-300 group-hover:translate-x-1.5">
            &rarr;
          </span>
        </button>

        {/* Subtitle */}
        <p className="text-xs text-slate-600 max-w-md text-center leading-relaxed">
          Low-cost intelligent monitoring for sustainable biomass cultivation.
          Combining sensor data and computer vision for real-time health analysis.
        </p>
      </div>
    </div>
  );
}
