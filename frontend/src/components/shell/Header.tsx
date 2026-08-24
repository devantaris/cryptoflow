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
  const navItems: Array<{ id: ViewType; label: string; icon: React.ReactNode }> = [
    { id: 'encrypt', label: '1. Encryption Studio', icon: <Lock className="w-4 h-4" /> },
    { id: 'pipeline', label: '2. 5-Stage Visualizer', icon: <Zap className="w-4 h-4" /> },
    { id: 'decrypt', label: '3. Decrypt & Verify', icon: <Eye className="w-4 h-4" /> },
    { id: 'sandbox', label: '4. Attack Sandbox', icon: <Shield className="w-4 h-4" /> },
    { id: 'metrics', label: '5. Metrics', icon: <BarChart3 className="w-4 h-4" /> },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 h-16 glass-panel z-50 px-6 flex items-center justify-between border-b border-slate-800 bg-slate-950/80">
      {/* Brand Logo */}
      <div className="flex items-center gap-3 cursor-pointer" onClick={() => onSelectView('encrypt')}>
        <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-cyan-400 border border-slate-700">
          <Shield className="w-5 h-5 stroke-[2.5]" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-lg text-white tracking-wide">CryptoFlow</span>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
              v1.0
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-mono leading-none">Medical Encryption</p>
        </div>
      </div>

      {/* Navigation Pills */}
      <nav className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-xl border border-slate-800">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectView(item.id)}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Security Status Badge */}
      <div className="flex items-center gap-3">
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono border transition-all ${
            systemStatus === 'tamper_detected'
              ? 'bg-red-950/80 text-red-400 border-red-900 animate-alarm-pulse'
              : systemStatus === 'processing'
              ? 'bg-amber-950/80 text-amber-400 border-amber-900'
              : 'bg-emerald-950/80 text-emerald-400 border-emerald-900'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${
            systemStatus === 'tamper_detected' ? 'bg-red-400 animate-ping' : systemStatus === 'processing' ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'
          }`} />
          <span>
            {systemStatus === 'tamper_detected'
              ? 'TAMPER DETECTED'
              : systemStatus === 'processing'
              ? 'PIPELINE RUNNING'
              : 'SYSTEM SECURE'}
          </span>
        </div>

        {/* Backend connectivity indicator */}
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400 tooltip-trigger">
          <Activity className={`w-3.5 h-3.5 ${wsConnected ? 'text-emerald-400' : 'text-slate-500'}`} />
          <span className="tooltip-content">{wsConnected ? 'Backend Connected' : 'Disconnected'}</span>
        </div>
      </div>
    </header>
  );
};
