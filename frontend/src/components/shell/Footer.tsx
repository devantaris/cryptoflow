import React from 'react';
import { ShieldCheck, Cpu, HardDrive, BookOpen } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="fixed bottom-0 left-0 right-0 h-9 bg-[#FAF9F6]/95 backdrop-blur-md z-40 px-6 flex items-center justify-between border-t border-[#E7E5E4] text-[11px] font-serif text-stone-600">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-stone-700 font-sans">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-700" />
          <span>AES-256-GCM AEAD</span>
        </div>
        <span className="text-stone-300">•</span>
        <div className="flex items-center gap-1.5 text-stone-700 font-sans">
          <Cpu className="w-3.5 h-3.5 text-amber-700" />
          <span>HMAC-SHA-256 Binding</span>
        </div>
        <span className="text-stone-300">•</span>
        <div className="flex items-center gap-1.5 text-stone-700 font-sans">
          <HardDrive className="w-3.5 h-3.5 text-emerald-700" />
          <span>.cryptoflow Container v1</span>
        </div>
      </div>

      <div className="flex items-center gap-2 text-stone-500 italic">
        <BookOpen className="w-3.5 h-3.5 text-stone-400" />
        <span>CryptoFlow Research Paper Demonstration Platform</span>
      </div>
    </footer>
  );
};
