import React, { useState } from 'react';
import { RotateCcw, Terminal, AlertTriangle, CheckCircle } from 'lucide-react';
import { WaxSeal } from '../animations/WaxSeal';
import { simulateAttackApi } from '../../services/api';
import type { AttackResult } from '../../types';

export const AttackSandbox: React.FC = () => {
  const [activeAttack, setActiveAttack] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [attackResult, setAttackResult] = useState<AttackResult | null>(null);
  const [logs, setLogs] = useState<Array<{ text: string; type: 'info' | 'warn' | 'error' | 'success' }>>([
    { text: 'System ready. Select a tampering method to test our defenses.', type: 'info' },
  ]);

  const attacks = [
    {
      id: 'bit_flip',
      name: '1. Small Data Change (Bit-Flip)',
      desc: 'Changes a single letter in the file to simulate network errors or quiet tampering.',
      defense: 'GCM Auth Tag Mismatch',
      icon: '💥',
    },
    {
      id: 'swap_modalities',
      name: '2. Rearrange Parts',
      desc: 'Swaps the order of the Image and Report inside the package.',
      defense: 'Deterministic Binding Order Check',
      icon: '🔀',
    },
    {
      id: 'cross_bundle_swap',
      name: '3. Swap Patients',
      desc: 'Tries to sneak Patient B\'s report into Patient A\'s file.',
      defense: 'HMAC-SHA-256 Digest Mismatch',
      icon: '💀',
    },
    {
      id: 'truncate_blob',
      name: '4. Cut Off Data',
      desc: 'Deletes the end of the file to see if the system notices missing data.',
      defense: 'Binary Header Length Check',
      icon: '✂️',
    },
    {
      id: 'inject_blob',
      name: '5. Add Fake Data',
      desc: 'Sneaks extra unapproved data into the bundle.',
      defense: 'Modality Count Invalidation',
      icon: '💉',
    },
    {
      id: 'manifest_tamper',
      name: '6. Forge Records',
      desc: 'Changes the internal checklist to match the tampered data.',
      defense: 'Constant-Time Check',
      icon: '📝',
    },
    {
      id: 'key_mismatch',
      name: '7. Wrong Key',
      desc: 'Tries to open Patient A\'s file with Patient B\'s key.',
      defense: 'Key Derivation Block',
      icon: '🗝️',
    },
  ];

  const runAttack = async (attackId: string) => {
    try {
      setLoading(true);
      setActiveAttack(attackId);
      const attackName = attacks.find((a) => a.id === attackId)?.name || attackId;

      setLogs((prev) => [
        ...prev,
        { text: `Executing: ${attackName}...`, type: 'warn' },
      ]);

      const result = await simulateAttackApi(attackId);
      setAttackResult(result);

      if (result.detected) {
        setLogs((prev) => [
          ...prev,
          { text: `BLOCKED! Reason: ${result.exception_raised}`, type: 'error' },
          { text: `Seal broken. Access denied.`, type: 'error' },
          { text: `Details: ${result.forensic_details}`, type: 'success' },
        ]);
      }
    } catch (e: any) {
      setLogs((prev) => [
        ...prev,
        { text: `Error running simulation: ${e.message}`, type: 'error' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setActiveAttack(null);
    setAttackResult(null);
    setLogs([{ text: 'Sandbox reset. Ready for testing.', type: 'info' }]);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Prominent Educational Demo Banner */}
      <div className="mb-8 p-4 rounded-xl bg-amber-950/40 border border-amber-500/50 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
        <div>
          <h2 className="text-amber-300 font-medium mb-1">Educational Demo: All attacks are blocked.</h2>
          <p className="text-amber-500/80 text-sm">
            This page shows why encryption matters. Click any of the attacks below to see how our security seal detects and blocks unauthorized changes.
          </p>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-white tracking-tight">
            Threat Sandbox
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Test how the system reacts to tampering.
          </p>
        </div>

        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reset Sandbox</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
        {/* Left: 7 Attack Arsenal Grid */}
        <div className="lg:col-span-7 space-y-4">
          <h3 className="font-semibold text-base text-white flex items-center gap-2">
            <span>Select an attack to try:</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {attacks.map((atk) => {
              const isSelected = activeAttack === atk.id;
              return (
                <button
                  key={atk.id}
                  onClick={() => runAttack(atk.id)}
                  disabled={loading}
                  className={`text-left p-4 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-red-950/40 border-red-500 shadow-sm'
                      : 'bg-slate-900 border-slate-700 hover:border-red-400 hover:bg-slate-800'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">{atk.icon}</span>
                      <h4 className="font-semibold text-sm text-white">{atk.name}</h4>
                    </div>
                    <p className="text-xs text-slate-400 mb-3">{atk.desc}</p>
                    <div className="text-[10px] font-mono text-slate-500 tooltip-trigger w-fit">
                      Defense: {atk.defense}
                      <span className="tooltip-content">Technical security mechanism</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Real-time Seal & Bundle Visualizer */}
        <div className="lg:col-span-5 flex flex-col justify-between glass-panel bg-slate-900 rounded-2xl p-6 border border-slate-700">
          <div>
            <h3 className="font-semibold text-base text-white mb-6 flex items-center justify-between">
              <span>System Status:</span>
              <span className={`text-sm font-bold ${activeAttack ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`}>
                {activeAttack ? '🚨 TAMPER DETECTED' : '🟢 SECURE'}
              </span>
            </h3>

            {/* Seal Animation */}
            <div className="py-8 flex justify-center items-center bg-slate-950 rounded-xl border border-slate-800 mb-6 min-h-[200px]">
              <WaxSeal status={activeAttack ? 'broken' : 'intact'} size={120} label="SECURITY SEAL" />
            </div>

            {/* Scorecard */}
            {attackResult && (
              <div className="p-4 rounded-xl bg-red-950/30 border border-red-900/50 space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">Result:</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1"><CheckCircle className="w-4 h-4"/> BLOCKED</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">Trigger:</span>
                  <span className="text-red-300 font-mono text-xs">{attackResult.exception_raised}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Forensic Log Stream */}
      <div className="glass-panel bg-slate-900 rounded-2xl p-5 border border-slate-700">
        <div className="flex items-center gap-2 mb-3 text-sm text-slate-300">
          <Terminal className="w-4 h-4" />
          <span>System Activity Log:</span>
        </div>

        <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 max-h-48 overflow-y-auto font-mono text-sm space-y-2">
          {logs.map((l, i) => (
            <div
              key={i}
              className={
                l.type === 'error'
                  ? 'text-red-400 font-bold'
                  : l.type === 'warn'
                  ? 'text-amber-400'
                  : l.type === 'success'
                  ? 'text-emerald-400'
                  : 'text-slate-400'
              }
            >
              {l.text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
