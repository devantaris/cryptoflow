import React from 'react';
import { ShieldCheck, Server } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="fixed bottom-0 left-0 right-0 h-10 glass-panel z-40 px-6 flex items-center justify-between border-t border-slate-800 text-[11px] text-slate-400">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 tooltip-trigger">
          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
          <span>Secured by CryptoFlow</span>
          <span className="tooltip-content">Uses AES-256-GCM and HMAC-SHA-256</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 tooltip-trigger">
          <Server className="w-3.5 h-3.5" />
          <span>System Online</span>
          <span className="tooltip-content">Format: .cryptoflow Binary Container v1</span>
        </div>
      </div>
    </footer>
  );
};
