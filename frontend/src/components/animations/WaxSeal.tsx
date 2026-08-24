import React from 'react';
import { ShieldCheck, ShieldAlert, Lock } from 'lucide-react';

interface WaxSealProps {
  status: 'intact' | 'active' | 'broken';
  size?: number;
  label?: string;
}

export const WaxSeal: React.FC<WaxSealProps> = ({
  status,
  label = 'HMAC-SHA-256 SEAL',
}) => {
  if (status === 'broken') {
    return (
      <div className="flex flex-col items-center justify-center relative select-none">
        <div className="relative flex items-center justify-center p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 shadow-lg">
          <ShieldAlert className="w-10 h-10 text-rose-400 stroke-[1.8] animate-bounce" />
        </div>
        <div className="mt-2.5 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-[10px] font-mono font-semibold text-rose-300 uppercase tracking-wide">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
          <span>SEAL BROKEN (TAMPER DETECTED)</span>
        </div>
      </div>
    );
  }

  const isBinding = status === 'active';

  return (
    <div className="flex flex-col items-center justify-center relative select-none">
      <div 
        className={`relative flex items-center justify-center p-3 rounded-2xl transition-all duration-300 ${
          isBinding
            ? 'bg-amber-500/15 border border-amber-500/40 shadow-lg scale-105'
            : 'bg-zinc-900 border border-zinc-700/80 shadow-md hover:border-amber-500/40'
        }`}
      >
        {isBinding ? (
          <div className="relative">
            <Lock className="w-8 h-8 text-amber-400 stroke-[2] animate-pulse" />
            <div className="absolute inset-0 rounded-full border border-amber-400/40 animate-ping" />
          </div>
        ) : (
          <ShieldCheck className="w-8 h-8 text-amber-400/90 stroke-[1.8]" />
        )}
      </div>

      <div className="mt-2.5 flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-[10px] font-mono font-medium text-zinc-300">
        <span className={`w-1.5 h-1.5 rounded-full ${isBinding ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
        <span>{isBinding ? 'WELDING MODALITIES...' : label}</span>
      </div>
    </div>
  );
};
