import React from 'react';
import { ShieldAlert, Check } from 'lucide-react';

interface WaxSealProps {
  status: 'intact' | 'active' | 'broken';
  label?: string;
  size?: number;
}

export const WaxSeal: React.FC<WaxSealProps> = ({
  status,
  label = 'SEAL OF INTEGRITY',
}) => {
  if (status === 'broken') {
    return (
      <div className="flex flex-col items-center justify-center relative select-none">
        <div className="w-16 h-16 rounded-full bg-rose-500/10 border-2 border-dashed border-rose-500 flex items-center justify-center shadow-lg shadow-rose-500/20">
          <ShieldAlert className="w-8 h-8 text-rose-400 animate-bounce" />
        </div>
        <div className="mt-2.5 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-[10px] font-mono font-bold text-rose-400 uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
          <span>SEAL BROKEN (TAMPER VOID)</span>
        </div>
      </div>
    );
  }

  const isBinding = status === 'active';

  return (
    <div className="flex flex-col items-center justify-center relative select-none">
      <div 
        className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
          isBinding
            ? 'bg-amber-500/20 border-2 border-amber-400 shadow-lg shadow-amber-500/20 scale-105'
            : 'bg-zinc-900 border-2 border-cyan-500/40 text-cyan-300 shadow-lg shadow-cyan-500/10'
        }`}
      >
        {isBinding ? (
          <span className="font-mono font-bold text-lg text-amber-300 animate-pulse">Ω</span>
        ) : (
          <div className="flex flex-col items-center">
            <Check className="w-5 h-5 text-cyan-400 stroke-[2.5]" />
            <span className="text-[7px] font-mono tracking-widest text-cyan-300 mt-0.5 font-bold">VERIFIED</span>
          </div>
        )}
      </div>

      <div className="mt-2.5 px-2.5 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-[10px] font-mono font-medium text-zinc-400">
        {isBinding ? 'WELDING MODALITIES...' : label}
      </div>
    </div>
  );
};
