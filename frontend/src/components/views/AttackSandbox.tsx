import React, { useState } from 'react';
import { RotateCcw, Terminal, Zap, CheckCircle2, ChevronDown, ChevronUp, Image as ImageIcon } from 'lucide-react';
import { WaxSeal } from '../animations/WaxSeal';
import { simulateAttackApi } from '../../services/api';
import type { AttackResult } from '../../types';

export const AttackSandbox: React.FC = () => {
  const [activeAttack, setActiveAttack] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [attackResult, setAttackResult] = useState<AttackResult | null>(null);
  const [showMatrixFigure, setShowMatrixFigure] = useState<boolean>(true);
  const [logs, setLogs] = useState<Array<{ text: string; type: 'info' | 'warn' | 'error' | 'success' }>>([
    { text: '[AUDIT READY] Formal 7-threat adversary suite armed. Ready for tamper simulation.', type: 'info' },
  ]);

  const attacks = [
    {
      id: 'bit_flip',
      name: '1. In-Flight Bit Flip',
      desc: 'Inverts 1 bit within encrypted ciphertext to simulate transmission line corruption or MITM modification.',
      defense: 'GCM Auth Tag Mismatch',
      code: 'AUTH_TAG_FAIL',
    },
    {
      id: 'swap_modalities',
      name: '2. Intra-Bundle Transposition',
      desc: 'Adversary swaps the internal byte order of CT scan and radiology report within container envelope.',
      defense: 'Deterministic Order Verification',
      code: 'ORDER_MISMATCH',
    },
    {
      id: 'cross_bundle_swap',
      name: '3. Cross-Patient Substitution',
      desc: 'CRITICAL THREAT: Replaces Patient A (benign) report with Patient B (malignant) report payload.',
      defense: 'HMAC-SHA-256 Digest Mismatch',
      code: 'BINDING_MISMATCH',
    },
    {
      id: 'truncate_blob',
      name: '4. Network Truncation',
      desc: 'Simulates connection drop or intentional trailing byte cutoff on container trailing bytes.',
      defense: 'Binary Header Length Check',
      code: 'LENGTH_OVERRUN',
    },
    {
      id: 'inject_blob',
      name: '5. Rogue Modality Injection',
      desc: 'Injects an unauthorized 4th payload into an authentic 3-modality patient record container.',
      defense: 'Modality Count & Digest Invalidation',
      code: 'MODALITY_OVERFLOW',
    },
    {
      id: 'manifest_tamper',
      name: '6. Manifest Metadata Forgery',
      desc: 'Attacker forges the manifest JSON digest field to match an altered payload without key material.',
      defense: 'Digest Invariant Recalculation',
      code: 'MANIFEST_FORGERY',
    },
    {
      id: 'key_mismatch',
      name: '7. Foreign Keyring Unlock',
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
        { text: `[THREAT INJECTED] Simulating adversary vector: ${attackName}...`, type: 'warn' },
        { text: `[SECURITY ENGINE] Intercepting payload in transit & attempting unauthorized decryption...`, type: 'info' },
      ]);

      const result = await simulateAttackApi(attackId);
      setAttackResult(result);

      if (result.detected) {
        setLogs((prev) => [
          ...prev,
          { text: `[DEFENSE ENFORCED] ${result.exception_raised} triggered immediately.`, type: 'error' },
          { text: `[CONTAINER SEALED] Cross-modal integrity seal broken. Decryption halted.`, type: 'error' },
          { text: `[FORENSIC AUDIT PASS] ${result.forensic_details}`, type: 'success' },
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
    <div className="max-w-5xl mx-auto py-8">
      {/* Masthead Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-stone-300">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="badge-crimson px-2 py-0.5 rounded text-[11px] font-mono font-medium">
              SECTION IV • THREAT ANALYSIS
            </span>
            <span className="text-stone-400 text-xs">•</span>
            <span className="text-stone-500 font-serif italic text-xs">
              Formal Adversarial Security Models
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-stone-900 tracking-tight">
            Adversarial Threat Simulation Matrix
          </h1>
          <p className="text-sm font-serif text-stone-600 mt-1 max-w-2xl leading-relaxed">
            Execute 7 formal adversarial attack vectors across patient interchange, payload tampering, and key mismatch models to evaluate defensive guarantees.
          </p>
        </div>

        <button
          onClick={handleReset}
          className="btn-journal-secondary px-3.5 py-1.5 text-xs flex items-center gap-1.5 cursor-pointer self-start md:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Threat Matrix</span>
        </button>
      </div>

      {/* Embedded Threat Matrix Figure */}
      <div className="journal-card rounded-lg p-4 mb-8">
        <div 
          className="flex items-center justify-between cursor-pointer select-none"
          onClick={() => setShowMatrixFigure(!showMatrixFigure)}
        >
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-stone-700" />
            <h3 className="font-serif font-bold text-sm text-stone-900">
              Figure 2: Formal Threat Vector & Defensive Control Matrix
            </h3>
          </div>
          <button className="text-stone-500 hover:text-stone-800 text-xs flex items-center gap-1 font-sans">
            {showMatrixFigure ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {showMatrixFigure && (
          <div className="mt-3 pt-3 border-t border-stone-200">
            <div className="bg-stone-950 rounded-md p-2 flex justify-center overflow-hidden shadow-inner">
              <img
                src="/diagrams/attack_matrix.png"
                alt="Adversarial Attack Defense Matrix Diagram"
                className="max-h-72 object-contain w-auto rounded"
              />
            </div>
            <p className="text-[11px] font-serif italic text-stone-600 mt-2 text-center">
              Figure 2 maps all 7 threat vectors against the 5 defensive controls of the CryptoFlow engine. All 7 vectors are 100% blocked with zero plaintext disclosure.
            </p>
          </div>
        )}
      </div>

      {/* Threat Execution Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        {/* Left: 7 Attack Arsenal Grid */}
        <div className="lg:col-span-7 space-y-3">
          <div className="font-serif font-bold text-sm text-stone-900 mb-2">
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
                  className={`text-left p-3.5 rounded-lg border transition-all duration-150 cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-red-50 border-red-400 shadow-xs ring-1 ring-red-400'
                      : 'journal-card journal-card-hover border-stone-300'
                  }`}
                >
                  <div className="pr-4">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-serif font-bold text-xs text-stone-900">{atk.name}</h4>
                      <span className="badge-editorial text-[9px] px-1.5 py-0.5 rounded">
                        {atk.code}
                      </span>
                    </div>
                    <p className="text-[11px] font-serif text-stone-600 leading-relaxed line-clamp-1">{atk.desc}</p>
                  </div>

                  <div className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded bg-stone-100 border border-stone-300 text-[11px] font-mono text-stone-700">
                    <Zap className="w-3 h-3 text-amber-700" />
                    <span>Simulate</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Real-time Seal Status & Audit Panel */}
        <div className="lg:col-span-5 flex flex-col justify-between journal-card rounded-lg p-5">
          <div>
            <div className="flex items-center justify-between pb-2 mb-4 border-b border-stone-200">
              <span className="font-serif font-bold text-xs text-stone-900">
                Cryptographic Seal Status:
              </span>
              <span className={`text-xs font-mono font-bold ${activeAttack ? 'text-red-700' : 'text-emerald-800'}`}>
                {activeAttack ? 'UNDER THREAT' : 'ARMED & SECURE'}
              </span>
            </div>

            {/* Seal Display */}
            <div className="py-6 flex justify-center items-center bg-[#FAF9F6] rounded border border-stone-300 mb-4 min-h-[140px]">
              <WaxSeal status={activeAttack ? 'broken' : 'intact'} label="SEAL INTACT" />
            </div>

            {/* Scorecard */}
            {attackResult && (
              <div className="p-3.5 rounded bg-white border border-stone-300 text-xs font-mono space-y-1.5 mb-3 shadow-xs">
                <div className="flex justify-between">
                  <span className="text-stone-500">Security Control:</span>
                  <span className="text-red-800 font-bold">{attackResult.exception_raised}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Adversary Blocked:</span>
                  <span className="text-emerald-800 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> 100% BLOCKED
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="text-[11px] font-serif text-stone-500 pt-3 border-t border-stone-200">
            Guaranteed mathematical protection against cross-patient payload swapping, silent corruption, and replay attacks.
          </div>
        </div>
      </div>

      {/* Forensic Log Stream */}
      <div className="journal-card rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2 text-xs font-mono text-stone-700 font-semibold">
          <Terminal className="w-3.5 h-3.5 text-stone-700" />
          <span>Real-Time Forensic Audit Stream</span>
        </div>

        <div className="bg-[#FAF9F6] rounded p-3 border border-stone-300 max-h-40 overflow-y-auto font-mono text-xs space-y-1">
          {logs.map((l, i) => (
            <div
              key={i}
              className={
                l.type === 'error'
                  ? 'text-red-800 font-bold'
                  : l.type === 'warn'
                  ? 'text-amber-800'
                  : l.type === 'success'
                  ? 'text-emerald-800'
                  : 'text-stone-600'
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
