import React from 'react';

interface WaxSealProps {
  status: 'intact' | 'active' | 'broken';
  size?: number;
  label?: string;
}

export const WaxSeal: React.FC<WaxSealProps> = ({
  status,
  size = 80,
  label = 'HMAC SEAL',
}) => {
  if (status === 'broken') {
    return (
      <div className="flex flex-col items-center justify-center relative animate-alarm-pulse">
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          className="filter drop-shadow-[0_0_20px_rgba(239,68,68,0.7)]"
        >
          {/* Shattered Seal Fragments */}
          <polygon points="50,10 75,25 60,50 45,45" fill="#DC2626" className="transform -translate-x-2 -translate-y-2 rotate-6 transition-all duration-500" />
          <polygon points="75,25 90,50 65,65 60,50" fill="#EF4444" className="transform translate-x-3 -translate-y-1 rotate-12 transition-all duration-500" />
          <polygon points="90,50 75,85 55,70 65,65" fill="#B91C1C" className="transform translate-x-2 translate-y-3 -rotate-12 transition-all duration-500" />
          <polygon points="50,90 25,75 40,55 55,70" fill="#EF4444" className="transform -translate-x-2 translate-y-3 rotate-15 transition-all duration-500" />
          <polygon points="25,75 10,50 35,35 40,55" fill="#991B1B" className="transform -translate-x-3 -translate-y-1 -rotate-6 transition-all duration-500" />
          <polygon points="10,50 25,25 45,45 35,35" fill="#DC2626" className="transform -translate-x-2 -translate-y-3 rotate-6 transition-all duration-500" />
          
          {/* Crack lines */}
          <path d="M50 10 L45 45 L60 50 L65 65 L55 70 L50 90" stroke="#FFFFFF" strokeWidth="2.5" fill="none" />
          <path d="M45 45 L10 50" stroke="#FFFFFF" strokeWidth="2.5" fill="none" />
          <path d="M60 50 L90 50" stroke="#FFFFFF" strokeWidth="2.5" fill="none" />
        </svg>
        <span className="mt-2 text-[10px] font-mono font-bold text-crimson-400 uppercase tracking-widest bg-crimson-950/80 px-2 py-0.5 rounded border border-crimson-700">
          SEAL BROKEN (TAMPER DETECTED)
        </span>
      </div>
    );
  }

  const isBinding = status === 'active';

  return (
    <div className="flex flex-col items-center justify-center relative">
      <div className={`relative ${isBinding ? 'animate-seal-pulse' : 'hover:scale-105 transition-transform'}`}>
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          className={`filter transition-all ${
            isBinding
              ? 'drop-shadow-[0_0_25px_rgba(245,158,11,0.8)]'
              : 'drop-shadow-[0_0_15px_rgba(245,158,11,0.4)]'
          }`}
        >
          <defs>
            <radialGradient id="sealGrad" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#FBBF24" />
              <stop offset="60%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#B45309" />
            </radialGradient>
            <filter id="emboss">
              <feDropShadow dx="0.5" dy="1" stdDeviation="0.5" floodColor="#000" floodOpacity="0.4" />
            </filter>
          </defs>

          {/* Outer Scalloped Wax Border */}
          <circle cx="50" cy="50" r="44" fill="url(#sealGrad)" stroke="#78350F" strokeWidth="2" />
          <circle cx="50" cy="50" r="37" fill="none" stroke="#FEF3C7" strokeWidth="1.5" strokeDasharray="3 2" opacity="0.6" />

          {/* Inner Seal Circle */}
          <circle cx="50" cy="50" r="32" fill="#D97706" opacity="0.3" />

          {/* Embossed Cross-Modal Link / Lock Icon */}
          <g filter="url(#emboss)" fill="none" stroke="#78350F" strokeWidth="3" strokeLinecap="round">
            <path d="M40 42 L60 42 L60 62 L40 62 Z" />
            <path d="M44 42 L44 34 C44 30 56 30 56 34 L56 42" />
            <circle cx="50" cy="52" r="2" fill="#78350F" />
          </g>
        </svg>

        {isBinding && (
          <div className="absolute inset-0 rounded-full border-2 border-amber-400 animate-ping opacity-30 pointer-events-none" />
        )}
      </div>

      <span className="mt-2 text-[10px] font-mono font-bold text-amber-400 tracking-wider bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/80">
        {isBinding ? 'WELDING MODALITIES...' : label}
      </span>
    </div>
  );
};
