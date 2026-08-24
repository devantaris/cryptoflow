import React from 'react';
import { ShieldAlert, Check } from 'lucide-react';

interface WaxSealProps {
  status: 'intact' | 'active' | 'broken';
  label?: string;
}

export const WaxSeal: React.FC<WaxSealProps> = ({
  status,
  label = 'SEAL OF INTEGRITY',
}) => {
  if (status === 'broken') {
    return (
      <div className="flex flex-col items-center justify-center relative select-none">
        <div className="w-16 h-16 rounded-full bg-red-50 border-2 border-dashed border-red-600 flex items-center justify-center shadow-xs">
          <ShieldAlert className="w-8 h-8 text-red-600 animate-bounce" />
        </div>
        <div className="mt-2 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-100 border border-red-300 text-[10px] font-mono font-bold text-red-800 uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping" />
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
            ? 'bg-amber-100 border-2 border-amber-600 shadow-md scale-105'
            : 'bg-stone-900 border-2 border-stone-800 text-stone-100 shadow-sm'
        }`}
      >
        {isBinding ? (
          <span className="font-serif font-bold text-lg text-amber-900 animate-pulse">Ω</span>
        ) : (
          <div className="flex flex-col items-center">
            <Check className="w-5 h-5 text-amber-400 stroke-[2.5]" />
            <span className="text-[7px] font-mono tracking-widest text-stone-300 mt-0.5 font-bold">VERIFIED</span>
          </div>
        )}
      </div>

      <div className="mt-2 px-2 py-0.5 rounded bg-stone-100 border border-stone-300 text-[10px] font-mono font-medium text-stone-700">
        {isBinding ? 'WELDING MODALITIES...' : label}
      </div>
    </div>
  );
};
