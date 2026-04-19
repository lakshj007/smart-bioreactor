import { Camera } from "lucide-react";

export default function CameraPanel() {
  return (
    <div className="glass rounded-2xl p-5">
      <h3
        className="text-[10px] font-semibold mb-4 tracking-[0.25em] uppercase"
        style={{ color: "var(--text-muted)" }}
      >
        Camera Feed
      </h3>
      <div
        className="rounded-xl aspect-video flex items-center justify-center relative overflow-hidden"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(94, 231, 200, 0.06), rgba(0,0,0,0.6))",
          border: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <div className="text-center flex flex-col items-center gap-3 px-4">
          <Camera size={26} style={{ color: "var(--accent)", opacity: 0.7 }} />
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Camera feed will appear here
          </p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Connect a camera to enable visual monitoring
          </p>
        </div>
      </div>
    </div>
  );
}
