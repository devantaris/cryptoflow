import React, { useState } from 'react';
import { RotateCcw, Terminal, Zap, CheckCircle2 } from 'lucide-react';
import { WaxSeal } from '../animations/WaxSeal';
import { simulateAttackApi } from '../../services/api';
import type { AttackResult } from '../../types';

export const AttackSandbox: React.FC = () => {
  const [activeAttack, setActiveAttack] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [attackResult, setAttackResult] = useState<AttackResult | null>(null);
  const [logs, setLogs] = useState<Array<{ text: string; type: 'info' | 'warn' | 'error' | 'success' }>>([
    { text: '[AUDIT READY] 7 formal threat models loaded. Ready for in-flight tamper simulation.', type: 'info' },
  ]);

  const attacks = [
    {
      id: 'bit_flip',
      name: '01. In-Flight Bit Flip',
      desc: 'Alters 1 bit within encrypted ciphertext to simulate transmission corruption or MITM modification.',
      defense: 'GCM Auth Tag Mismatch',
      code: 'AUTH_TAG_MISMATCH',
    },
    {
      id: 'swap_modalities',
      name: '02. Modality Order Swap',
      desc: 'Adversary transposes container payload positions between the CT scan and clinical report.',
      defense: 'Deterministic Order Verification',
      code: 'ORDER_CORRUPTED',
    },
    {
      id: 'cross_bundle_swap',
      name: '03. Cross-Patient Substitution',
      desc: 'CRITICAL THREAT: Attacker splices Patient B malignant report into Patient A benign container.',
      defense: 'HMAC Cross-Modal Digest Fail',
      code: 'BINDING_MISMATCH',
    },
    {
      id: 'truncate_blob',
      name: '04. Network Truncation',
      desc: 'Simulates premature connection drop or deliberate byte cutoff on container trailing bytes.',
      defense: 'Binary Header Boundary Check',
      code: 'HEADER_OVERRUN',
    },
    {
      id: 'inject_blob',
      name: '05. Rogue Modality Injection',
      desc: 'Injects an unauthorized 4th payload into an authentic 3-modality patient record container.',
      defense: 'Modality Count & Digest Invalidation',
      code: 'EXTRA_MODALITY',
    },
    {
      id: 'manifest_tamper',
      name: '06. Manifest Metadata Forgery',
      desc: 'Tampering manifest JSON descriptors to trick parser while attempting to bypass AEAD.',
      defense: 'Digest Invariant Recalculation',
      code: 'MANIFEST_CORRUPT',
    },
    {
      id: 'key_mismatch',
      name: '07. Foreign Keyring Unlock',
      desc: 'Unauthorized decryption attempt using key material from an unrelated patient or session.',
      defense: 'UUID & GCM Key Derivation Block',
      code: 'KEY_MISMATCH',
    },
  ];

  const runAttack = async (attackId: string) => {
    try {
      setLoading(true);
      setActiveAttack(attackId);
      const attackName = attacks.find((a) => a.id === attackId)?.name || attackId;

      setLogs((prev) => [
        ...prev,
        { text: `[THREAT INJECTED] Executing: ${attackName}...`, type: 'warn' },
        { text: `[PIPELINE] Intercepting payload in transit & attempting unauthorized decryption...`, type: 'info' },
      ]);

      const result = await simulateAttackApi(attackId);
      setAttackResult(result);

      if (result.detected) {
        setLogs((prev) => [
          ...prev,
          { text: `[DEFENSE ENFORCED] ${result.exception_raised} triggered immediately.`, type: 'error' },
          { text: `[CONTAINER SEALED] Cross-modal integrity seal broken. Decryption halted.`, type: 'error' },
          { text: `[AUDIT PASS] ${result.forensic_details}`, type: 'success' },
        ]);
      }
    } catch (e: any) {
      setLogs((prev) => [
        ...prev,
        { text: `[ERROR] Simulation execution failed: ${e.message}`, type: 'error' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setActiveAttack(null);
    setAttackResult(null);
    setLogs([{ text: '[AUDIT RESET] Threat simulation cleared. Cryptographic invariants intact.', type: 'info' }]);
  };

  return (
    <div className="max-w-6xl mx-auto py-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-7 pb-5 border-b border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
              Stage 04 Threat Modeling
            </span>
            <span className="text-zinc-500 text-xs">•</span>
            <span className="text-zinc-400 text-xs font-mono">Formal Security Boundary Analysis</span>
          </div>
          <h1 className="text-xl md:text-2xl font-semibold text-zinc-100 tracking-tight">
            Cyberattack & Threat Simulation Sandbox
          </h1>
          <p className="text-xs md:text-sm text-zinc-400 mt-1 max-w-2xl leading-relaxed">
            Simulate active adversaries attempting in-flight payload manipulation, splicing, and key attacks.
          </p>
        </div>

        <button
          onClick={handleReset}
          className="btn-secondary px-3.5 py-2 text-xs font-medium flex items-center gap-1.5 cursor-pointer self-start md:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Threat Sandbox</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-6">
        {/* Left: 7 Attack Arsenal Grid */}
        <div className="lg:col-span-7 space-y-2.5">
          <div className="text-xs font-mono font-medium text-zinc-400 uppercase tracking-wider mb-2">
            Select Adversary Threat Vector:
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {attacks.map((atk) => {
              const isSelected = activeAttack === atk.id;
              return (
                <button
                  key={atk.id}
                  onClick={() => runAttack(atk.id)}
                  disabled={loading}
                  className={`text-left p-3.5 rounded-xl border transition-all duration-150 cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-rose-500/10 border-rose-500/40 shadow-sm'
                      : 'surface-card surface-card-hover border-zinc-800'
                  }`}
                >
                  <div className="pr-4">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-xs text-zinc-200">{atk.name}</h4>
                      <span className="badge-neutral text-[10px] font-mono px-1.5 py-0.5 rounded">
                        {atk.code}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-relaxed line-clamp-1">{atk.desc}</p>
                  </div>

                  <div className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-zinc-400">
                    <Zap className="w-3 h-3 text-rose-400" />
                    <span>Simulate</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Real-time Seal Status & Audit Panel */}
        <div className="lg:col-span-5 flex flex-col justify-between surface-card rounded-xl p-5">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="font-mono text-xs font-medium text-zinc-300 uppercase tracking-wider">
                Invariant Integrity Status:
              </span>
              <span className={`text-xs font-mono font-semibold ${activeAttack ? 'text-rose-400' : 'text-emerald-400'}`}>
                {activeAttack ? 'UNDER THREAT' : 'ARMED & SECURE'}
              </span>
            </div>

            {/* Seal Display */}
            <div className="py-6 flex justify-center items-center bg-zinc-950/80 rounded-xl border border-zinc-800 mb-5 min-h-[150px]">
              <WaxSeal status={activeAttack ? 'broken' : 'intact'} size={80} label="SEAL INTACT" />
            </div>

            {/* Scorecard */}
            {attackResult && (
              <div className="p-3.5 rounded-lg bg-zinc-950/80 border border-zinc-800 text-xs font-mono space-y-1.5 mb-3">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Security Control:</span>
                  <span className="text-rose-300 font-semibold">{attackResult.exception_raised}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Adversary Blocked:</span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> 100% BLOCKED
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="text-[11px] font-mono text-zinc-500 pt-3 border-t border-zinc-800/80">
            Guaranteed protection against cross-patient payload swapping, silent corruption, and replay attacks.
          </div>
        </div>
      </div>

      {/* Forensic Log Stream */}
      <div className="surface-card rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2.5 text-xs font-mono text-zinc-400">
          <Terminal className="w-3.5 h-3.5 text-zinc-400" />
          <span>Forensic Audit Stream</span>
        </div>

        <div className="bg-zinc-950/90 rounded-lg p-3 border border-zinc-800 max-h-40 overflow-y-auto font-mono text-xs space-y-1">
          {logs.map((l, i) => (
            <div
              key={i}
              className={
                l.type === 'error'
                  ? 'text-rose-400 font-medium'
                  : l.type === 'warn'
                  ? 'text-amber-400'
                  : l.type === 'success'
                  ? 'text-emerald-400'
                  : 'text-zinc-500'
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
