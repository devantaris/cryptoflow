import React from 'react';
import { Shield, Lock, Eye, Zap, BarChart3, Activity } from 'lucide-react';
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
  const navItems: Array<{ id: ViewType; label: string; number: string; icon: React.ReactNode }> = [
    { id: 'encrypt', label: 'Studio', number: '01', icon: <Lock className="w-3.5 h-3.5" /> },
    { id: 'pipeline', label: 'Pipeline', number: '02', icon: <Zap className="w-3.5 h-3.5" /> },
    { id: 'decrypt', label: 'Verify & Decrypt', number: '03', icon: <Eye className="w-3.5 h-3.5" /> },
    { id: 'sandbox', label: 'Threat Sandbox', number: '04', icon: <Shield className="w-3.5 h-3.5" /> },
    { id: 'metrics', label: 'Benchmarks', number: '05', icon: <BarChart3 className="w-3.5 h-3.5" /> },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-zinc-950/80 backdrop-blur-xl z-50 px-5 flex items-center justify-between border-b border-zinc-800/80">
      {/* Brand Logo */}
      <div 
        className="flex items-center gap-2.5 cursor-pointer select-none group" 
        onClick={() => onSelectView('encrypt')}
      >
        <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-700/80 flex items-center justify-center text-zinc-200 group-hover:border-zinc-500 transition-colors shadow-sm">
          <Shield className="w-3.5 h-3.5 text-zinc-100 stroke-[2.2]" />
        </div>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm text-zinc-100 tracking-tight">CryptoFlow</span>
          <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded-md bg-zinc-900 text-zinc-400 border border-zinc-800">
            v1.0
          </span>
        </div>
      </div>

      {/* Segmented Control Navigation */}
      <nav className="flex items-center gap-1 bg-zinc-900/90 p-1 rounded-lg border border-zinc-800/80 shadow-inner">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectView(item.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150 cursor-pointer ${
                isActive
                  ? 'bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700/60 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
              }`}
            >
              <span className={`text-[10px] font-mono ${isActive ? 'text-zinc-300' : 'text-zinc-500'}`}>
                {item.number}
              </span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Security Status Badge & Engine Status */}
      <div className="flex items-center gap-2.5">
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-medium transition-all ${
            systemStatus === 'tamper_detected'
              ? 'badge-danger animate-pulse'
              : systemStatus === 'processing'
              ? 'badge-warning'
              : 'badge-success'
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${
            systemStatus === 'tamper_detected' 
              ? 'bg-rose-400 animate-ping' 
              : systemStatus === 'processing' 
              ? 'bg-amber-400 animate-pulse' 
              : 'bg-emerald-400'
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
          className="flex items-center gap-1 text-[11px] font-mono text-zinc-500 pl-1 border-l border-zinc-800"
          title={wsConnected ? 'Backend Engine Connected' : 'Connecting to Engine...'}
        >
          <Activity className={`w-3.5 h-3.5 ${wsConnected ? 'text-emerald-500' : 'text-zinc-600'}`} />
        </div>
      </div>
    </header>
  );
};
