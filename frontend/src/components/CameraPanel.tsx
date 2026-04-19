import { Camera, Crosshair, RefreshCw } from "lucide-react";
import { useState } from "react";

export default function CameraPanel() {
  const [streamError, setStreamError] = useState(false);
  const [calibrating, setCalibrating] = useState(false);
  const [calibrationResult, setCalibrationResult] = useState<string | null>(
    null
  );

  const streamUrl = "/api/camera/stream";

  async function handleCalibrate() {
    setCalibrating(true);
    setCalibrationResult(null);
    try {
      const res = await fetch("/api/camera/calibrate", { method: "POST" });
      const data = await res.json();
      if (data.error) {
        setCalibrationResult(`⚠ ${data.error}`);
      } else {
        setCalibrationResult("✓ Baseline captured");
      }
    } catch {
      setCalibrationResult("⚠ Failed to reach server");
    } finally {
      setCalibrating(false);
      setTimeout(() => setCalibrationResult(null), 4000);
    }
  }

  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3
          className="text-[10px] font-semibold tracking-[0.25em] uppercase"
          style={{ color: "var(--text-muted)" }}
        >
          Camera Feed
        </h3>
        <div className="flex gap-2">
          <button
            onClick={handleCalibrate}
            disabled={calibrating}
            title="Calibrate turbidity baseline (use with clear water)"
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] tracking-wider uppercase transition-all"
            style={{
              background: "rgba(94, 231, 200, 0.08)",
              border: "1px solid rgba(94, 231, 200, 0.15)",
              color: "var(--accent)",
              cursor: calibrating ? "wait" : "pointer",
              opacity: calibrating ? 0.5 : 1,
            }}
          >
            <Crosshair size={12} />
            {calibrating ? "…" : "Calibrate"}
          </button>
          <button
            onClick={() => setStreamError(false)}
            title="Refresh feed"
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] tracking-wider uppercase transition-all"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "var(--text-muted)",
              cursor: "pointer",
            }}
          >
            <RefreshCw size={12} />
          </button>
        </div>
      </div>

      <div
        className="rounded-xl aspect-video flex items-center justify-center relative overflow-hidden"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(94, 231, 200, 0.06), rgba(0,0,0,0.6))",
          border: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        {!streamError ? (
          <img
            src={streamUrl}
            alt="Live camera feed"
            onError={() => setStreamError(true)}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              borderRadius: "0.75rem",
            }}
          />
        ) : (
          <div className="text-center flex flex-col items-center gap-3 px-4">
            <Camera
              size={26}
              style={{ color: "var(--accent)", opacity: 0.7 }}
            />
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Camera feed unavailable
            </p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Start the backend server to enable live video
            </p>
          </div>
        )}

        {/* Calibration toast */}
        {calibrationResult && (
          <div
            className="absolute bottom-3 left-3 right-3 text-center text-xs py-2 px-3 rounded-lg animate-fade-in-up"
            style={{
              background: calibrationResult.startsWith("✓")
                ? "rgba(94, 231, 200, 0.15)"
                : "rgba(255, 160, 80, 0.15)",
              backdropFilter: "blur(8px)",
              border: `1px solid ${
                calibrationResult.startsWith("✓")
                  ? "rgba(94, 231, 200, 0.3)"
                  : "rgba(255, 160, 80, 0.3)"
              }`,
              color: calibrationResult.startsWith("✓")
                ? "var(--accent)"
                : "#ffa050",
            }}
          >
            {calibrationResult}
          </div>
        )}
      </div>
    </div>
  );
}
