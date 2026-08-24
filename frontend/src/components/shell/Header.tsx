import React from 'react';
import { Lock, Eye, Zap, BarChart3, Activity } from 'lucide-react';
import type { ViewType } from '../../types';

interface HeaderProps {
  currentView: ViewType;
  onSelectView: (view: ViewType) => void;
  systemStatus: 'secure' | 'tamper_detected' | 'processing';
  wsConnected: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onSelectView,
  systemStatus,
  wsConnected,
}) => {
  const navItems: Array<{ id: ViewType; label: string; numeral: string; icon: React.ReactNode }> = [
    { id: 'encrypt', label: 'Ingest Studio', numeral: 'I', icon: <Lock className="w-3.5 h-3.5" /> },
    { id: 'pipeline', label: '5-Stage Pipeline', numeral: 'II', icon: <Zap className="w-3.5 h-3.5" /> },
    { id: 'decrypt', label: 'Verify & Decrypt', numeral: 'III', icon: <Eye className="w-3.5 h-3.5" /> },
    { id: 'sandbox', label: 'Threat Matrix', numeral: 'IV', icon: <Zap className="w-3.5 h-3.5" /> },
    { id: 'metrics', label: 'Benchmarks', numeral: 'V', icon: <BarChart3 className="w-3.5 h-3.5" /> },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-[#FAF9F6]/95 backdrop-blur-md z-50 px-6 flex items-center justify-between border-b border-[#E7E5E4] shadow-xs">
      {/* Editorial Masthead Logo */}
      <div 
        className="flex items-center gap-3 cursor-pointer select-none group" 
        onClick={() => onSelectView('encrypt')}
      >
        <div className="w-8 h-8 rounded-md bg-[#1C1917] text-[#FAF9F6] flex items-center justify-center font-serif font-bold text-base shadow-sm">
          Ψ
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-lg text-[#1C1917] tracking-tight group-hover:text-stone-700 transition">
              CryptoFlow
            </span>
            <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 border border-stone-200">
              VOL. 1 • 2026
            </span>
          </div>
          <p className="text-[10px] text-stone-500 font-serif italic -mt-0.5">
            Journal of Multimodal Medical Cryptography
          </p>
        </div>
      </div>

      {/* Editorial Navigation Tabs */}
      <nav className="flex items-center gap-1 bg-[#F5F4F0] p-1 rounded-lg border border-[#E7E5E4]">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectView(item.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-all duration-150 cursor-pointer font-sans ${
                isActive
                  ? 'bg-white text-[#1C1917] shadow-xs border border-stone-300/80 font-semibold'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
              }`}
            >
              <span className={`text-[10px] font-serif font-bold ${isActive ? 'text-stone-900' : 'text-stone-400'}`}>
                {item.numeral}.
              </span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Security Status & Connectivity */}
      <div className="flex items-center gap-3">
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-medium transition-all ${
            systemStatus === 'tamper_detected'
              ? 'badge-crimson'
              : systemStatus === 'processing'
              ? 'badge-amber'
              : 'badge-emerald'
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${
            systemStatus === 'tamper_detected' 
              ? 'bg-red-600 animate-ping' 
              : systemStatus === 'processing' 
              ? 'bg-amber-600 animate-pulse' 
              : 'bg-emerald-600'
          }`} />
          <span>
            {systemStatus === 'tamper_detected'
              ? 'TAMPER DETECTED'
              : systemStatus === 'processing'
              ? 'PIPELINE ACTIVE'
              : 'AEAD SECURED'}
          </span>
        </div>

        <div 
          className="flex items-center gap-1 text-[11px] font-mono text-stone-400 pl-2 border-l border-stone-200"
          title={wsConnected ? 'Backend Engine Connected' : 'Connecting to Engine...'}
        >
          <Activity className={`w-3.5 h-3.5 ${wsConnected ? 'text-emerald-600' : 'text-stone-400'}`} />
        </div>
      </div>
    </header>
  );
};
