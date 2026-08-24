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
    { id: 'metrics', label: '5. Benchmark Metrics', icon: <BarChart3 className="w-4 h-4" /> },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 h-16 glass-panel z-50 px-6 flex items-center justify-between border-b border-obsidian-700">
      {/* Brand Logo */}
      <div className="flex items-center gap-3 cursor-pointer" onClick={() => onSelectView('encrypt')}>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center shadow-glow-cyan text-black font-bold">
          <Shield className="w-5 h-5 text-obsidian-950 stroke-[2.5]" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-lg text-white tracking-wide">CryptoFlow</span>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
              v1.0-RC
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-mono leading-none">Multimodal Medical Encryption</p>
        </div>
      </div>

      {/* Navigation Pills */}
      <nav className="flex items-center gap-1.5 bg-obsidian-900/90 p-1.5 rounded-xl border border-obsidian-800">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectView(item.id)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 shadow-glow-cyan'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-obsidian-800/60'
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
              ? 'bg-crimson-950/80 text-crimson-400 border-crimson-600 animate-alarm-pulse shadow-glow-crimson'
              : systemStatus === 'processing'
              ? 'bg-amber-950/80 text-amber-400 border-amber-600'
              : 'bg-emerald-950/80 text-emerald-400 border-emerald-700/60 shadow-glow-emerald'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${
            systemStatus === 'tamper_detected' ? 'bg-crimson-400 animate-ping' : systemStatus === 'processing' ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'
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
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
          <Activity className={`w-3.5 h-3.5 ${wsConnected ? 'text-emerald-400' : 'text-slate-500'}`} />
        </div>
      </div>
    </header>
  );
};
