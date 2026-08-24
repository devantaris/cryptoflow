import React from 'react';
import { ShieldCheck, Cpu, HardDrive } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="fixed bottom-0 left-0 right-0 h-9 glass-panel z-40 px-6 flex items-center justify-between border-t border-obsidian-800 text-[11px] font-mono text-slate-400">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-cyan-400">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>AEAD: AES-256-GCM (128-bit Tag)</span>
        </div>
        <span className="text-slate-600">|</span>
        <div className="flex items-center gap-1.5 text-amber-400">
          <Cpu className="w-3.5 h-3.5" />
          <span>Binding: HMAC-SHA-256 (Constant-Time)</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-slate-400">
          <HardDrive className="w-3.5 h-3.5" />
          <span>Format: .cryptoflow Binary Container v1</span>
        </div>
        <span className="text-slate-600">|</span>
        <span>Paper Supplementary Material & Demo Engine</span>
      </div>
    </footer>
  );
};
