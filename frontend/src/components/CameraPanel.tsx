import {
  Camera,
  Crosshair,
  Eye,
  VideoOff,
  CircleDot,
  Waves,
  Sun,
  Palette,
} from "lucide-react";
import { useState } from "react";
import { useTurbidity } from "../hooks/useTurbidity";

export default function CameraPanel() {
  const [cameraActive, setCameraActive] = useState(false);
  const [calibrationToast, setCalibrationToast] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const {
    videoRef,
    canvasRef,
    result,
    cameraReady,
    cameraError,
    calibrated,
    calibrate,
  } = useTurbidity(cameraActive, 2000);

  function handleCalibrate() {
    const bl = calibrate();
    if (bl) {
      setCalibrationToast("✓ Clear-water baseline captured");
    } else {
      setCalibrationToast("⚠ Camera not ready");
    }
    setTimeout(() => setCalibrationToast(null), 4000);
  }

  function toggleCamera() {
    setCameraActive((prev) => !prev);
  }

  // Turbidity label/color
  const turbidity = result?.turbidity ?? 0;
  const turbidityPct = Math.round(turbidity * 100);
  const turbidityNTU = Math.round(turbidity * 50 * 10) / 10; // rough mapping 0–50 NTU
  let turbidityLabel = "Clear";
  let turbidityColor = "var(--accent)";
  if (turbidity > 0.6) {
    turbidityLabel = "Turbid";
    turbidityColor = "var(--danger)";
  } else if (turbidity > 0.3) {
    turbidityLabel = "Moderate";
    turbidityColor = "var(--warning)";
  }

  return (
    <div className="glass rounded-2xl p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3
          className="text-[10px] font-semibold tracking-[0.25em] uppercase"
          style={{ color: "var(--text-muted)" }}
        >
          Turbidity Camera
        </h3>
        <div className="flex gap-2">
          {cameraActive && cameraReady && (
            <button
              onClick={handleCalibrate}
              title="Calibrate with clear water"
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] tracking-wider uppercase transition-all"
              style={{
                background: "rgba(94, 231, 200, 0.08)",
                border: "1px solid rgba(94, 231, 200, 0.15)",
                color: "var(--accent)",
                cursor: "pointer",
              }}
            >
              <Crosshair size={12} />
              Calibrate
            </button>
          )}
          <button
            onClick={toggleCamera}
            title={cameraActive ? "Stop camera" : "Start camera"}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] tracking-wider uppercase transition-all"
            style={{
              background: cameraActive
                ? "rgba(255, 107, 107, 0.08)"
                : "rgba(94, 231, 200, 0.08)",
              border: `1px solid ${
                cameraActive
                  ? "rgba(255, 107, 107, 0.15)"
                  : "rgba(94, 231, 200, 0.15)"
              }`,
              color: cameraActive ? "var(--danger)" : "var(--accent)",
              cursor: "pointer",
            }}
          >
            {cameraActive ? <VideoOff size={12} /> : <Camera size={12} />}
            {cameraActive ? "Stop" : "Start"}
          </button>
        </div>
      </div>

      {/* Video feed */}
      <div
        className="rounded-xl aspect-video flex items-center justify-center relative overflow-hidden"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(94, 231, 200, 0.06), rgba(0,0,0,0.6))",
          border: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        {/* Hidden offscreen canvas for pixel analysis */}
        <canvas ref={canvasRef} style={{ display: "none" }} />

        {cameraActive && !cameraError ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                borderRadius: "0.75rem",
                transform: "scaleX(1)", // no mirror for back cam
              }}
            />

            {/* Overlay: Live turbidity badge */}
            {result && (
              <div
                className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-lg"
                style={{
                  background: "rgba(0,0,0,0.65)",
                  backdropFilter: "blur(12px)",
                  border: `1px solid ${turbidityColor}33`,
                }}
              >
                <div
                  className="w-2 h-2 rounded-full animate-glow-pulse"
                  style={{
                    background: turbidityColor,
                    boxShadow: `0 0 8px ${turbidityColor}`,
                  }}
                />
                <span
                  className="text-xs font-semibold tabular-nums"
                  style={{ color: turbidityColor }}
                >
                  {turbidityNTU} NTU
                </span>
                <span
                  className="text-[10px] uppercase tracking-wider"
                  style={{ color: "var(--text-muted)" }}
                >
                  {turbidityLabel}
                </span>
              </div>
            )}

            {/* Overlay: calibration indicator */}
            {calibrated && (
              <div
                className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] tracking-wider uppercase"
                style={{
                  background: "rgba(0,0,0,0.5)",
                  backdropFilter: "blur(8px)",
                  color: "var(--accent)",
                  border: "1px solid rgba(94, 231, 200, 0.2)",
                }}
              >
                <CircleDot size={10} />
                Calibrated
              </div>
            )}

            {/* Center ROI visual guide */}
            <div
              className="absolute pointer-events-none"
              style={{
                top: "25%",
                left: "25%",
                width: "50%",
                height: "50%",
                border: `1px dashed rgba(94, 231, 200, 0.25)`,
                borderRadius: "0.5rem",
              }}
            />
          </>
        ) : cameraError ? (
          <div className="text-center flex flex-col items-center gap-3 px-4">
            <VideoOff
              size={26}
              style={{ color: "var(--danger)", opacity: 0.7 }}
            />
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              {cameraError}
            </p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Allow camera access and try again
            </p>
          </div>
        ) : (
          <div className="text-center flex flex-col items-center gap-3 px-4">
            <Camera
              size={26}
              style={{ color: "var(--accent)", opacity: 0.7 }}
            />
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              {cameraActive ? "Connecting to camera…" : "Camera inactive"}
            </p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Point the back camera at the jar and press Start
            </p>
          </div>
        )}

        {/* Calibration toast */}
        {calibrationToast && (
          <div
            className="absolute bottom-3 left-3 right-3 text-center text-xs py-2 px-3 rounded-lg animate-fade-in-up"
            style={{
              background: calibrationToast.startsWith("✓")
                ? "rgba(94, 231, 200, 0.15)"
                : "rgba(255, 160, 80, 0.15)",
              backdropFilter: "blur(8px)",
              border: `1px solid ${
                calibrationToast.startsWith("✓")
                  ? "rgba(94, 231, 200, 0.3)"
                  : "rgba(255, 160, 80, 0.3)"
              }`,
              color: calibrationToast.startsWith("✓")
                ? "var(--accent)"
                : "#ffa050",
            }}
          >
            {calibrationToast}
          </div>
        )}
      </div>

      {/* Turbidity metrics panel — shown when camera is active and has results */}
      {cameraActive && result && (
        <div className="mt-4 space-y-3">
          {/* Main turbidity bar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Eye size={14} style={{ color: turbidityColor }} />
                <span
                  className="text-[11px] tracking-[0.18em] uppercase font-medium"
                  style={{ color: "var(--text-muted)" }}
                >
                  Turbidity
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span
                  className="text-lg font-semibold tabular-nums"
                  style={{ color: turbidityColor }}
                >
                  {turbidityNTU}
                </span>
                <span
                  className="text-[10px]"
                  style={{ color: "var(--text-muted)" }}
                >
                  NTU
                </span>
              </div>
            </div>

            {/* Gradient bar */}
            <div
              className="h-2 rounded-full overflow-hidden relative"
              style={{
                background:
                  "linear-gradient(90deg, rgba(94,231,200,0.15), rgba(255,180,84,0.15), rgba(255,107,107,0.15))",
              }}
            >
              <div
                className="absolute top-0 bottom-0 rounded-full transition-all duration-700"
                style={{
                  width: `${Math.max(2, turbidityPct)}%`,
                  background: `linear-gradient(90deg, var(--accent), ${turbidityColor})`,
                  boxShadow: `0 0 12px ${turbidityColor}44`,
                }}
              />
              {/* Needle */}
              <div
                className="absolute top-0 bottom-0 w-0.5 rounded-full transition-all duration-700"
                style={{
                  left: `${turbidityPct}%`,
                  background: "#fff",
                  boxShadow: "0 0 4px rgba(255,255,255,0.5)",
                }}
              />
            </div>

            <div className="mt-1 flex justify-between text-[9px]" style={{ color: "var(--text-muted)" }}>
              <span>Clear</span>
              <span>Moderate</span>
              <span>Turbid</span>
            </div>
          </div>

          {/* Toggle details */}
          <button
            onClick={() => setShowDetails((d) => !d)}
            className="text-[10px] tracking-wider uppercase transition-colors"
            style={{ color: "var(--text-muted)", cursor: "pointer", background: "none", border: "none", padding: 0 }}
          >
            {showDetails ? "Hide" : "Show"} breakdown ▸
          </button>

          {/* Detail sub-metrics */}
          {showDetails && (
            <div
              className="grid grid-cols-3 gap-2 animate-fade-in"
            >
              <MetricPill
                icon={<Waves size={12} />}
                label="Sharpness"
                value={`${Math.round((1 - result.sharpness) * 100)}%`}
                color={result.sharpness > 0.5 ? "var(--warning)" : "var(--accent)"}
              />
              <MetricPill
                icon={<Palette size={12} />}
                label="Color"
                value={`${Math.round(result.saturationMean)}`}
                color={result.colorScore > 0.5 ? "var(--warning)" : "var(--accent)"}
              />
              <MetricPill
                icon={<Sun size={12} />}
                label="Brightness"
                value={`${Math.round(result.avgBrightness)}`}
                color={result.brightnessScore > 0.5 ? "var(--warning)" : "var(--accent)"}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MetricPill({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div
      className="rounded-lg p-2 flex flex-col items-center gap-1"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div style={{ color }}>{icon}</div>
      <span
        className="text-sm font-semibold tabular-nums"
        style={{ color }}
      >
        {value}
      </span>
      <span
        className="text-[9px] tracking-wider uppercase"
        style={{ color: "var(--text-muted)" }}
      >
        {label}
      </span>
    </div>
  );
}
