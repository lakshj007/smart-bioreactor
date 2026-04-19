interface BioreactorVisualProps {
  size?: "sm" | "lg" | "xl";
}

export default function BioreactorVisual({ size = "lg" }: BioreactorVisualProps) {
  const dims =
    size === "xl"
      ? "w-[420px] h-[560px]"
      : size === "lg"
        ? "w-72 h-96"
        : "w-56 h-72";

  return (
    <div className={`relative ${dims} mx-auto animate-float`}>
      {/* Outer aqua glow — minimal */}
      <div
        className="absolute inset-0 rounded-full blur-[120px]"
        style={{ backgroundColor: "var(--accent)", opacity: 0.025 }}
      />

      <svg
        viewBox="0 0 200 300"
        className="relative w-full h-full"
        style={{ filter: "drop-shadow(0 30px 40px rgba(0, 0, 0, 0.5))" }}
      >
        <defs>
          {/* Liquid gradient — softer */}
          <linearGradient id="liquidGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5EE7C8" stopOpacity="0.28" />
            <stop offset="50%" stopColor="#3FB8E8" stopOpacity="0.36" />
            <stop offset="100%" stopColor="#1E5A82" stopOpacity="0.55" />
          </linearGradient>

          {/* Glass gradient */}
          <linearGradient id="glassGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.04" />
            <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.10" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.04" />
          </linearGradient>

          {/* Top reflection */}
          <linearGradient id="topShine" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>

          <filter id="glow">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <clipPath id="flaskInterior">
            <path d="M78,55 L78,185 Q78,255 100,262 Q122,255 122,185 L122,55 Z" />
          </clipPath>
        </defs>

        {/* Flask body */}
        <path
          d="M80,45 L80,10 Q80,5 85,5 L115,5 Q120,5 120,10 L120,45 L138,185 Q142,265 100,272 Q58,265 62,185 Z"
          fill="url(#glassGrad)"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="0.8"
        />

        {/* Glass highlight left */}
        <path
          d="M72,180 Q68,120 78,55 L80,55 Q70,120 74,180 Z"
          fill="#FFFFFF"
          opacity="0.06"
        />

        {/* Liquid fill */}
        <g clipPath="url(#flaskInterior)">
          <rect x="55" y="95" width="90" height="200" fill="url(#liquidGrad)" />
          <ellipse cx="100" cy="96" rx="25" ry="4" fill="#5EE7C8" opacity="0.22" className="animate-wave" />
          <ellipse cx="95" cy="160" rx="20" ry="50" fill="#B8FFE5" opacity="0.05" className="animate-shimmer" />
        </g>

        {/* Top reflection on liquid */}
        <ellipse cx="100" cy="100" rx="22" ry="3" fill="url(#topShine)" />

        {/* Bubbles inside flask */}
        <g clipPath="url(#flaskInterior)">
          <circle cx="90" cy="220" r="3" fill="#B8FFE5" opacity="0.6" className="animate-bubble-1" />
          <circle cx="105" cy="240" r="2" fill="#5EE7C8" opacity="0.55" className="animate-bubble-2" />
          <circle cx="95" cy="200" r="4" fill="#B8FFE5" opacity="0.5" className="animate-bubble-3" />
          <circle cx="108" cy="230" r="2.5" fill="#5EE7C8" opacity="0.45" className="animate-bubble-4" />
          <circle cx="88" cy="210" r="1.5" fill="#B8FFE5" opacity="0.6" className="animate-bubble-5" />
          <circle cx="100" cy="250" r="3.5" fill="#5EE7C8" opacity="0.4" className="animate-bubble-6" />
          <circle cx="112" cy="215" r="2" fill="#B8FFE5" opacity="0.5" className="animate-bubble-7" />
          <circle cx="92" cy="245" r="2.5" fill="#5EE7C8" opacity="0.45" className="animate-bubble-8" />
        </g>

        {/* Bottom glow */}
        <ellipse cx="100" cy="220" rx="40" ry="22" fill="#5EE7C8" opacity="0.08" filter="url(#glow)" />

        {/* Flask cap */}
        <rect x="83" y="1" width="34" height="6" rx="2" fill="rgba(255,255,255,0.18)" />
        <rect x="86" y="0" width="28" height="2" rx="1" fill="rgba(255,255,255,0.10)" />

        {/* Measurement marks */}
        {[120, 150, 180, 210, 240].map((y) => (
          <line
            key={y}
            x1="120"
            y1={y}
            x2={y === 180 ? "128" : "125"}
            y2={y}
            stroke="rgba(255,255,255,0.25)"
            strokeWidth="0.8"
          />
        ))}

        {/* Sensor probe */}
        <rect x="128" y="140" width="10" height="3" rx="1" fill="rgba(255,255,255,0.25)" />
        <circle cx="141" cy="141.5" r="2.5" fill="#5EE7C8" opacity="0.85">
          <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" />
        </circle>
      </svg>
    </div>
  );
}
