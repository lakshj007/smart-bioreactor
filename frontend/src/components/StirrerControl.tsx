import { useState } from "react";

interface StirrerControlProps {
  on: boolean;
}

export default function StirrerControl({ on }: StirrerControlProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/stirrer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ on: !on }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="glass rounded-2xl p-5 flex flex-col justify-between"
      style={{ minHeight: 132 }}
    >
      <span
        className="text-[11px] tracking-[0.18em] uppercase font-medium"
        style={{ color: "var(--text-muted)" }}
      >
        Stirrer
      </span>
      <div className="flex items-center justify-between gap-3 mt-2">
        <div>
          <div
            className="text-2xl font-semibold tabular-nums"
            style={{ color: "var(--text-primary)" }}
          >
            {on ? "ON" : "OFF"}
          </div>
          <p
            className="text-[10px] mt-1 tracking-widest uppercase"
            style={{ color: error ? "#ff6b6b" : "var(--text-muted)" }}
          >
            {error ?? (busy ? "sending…" : "servo control")}
          </p>
        </div>
        <button
          onClick={toggle}
          disabled={busy}
          aria-pressed={on}
          className="relative inline-flex h-8 w-14 items-center rounded-full transition-colors disabled:opacity-50"
          style={{
            background: on ? "var(--accent)" : "rgba(255,255,255,0.15)",
          }}
        >
          <span
            className="inline-block h-6 w-6 transform rounded-full bg-white transition-transform"
            style={{ transform: on ? "translateX(28px)" : "translateX(4px)" }}
          />
        </button>
      </div>
    </div>
  );
}
