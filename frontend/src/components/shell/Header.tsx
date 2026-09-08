import React from 'react';
import { Lock, Eye, Zap, BarChart3, BookOpen, Activity } from 'lucide-react';
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
    { id: 'landing', label: 'Overview', numeral: '0', icon: <BookOpen className="w-3.5 h-3.5" /> },
    { id: 'encrypt', label: 'Ingest Studio', numeral: 'I', icon: <Lock className="w-3.5 h-3.5" /> },
    { id: 'pipeline', label: '6-Stage Pipeline', numeral: 'II', icon: <Zap className="w-3.5 h-3.5" /> },
    { id: 'decrypt', label: 'Verify & Decrypt', numeral: 'III', icon: <Eye className="w-3.5 h-3.5" /> },
    { id: 'sandbox', label: 'Threat Matrix', numeral: 'IV', icon: <Zap className="w-3.5 h-3.5" /> },
    { id: 'metrics', label: 'Benchmarks', numeral: 'V', icon: <BarChart3 className="w-3.5 h-3.5" /> },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-[#09090b]/85 backdrop-blur-xl z-50 px-6 flex items-center justify-between border-b border-white/[0.08] shadow-2xl">
      {/* Brand Logo */}
      <div 
        className="flex items-center gap-3 cursor-pointer select-none group" 
        onClick={() => onSelectView('landing')}
      >
        <div className="w-8 h-8 rounded-lg bg-linear-to-br from-cyan-500 to-blue-600 text-white flex items-center justify-center font-mono font-bold text-sm shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition">
          Ψ
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-base text-white tracking-tight group-hover:text-cyan-400 transition">
              CryptoFlow
            </span>
            <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
              v1.0
            </span>
          </div>
          <p className="text-[10px] text-zinc-400 font-mono -mt-0.5">
            Cross-Modal Integrity Platform
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav className="hidden md:flex items-center gap-1 bg-zinc-900/90 p-1 rounded-xl border border-white/[0.07] backdrop-blur-md">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectView(item.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all duration-150 cursor-pointer font-medium ${
                isActive
                  ? 'bg-zinc-800 text-white shadow-sm border border-white/10'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`}
            >
              <span className={`text-[10px] font-mono ${isActive ? 'text-cyan-400' : 'text-zinc-500'}`}>
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
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium transition-all ${
            systemStatus === 'tamper_detected'
              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              : systemStatus === 'processing'
              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${
            systemStatus === 'tamper_detected' 
              ? 'bg-rose-500 animate-ping' 
              : systemStatus === 'processing' 
              ? 'bg-amber-500 animate-pulse' 
              : 'bg-emerald-500'
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
          className="flex items-center gap-1 text-[11px] font-mono text-zinc-500 pl-2 border-l border-zinc-800"
          title={wsConnected ? 'Backend Engine Connected' : 'Standalone Simulation Mode'}
        >
          <Activity className={`w-3.5 h-3.5 ${wsConnected ? 'text-emerald-400' : 'text-zinc-500'}`} />
        </div>
      </div>
    </header>
  );
};
