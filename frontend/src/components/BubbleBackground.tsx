const PARTICLES = [
  { left: "5%", size: 3, duration: 22, delay: 0 },
  { left: "12%", size: 5, duration: 26, delay: 3 },
  { left: "20%", size: 2, duration: 18, delay: 6 },
  { left: "28%", size: 4, duration: 24, delay: 1 },
  { left: "36%", size: 3, duration: 20, delay: 8 },
  { left: "45%", size: 6, duration: 30, delay: 4 },
  { left: "54%", size: 3, duration: 21, delay: 2 },
  { left: "62%", size: 4, duration: 25, delay: 7 },
  { left: "70%", size: 2, duration: 17, delay: 5 },
  { left: "78%", size: 5, duration: 27, delay: 9 },
  { left: "86%", size: 3, duration: 23, delay: 3 },
  { left: "94%", size: 4, duration: 19, delay: 6 },
];

export default function BubbleBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Aqua ambient glow — top (subtle) */}
      <div
        className="absolute -top-40 left-1/2 -translate-x-1/2 rounded-full blur-[200px]"
        style={{
          width: 900,
          height: 500,
          background:
            "radial-gradient(ellipse at center, rgba(94, 231, 200, 0.08), transparent 70%)",
        }}
      />
      {/* Cool blue ambient — bottom right (subtle) */}
      <div
        className="absolute -bottom-40 right-0 rounded-full blur-[180px]"
        style={{
          width: 700,
          height: 500,
          background:
            "radial-gradient(ellipse at center, rgba(79, 182, 255, 0.06), transparent 70%)",
        }}
      />

      {/* Subtle grid */}
      <div className="absolute inset-0 grid-backdrop opacity-60" />

      {/* Floating particles */}
      {PARTICLES.map((p, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            left: p.left,
            width: p.size,
            height: p.size,
            opacity: 0.18,
            bottom: "-5%",
            background:
              "radial-gradient(circle at 30% 30%, rgba(184, 255, 229, 0.8), rgba(94, 231, 200, 0.2))",
            boxShadow: "0 0 8px rgba(94, 231, 200, 0.4)",
            animation: `particle-drift ${p.duration}s ease-in infinite`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
