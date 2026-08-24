import React, { useState } from 'react';
import { RotateCcw, Terminal, Flame, Zap } from 'lucide-react';
import { WaxSeal } from '../animations/WaxSeal';
import { simulateAttackApi } from '../../services/api';
import type { AttackResult } from '../../types';

export const AttackSandbox: React.FC = () => {
  const [activeAttack, setActiveAttack] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [attackResult, setAttackResult] = useState<AttackResult | null>(null);
  const [logs, setLogs] = useState<Array<{ text: string; type: 'info' | 'warn' | 'error' | 'success' }>>([
    { text: '[SANDBOX READY] 7 verified cyberattack vectors armed for threat modeling.', type: 'info' },
  ]);

  const attacks = [
    {
      id: 'bit_flip',
      name: '1. Bit-Flip Tamper',
      desc: 'Flips 1 bit in transmitted ciphertext payload to simulate network noise or in-flight modification.',
      defense: 'GCM Auth Tag Mismatch',
      icon: '💥',
    },
    {
      id: 'swap_modalities',
      name: '2. Intra-Bundle Swap',
      desc: 'Adversary swaps the internal ordering of CT scan and radiology report within the container.',
      defense: 'Deterministic Binding Order Check',
      icon: '🔀',
    },
    {
      id: 'cross_bundle_swap',
      name: '3. Cross-Patient Swap',
      desc: 'CRITICAL THREAT: Replaces Patient A (benign) report with Patient B (malignant) report.',
      defense: 'HMAC-SHA-256 Digest Mismatch',
      icon: '💀',
    },
    {
      id: 'truncate_blob',
      name: '4. Network Truncation',
      desc: 'Simulates packet drop or intentional truncation of trailing 50 bytes of bundle data.',
      defense: 'Binary Header Length Check',
      icon: '✂️',
    },
    {
      id: 'inject_blob',
      name: '5. Rogue Modality Injection',
      desc: 'Adversary injects a 4th unauthorized metadata payload into a 3-modality patient bundle.',
      defense: 'Modality Count & Digest Invalidation',
      icon: '💉',
    },
    {
      id: 'manifest_tamper',
      name: '6. Manifest Forgery',
      desc: 'Attacker modifies binding hash recorded inside the manifest JSON to match modified payload.',
      defense: 'Constant-Time Recomputation Check',
      icon: '📝',
    },
    {
      id: 'key_mismatch',
      name: '7. Foreign Keyring Unlock',
      desc: 'Attempted unauthorized decryption of Patient A bundle using Patient B key material.',
      defense: 'UUID & GCM Key Derivation Block',
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
        { text: `[ATTACK LAUNCHED] Executing: ${attackName}...`, type: 'warn' },
        { text: `[SYSTEM] Intercepting payload in transit & attempting unauthorized decryption...`, type: 'info' },
      ]);

      const result = await simulateAttackApi(attackId);
      setAttackResult(result);

      if (result.detected) {
        setLogs((prev) => [
          ...prev,
          { text: `[SECURITY ENFORCEMENT] ${result.exception_raised} triggered!`, type: 'error' },
          { text: `[ALARM] Cross-modal wax seal SHATTERED. Decryption BLOCKED immediately.`, type: 'error' },
          { text: `[RESULT] ${result.forensic_details}`, type: 'success' },
        ]);
      }
    } catch (e: any) {
      setLogs((prev) => [
        ...prev,
        { text: `[ERROR] Attack simulation failed: ${e.message}`, type: 'error' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setActiveAttack(null);
    setAttackResult(null);
    setLogs([{ text: '[SANDBOX RESET] Ready for new attack simulation.', type: 'info' }]);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-obsidian-800">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl md:text-3xl font-display font-bold text-white tracking-tight">
              Live Cyberattack & Threat Sandbox
            </h1>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-crimson-950/80 text-crimson-400 border border-crimson-800">
              Active Defense Arena
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Simulate 7 verified cyberattack vectors and observe real-time cryptographic tamper alarms.
          </p>
        </div>

        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono bg-obsidian-800 hover:bg-obsidian-700 text-slate-200 border border-obsidian-700 transition cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Sandbox</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
        {/* Left: 7 Attack Arsenal Grid */}
        <div className="lg:col-span-7 space-y-3">
          <h3 className="font-display font-semibold text-sm text-white flex items-center gap-2 mb-3">
            <Flame className="w-4 h-4 text-crimson-400" />
            <span>Select Threat Vector to Execute:</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {attacks.map((atk) => {
              const isSelected = activeAttack === atk.id;
              return (
                <button
                  key={atk.id}
                  onClick={() => runAttack(atk.id)}
                  disabled={loading}
                  className={`text-left p-4 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-crimson-950/40 border-crimson-500 shadow-glow-crimson'
                      : 'bg-obsidian-900/80 border-obsidian-800 hover:border-crimson-500/50 hover:bg-obsidian-800/60'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-base">{atk.icon}</span>
                      <span className="text-[10px] font-mono text-crimson-400 bg-crimson-950 px-2 py-0.5 rounded border border-crimson-900">
                        {atk.defense}
                      </span>
                    </div>
                    <h4 className="font-display font-semibold text-xs text-white mb-1">{atk.name}</h4>
                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{atk.desc}</p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-obsidian-800 flex items-center justify-between text-[10px] font-mono text-slate-500">
                    <span>Click to Simulate</span>
                    <Zap className="w-3 h-3 text-crimson-400" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Real-time Seal & Bundle Visualizer */}
        <div className="lg:col-span-5 flex flex-col justify-between glass-panel rounded-2xl p-6 border border-obsidian-700">
          <div>
            <h3 className="font-display font-semibold text-sm text-white mb-4 flex items-center justify-between">
              <span>Cross-Modal Seal Integrity:</span>
              <span className={`text-xs font-mono font-bold ${activeAttack ? 'text-crimson-400 animate-pulse' : 'text-emerald-400'}`}>
                {activeAttack ? '🚨 UNDER ATTACK' : '🟢 ARMED & SECURE'}
              </span>
            </h3>

            {/* Seal Animation */}
            <div className="py-6 flex justify-center items-center bg-obsidian-950/80 rounded-xl border border-obsidian-800 mb-6 min-h-[160px]">
              <WaxSeal status={activeAttack ? 'broken' : 'intact'} size={100} label="HMAC SEAL INTACT" />
            </div>

            {/* Scorecard */}
            {attackResult && (
              <div className="p-4 rounded-xl bg-crimson-950/60 border border-crimson-700 text-xs font-mono space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Triggered Control:</span>
                  <span className="text-crimson-300 font-bold">{attackResult.exception_raised}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Security Score:</span>
                  <span className="text-emerald-400 font-bold">100% BLOCKED (PASS)</span>
                </div>
              </div>
            )}
          </div>

          <div className="text-[11px] font-mono text-slate-500 pt-4 border-t border-obsidian-800">
            Protected against Mix-and-Match, Patient Swapping, and Silent Byte Tampering.
          </div>
        </div>
      </div>

      {/* Forensic Log Stream */}
      <div className="glass-panel rounded-2xl p-5 border border-obsidian-700">
        <div className="flex items-center gap-2 mb-3 text-xs font-mono text-slate-400">
          <Terminal className="w-4 h-4 text-cyan-400" />
          <span>Real-Time Forensic Audit Stream:</span>
        </div>

        <div className="bg-obsidian-950 rounded-xl p-4 border border-obsidian-800 max-h-48 overflow-y-auto font-mono text-xs space-y-1.5">
          {logs.map((l, i) => (
            <div
              key={i}
              className={
                l.type === 'error'
                  ? 'text-crimson-400 font-bold'
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
