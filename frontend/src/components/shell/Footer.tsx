import React from 'react';
import { ShieldCheck, Cpu, HardDrive } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="fixed bottom-0 left-0 right-0 h-8 bg-zinc-950/80 backdrop-blur-md z-40 px-5 flex items-center justify-between border-t border-zinc-800/80 text-[11px] font-mono text-zinc-500">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-zinc-400">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
          <span>AES-256-GCM (128-bit Tag)</span>
        </div>
        <span className="text-zinc-700">•</span>
        <div className="flex items-center gap-1.5 text-zinc-400">
          <Cpu className="w-3.5 h-3.5 text-amber-400" />
          <span>HMAC-SHA-256 Constant-Time Binding</span>
        </div>
        <span className="text-zinc-700">•</span>
        <div className="flex items-center gap-1.5 text-zinc-400">
          <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
          <span>.cryptoflow Binary Container v1</span>
        </div>
      </div>

      <div className="flex items-center gap-3 text-zinc-500">
        <span>Research Demonstration & Benchmarking Engine</span>
      </div>
    </footer>
  );
};
