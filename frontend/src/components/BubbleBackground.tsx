const BUBBLES = [
  { left: "5%", size: 6, duration: 14, delay: 0, opacity: 0.06 },
  { left: "12%", size: 10, duration: 18, delay: 2, opacity: 0.04 },
  { left: "22%", size: 4, duration: 11, delay: 5, opacity: 0.08 },
  { left: "30%", size: 14, duration: 20, delay: 1, opacity: 0.03 },
  { left: "38%", size: 7, duration: 15, delay: 7, opacity: 0.06 },
  { left: "45%", size: 5, duration: 12, delay: 3, opacity: 0.07 },
  { left: "52%", size: 18, duration: 24, delay: 4, opacity: 0.025 },
  { left: "60%", size: 8, duration: 16, delay: 0, opacity: 0.05 },
  { left: "68%", size: 12, duration: 22, delay: 6, opacity: 0.035 },
  { left: "75%", size: 6, duration: 13, delay: 9, opacity: 0.06 },
  { left: "82%", size: 9, duration: 17, delay: 2, opacity: 0.04 },
  { left: "90%", size: 16, duration: 21, delay: 5, opacity: 0.03 },
  { left: "15%", size: 3, duration: 10, delay: 8, opacity: 0.08 },
  { left: "48%", size: 5, duration: 19, delay: 1, opacity: 0.05 },
  { left: "95%", size: 7, duration: 14, delay: 10, opacity: 0.05 },
];

export default function BubbleBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {BUBBLES.map((b, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-emerald-400"
          style={{
            left: b.left,
            width: b.size,
            height: b.size,
            opacity: b.opacity,
            bottom: "-5%",
            animation: `bubble-float ${b.duration}s ease-in infinite`,
            animationDelay: `${b.delay}s`,
          }}
        />
      ))}

      {/* Subtle radial gradient at center-bottom */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-emerald-900/10 rounded-full blur-[120px]" />
    </div>
  );
}
