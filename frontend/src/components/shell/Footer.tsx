import React from 'react';
import { ShieldCheck, Cpu, HardDrive, Terminal } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="fixed bottom-0 left-0 right-0 h-9 bg-[#09090b]/90 backdrop-blur-md z-40 px-6 flex items-center justify-between border-t border-white/[0.08] text-[11px] font-mono text-zinc-400">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-zinc-300">
          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
          <span>AES-256-GCM AEAD</span>
        </div>
        <span className="text-zinc-600">•</span>
        <div className="flex items-center gap-1.5 text-zinc-300">
          <Cpu className="w-3.5 h-3.5 text-amber-400" />
          <span>HMAC-SHA-256 Binding</span>
        </div>
        <span className="text-zinc-600">•</span>
        <div className="flex items-center gap-1.5 text-zinc-300">
          <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
          <span>.cryptoflow Binary Container v1</span>
        </div>
      </div>

      <div className="hidden sm:flex items-center gap-2 text-zinc-400">
        <Terminal className="w-3.5 h-3.5 text-zinc-400" />
        <span>Kaggle NIH & RSNA Clinical Data Validated</span>
      </div>
    </footer>
  );
};
