import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Wifi,
  WifiOff,
  Activity,
  Droplets,
  FlaskConical,
  Eye,
  Cpu,
  ChevronDown,
} from "lucide-react";
import type { ReactorState } from "../types";
import BioreactorVisual from "./BioreactorVisual";
import BubbleBackground from "./BubbleBackground";

interface HomePageProps {
  connected: boolean;
  state: ReactorState | null;
  onEnter: () => void;
}

export default function HomePage({ connected, state, onEnter }: HomePageProps) {
  const [scrollY, setScrollY] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Parallax for the bioreactor — drifts up & fades as you scroll
  const heroParallax = Math.min(scrollY * 0.35, 240);
  const heroOpacity = Math.max(1 - scrollY / 700, 0);
  const heroScale = Math.max(1 - scrollY / 4000, 0.85);

  return (
    <div className="relative">
      <BubbleBackground />

      {/* Top nav */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl"
        style={{
          background: "rgba(0, 0, 0, 0.55)",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <div className="max-w-7xl mx-auto px-6 sm:px-8 h-12 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-5 h-5 rounded-full"
              style={{
                background:
                  "radial-gradient(circle at 30% 30%, #B8FFE5, #5EE7C8 50%, #1E5A82)",
                boxShadow: "0 0 10px rgba(94, 231, 200, 0.5)",
              }}
            />
            <span className="text-sm font-medium tracking-tight">BioSphere</span>
          </div>
          <div className="hidden sm:flex items-center gap-7 text-xs" style={{ color: "var(--text-secondary)" }}>
            <a href="#overview" className="hover:text-white transition-colors">Overview</a>
            <a href="#sensors" className="hover:text-white transition-colors">Sensors</a>
            <a href="#intelligence" className="hover:text-white transition-colors">Intelligence</a>
            <button
              onClick={onEnter}
              className="px-3 py-1 rounded-full font-medium transition-colors"
              style={{
                background: "var(--accent-dim)",
                color: "var(--accent)",
                border: "1px solid rgba(94, 231, 200, 0.25)",
              }}
            >
              Open Dashboard
            </button>
          </div>
          <button
            onClick={onEnter}
            className="sm:hidden text-xs font-medium"
            style={{ color: "var(--accent)" }}
          >
            Dashboard ›
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-20 pb-12"
      >
        {/* Bioreactor as background centerpiece */}
        <div
          className="absolute left-1/2 -translate-x-1/2 top-[18vh] z-0 pointer-events-none"
          style={{
            transform: `translate(-50%, ${-heroParallax}px) scale(${heroScale})`,
            opacity: heroOpacity,
            transition: "opacity 0.2s linear",
          }}
        >
          <BioreactorVisual size="xl" />
        </div>

        {/* Eyebrow */}
        <div
          className="relative z-10 mt-6 mb-4 px-3 py-1 rounded-full text-[11px] tracking-[0.2em] uppercase font-medium animate-fade-in animate-delay-100"
          style={{
            color: "var(--accent)",
            border: "1px solid rgba(94, 231, 200, 0.25)",
            background: "var(--accent-dim)",
          }}
        >
          Smart Bioreactor · DataHacks
        </div>

        {/* Title — pb-6 gives descenders room at 120px font size */}
        <h1
          className="relative z-10 font-display text-balance text-center text-[64px] sm:text-[96px] lg:text-[120px] animate-fade-in-up pb-6"
          style={{ lineHeight: 1.1 }}
        >
          <span className="text-gradient-soft block">Cultivating life,</span>
          <span className="text-gradient-aqua block">intelligently.</span>
        </h1>

        {/* CTAs */}
        <div className="relative z-10 mt-10 flex items-center gap-4 animate-fade-in-up animate-delay-300">
          <button
            id="enter-dashboard-btn"
            onClick={onEnter}
            className="btn-primary group flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium cursor-pointer"
            style={{
              background:
                "linear-gradient(180deg, #5EE7C8 0%, #3FB8E8 100%)",
              color: "#06151A",
            }}
          >
            Open Dashboard
            <ArrowRight
              size={16}
              className="transition-transform duration-300 group-hover:translate-x-1"
            />
          </button>
          <a
            href="#overview"
            className="flex items-center gap-2 px-5 py-3 rounded-full text-sm transition-colors"
            style={{
              color: "var(--text-secondary)",
              border: "1px solid rgba(255,255,255,0.10)",
            }}
          >
            Learn more
          </a>
        </div>

        {/* Status pill */}
        <div
          className="relative z-10 mt-10 flex items-center gap-3 px-4 py-2 rounded-full backdrop-blur-md animate-fade-in animate-delay-500"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          {connected ? (
            <Wifi size={12} style={{ color: "var(--accent)" }} />
          ) : (
            <WifiOff size={12} style={{ color: "var(--danger)" }} />
          )}
          <div
            className={`w-1.5 h-1.5 rounded-full ${connected ? "animate-glow-pulse" : ""}`}
            style={{ backgroundColor: connected ? "var(--accent)" : "var(--danger)" }}
          />
          <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
            {connected ? "Live system online" : "Connecting to reactor..."}
          </span>
        </div>

        {/* Live mini stats */}
        {state && connected && (
          <div className="relative z-10 mt-12 grid grid-cols-3 gap-6 sm:gap-12 text-center animate-fade-in animate-delay-700">
            <Stat label="Health" value={Math.round(state.healthScore).toString()} accent />
            <Stat label="Temp" value={state.temperature != null ? `${state.temperature.toFixed(1)}°` : "—"} />
            <Stat label="pH" value={state.ph != null ? state.ph.toFixed(1) : "—"} />
          </div>
        )}

        {/* Scroll indicator */}
        <div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 animate-fade-in animate-delay-700"
          style={{ color: "var(--text-muted)" }}
        >
          <span className="text-[10px] tracking-[0.2em] uppercase">Scroll</span>
          <ChevronDown size={14} className="animate-glow-pulse" />
        </div>
      </section>

      {/* ── OVERVIEW ── */}
      <section
        id="overview"
        className="relative z-10 px-6 py-32 sm:py-40 max-w-5xl mx-auto"
      >
        <div className="text-center max-w-3xl mx-auto">
          <p
            className="text-xs tracking-[0.25em] uppercase mb-4"
            style={{ color: "var(--accent)" }}
          >
            What it is
          </p>
          <h2 className="font-display text-4xl sm:text-6xl text-balance">
            <span className="text-gradient-soft">A nervous system</span>
            <br />
            <span style={{ color: "var(--text-muted)" }}>for living water.</span>
          </h2>
          <p
            className="font-body mt-8 text-lg sm:text-xl text-balance"
            style={{ color: "var(--text-secondary)" }}
          >
            Algae and microbial cultures are sensitive — small shifts in temperature,
            pH, or turbidity can collapse a bloom overnight. BioSphere combines
            inexpensive sensors, an onboard camera, and a trained ML model to keep
            cultures healthy in real time, surfacing what's wrong and what to do next.
          </p>
        </div>
      </section>

      {/* ── SENSORS GRID ── */}
      <section id="sensors" className="relative z-10 px-6 py-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p
              className="text-xs tracking-[0.25em] uppercase mb-4"
              style={{ color: "var(--accent)" }}
            >
              The senses
            </p>
            <h2 className="font-display text-4xl sm:text-5xl text-gradient-soft">
              Every signal that matters.
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-stagger">
            <FeatureCard
              icon={<Droplets size={20} />}
              title="Water Temperature"
              body="Detects thermal stress that slows growth or triggers die-off."
            />
            <FeatureCard
              icon={<FlaskConical size={20} />}
              title="pH Level"
              body="Tracks the chemistry that decides whether your culture thrives."
            />
            <FeatureCard
              icon={<Eye size={20} />}
              title="Water Turbidity"
              body="Vision-based density sensing measures biomass without disturbing the culture."
            />
            <FeatureCard
              icon={<Activity size={20} />}
              title="Health Score"
              body="A single 0–100 number distilled from every signal — and trending in real time."
            />
          </div>
        </div>
      </section>

      {/* ── INTELLIGENCE ── */}
      <section
        id="intelligence"
        className="relative z-10 px-6 py-32 max-w-6xl mx-auto"
      >
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <p
              className="text-xs tracking-[0.25em] uppercase mb-4"
              style={{ color: "var(--accent)" }}
            >
              The intelligence
            </p>
            <h2 className="font-display text-4xl sm:text-5xl text-balance">
              <span className="text-gradient-soft">Learns the culture.</span>
              <br />
              <span style={{ color: "var(--text-muted)" }}>Predicts the crash.</span>
            </h2>
            <p
              className="font-body mt-6 text-lg sm:text-xl"
              style={{ color: "var(--text-secondary)" }}
            >
              A gradient-boosted model trained on oceanographic and lab data
              fuses every sensor stream into a single health score, classifies
              anomaly risk, and recommends the next intervention — pH up, more
              light, fresh nutrients — before damage shows up.
            </p>

            <div className="mt-10 grid grid-cols-2 gap-4 max-w-md">
              <SpecBox kpi="<200ms" label="Inference per cycle" />
              <SpecBox kpi="500" label="Rolling history points" />
              <SpecBox kpi="3-tier" label="Risk classification" />
              <SpecBox kpi="Real-time" label="WebSocket stream" />
            </div>
          </div>

          <div className="glass rounded-3xl p-10 relative overflow-hidden">
            <div
              className="absolute -top-20 -right-20 w-72 h-72 rounded-full blur-[80px]"
              style={{ background: "rgba(94, 231, 200, 0.20)" }}
            />
            <div className="relative">
              <Cpu size={28} style={{ color: "var(--accent)" }} />
              <h3 className="mt-5 font-display text-2xl text-gradient-soft">
                Sensor fusion, on-device.
              </h3>
              <p
                className="font-body mt-3 text-base"
                style={{ color: "var(--text-secondary)" }}
              >
                Edge processing keeps latency low and dependency on the cloud
                minimal. Your reactor stays smart even when the network drops.
              </p>

              <div className="mt-8 space-y-3">
                {[
                  "Multivariate trend detection",
                  "Vision-based biomass estimation",
                  "Adaptive recommendation engine",
                ].map((line) => (
                  <div key={line} className="flex items-center gap-3 text-sm">
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: "var(--accent)" }}
                    />
                    <span style={{ color: "var(--text-secondary)" }}>{line}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="relative z-10 px-6 py-32 text-center">
        <h2 className="font-display text-5xl sm:text-7xl text-balance pb-2">
          <span className="text-gradient-aqua">Ready to listen to your reactor?</span>
        </h2>
        <p
          className="font-body mt-6 text-lg sm:text-xl max-w-xl mx-auto"
          style={{ color: "var(--text-secondary)" }}
        >
          Open the dashboard to see live sensor streams, health trends, and
          AI-driven recommendations.
        </p>
        <button
          onClick={onEnter}
          className="btn-primary group mt-10 inline-flex items-center gap-2 px-8 py-4 rounded-full text-base font-medium cursor-pointer"
          style={{
            background: "linear-gradient(180deg, #5EE7C8 0%, #3FB8E8 100%)",
            color: "#06151A",
          }}
        >
          Open Dashboard
          <ArrowRight
            size={18}
            className="transition-transform duration-300 group-hover:translate-x-1"
          />
        </button>
      </section>

      <footer
        className="relative z-10 px-6 py-10 text-center text-xs"
        style={{
          color: "var(--text-muted)",
          borderTop: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        BioSphere · Built for DataHacks · {new Date().getFullYear()}
      </footer>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div>
      <div
        className="text-3xl sm:text-4xl font-semibold tabular-nums"
        style={{ color: accent ? "var(--accent)" : "var(--text-primary)" }}
      >
        {value}
      </div>
      <div
        className="text-[10px] mt-2 tracking-[0.25em] uppercase"
        style={{ color: "var(--text-muted)" }}
      >
        {label}
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div
      className="glass rounded-2xl p-6 transition-all duration-500 hover:-translate-y-1"
      style={{ minHeight: 200 }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center"
        style={{
          background: "var(--accent-dim)",
          color: "var(--accent)",
        }}
      >
        {icon}
      </div>
      <h3 className="mt-5 text-base font-semibold tracking-tight">{title}</h3>
      <p
        className="font-body mt-2 text-[15px]"
        style={{ color: "var(--text-secondary)" }}
      >
        {body}
      </p>
    </div>
  );
}

function SpecBox({ kpi, label }: { kpi: string; label: string }) {
  return (
    <div
      className="rounded-xl px-4 py-3"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div
        className="text-xl font-semibold"
        style={{ color: "var(--accent)" }}
      >
        {kpi}
      </div>
      <div
        className="text-[10px] mt-1 tracking-widest uppercase"
        style={{ color: "var(--text-muted)" }}
      >
        {label}
      </div>
    </div>
  );
}
