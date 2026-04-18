export default function BioreactorVisual() {
  return (
    <div className="relative w-64 h-80 mx-auto">
      {/* Outer glow */}
      <div className="absolute inset-0 bg-emerald-500/15 rounded-full blur-[80px] animate-glow-pulse" />

      <svg viewBox="0 0 200 300" className="relative w-full h-full drop-shadow-[0_0_40px_rgba(52,211,153,0.2)]">
        <defs>
          {/* Liquid gradient */}
          <linearGradient id="liquidGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#34d399" stopOpacity="0.5" />
            <stop offset="40%" stopColor="#10b981" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#047857" stopOpacity="0.9" />
          </linearGradient>

          {/* Glass gradient */}
          <linearGradient id="glassGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#94a3b8" stopOpacity="0.15" />
            <stop offset="50%" stopColor="#cbd5e1" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#94a3b8" stopOpacity="0.15" />
          </linearGradient>

          {/* Glow filter */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Clip for liquid inside flask */}
          <clipPath id="flaskInterior">
            <path d="M78,55 L78,185 Q78,255 100,262 Q122,255 122,185 L122,55 Z" />
          </clipPath>
        </defs>

        {/* Flask body outline */}
        <path
          d="M80,45 L80,10 Q80,5 85,5 L115,5 Q120,5 120,10 L120,45 L138,185 Q142,265 100,272 Q58,265 62,185 Z"
          fill="url(#glassGrad)"
          stroke="#475569"
          strokeWidth="1.5"
          strokeOpacity="0.5"
        />

        {/* Glass highlight left */}
        <path
          d="M72,180 Q68,120 78,55 L80,55 Q70,120 74,180 Z"
          fill="#cbd5e1"
          opacity="0.06"
        />

        {/* Liquid fill */}
        <g clipPath="url(#flaskInterior)">
          <rect x="55" y="95" width="90" height="200" fill="url(#liquidGrad)" />

          {/* Wave surface */}
          <ellipse cx="100" cy="96" rx="25" ry="4" fill="#34d399" opacity="0.3" className="animate-wave" />

          {/* Liquid shimmer */}
          <ellipse cx="95" cy="160" rx="15" ry="40" fill="#6ee7b7" opacity="0.08" className="animate-shimmer" />
        </g>

        {/* Bubbles inside flask */}
        <g clipPath="url(#flaskInterior)">
          <circle cx="90" cy="220" r="3" fill="#6ee7b7" opacity="0.6" className="animate-bubble-1" />
          <circle cx="105" cy="240" r="2" fill="#a7f3d0" opacity="0.5" className="animate-bubble-2" />
          <circle cx="95" cy="200" r="4" fill="#6ee7b7" opacity="0.5" className="animate-bubble-3" />
          <circle cx="108" cy="230" r="2.5" fill="#a7f3d0" opacity="0.4" className="animate-bubble-4" />
          <circle cx="88" cy="210" r="1.5" fill="#6ee7b7" opacity="0.6" className="animate-bubble-5" />
          <circle cx="100" cy="250" r="3.5" fill="#a7f3d0" opacity="0.35" className="animate-bubble-6" />
        </g>

        {/* Bottom glow from liquid */}
        <ellipse cx="100" cy="220" rx="35" ry="20" fill="#34d399" opacity="0.12" filter="url(#glow)" />

        {/* Flask cap/stopper */}
        <rect x="83" y="1" width="34" height="6" rx="2" fill="#64748b" opacity="0.6" />

        {/* Measurement marks on flask */}
        <line x1="120" y1="120" x2="125" y2="120" stroke="#64748b" strokeWidth="0.8" strokeOpacity="0.4" />
        <line x1="120" y1="150" x2="125" y2="150" stroke="#64748b" strokeWidth="0.8" strokeOpacity="0.4" />
        <line x1="120" y1="180" x2="127" y2="180" stroke="#64748b" strokeWidth="0.8" strokeOpacity="0.4" />
        <line x1="120" y1="210" x2="125" y2="210" stroke="#64748b" strokeWidth="0.8" strokeOpacity="0.4" />

        {/* Small sensor/probe on side */}
        <rect x="128" y="140" width="8" height="3" rx="1" fill="#475569" opacity="0.5" />
        <circle cx="139" cy="141.5" r="2" fill="#34d399" opacity="0.6">
          <animate attributeName="opacity" values="0.3;0.8;0.3" dur="2s" repeatCount="indefinite" />
        </circle>
      </svg>
    </div>
  );
}
