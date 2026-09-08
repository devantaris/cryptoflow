import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, Download, Key, Shield, FileCheck, Layers, Sparkles, Activity, CheckCircle2 } from 'lucide-react';
import { WaxSeal } from '../animations/WaxSeal';
import type { EncryptResult } from '../../types';

interface PipelineVisualizerProps {
  encryptResult: EncryptResult | null;
  onNavigateToDecrypt: () => void;
}

export const PipelineVisualizer: React.FC<PipelineVisualizerProps> = ({
  encryptResult,
  onNavigateToDecrypt,
}) => {
  const [activeStage, setActiveStage] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);

  useEffect(() => {
    let timer: any;
    if (isPlaying && activeStage < 6) {
      timer = setTimeout(() => {
        setActiveStage((prev) => prev + 1);
      }, 1400);
    } else if (activeStage === 6) {
      setIsPlaying(false);
    }
    return () => clearTimeout(timer);
  }, [isPlaying, activeStage]);

  const stages = [
    {
      id: 1,
      numeral: 'I',
      name: 'Normalization',
      desc: 'Heterogeneous files normalized into 64-byte typed binary headers.',
      icon: <Layers className="w-4 h-4 text-cyan-400" />,
      tag: 'CFBLB Header',
    },
    {
      id: 2,
      numeral: 'II',
      name: 'Uncertainty (DST vs DEL)',
      desc: 'Dual-theory evidence fusion (Dempster-Shafer & Deep Evidential Learning).',
      icon: <Activity className="w-4 h-4 text-rose-400" />,
      tag: 'Shannon + Dirichlet',
    },
    {
      id: 3,
      numeral: 'III',
      name: 'Key Generation',
      desc: 'CSPRNG generates 256-bit AES keys + nonces per modality and HMAC key.',
      icon: <Key className="w-4 h-4 text-amber-400" />,
      tag: 'CSPRNG Pool',
    },
    {
      id: 4,
      numeral: 'IV',
      name: 'AES-GCM AEAD',
      desc: 'Hardware accelerated authenticated encryption with 128-bit MAC tags.',
      icon: <Shield className="w-4 h-4 text-indigo-400" />,
      tag: 'AES-NI Engine',
    },
    {
      id: 5,
      numeral: 'V',
      name: 'HMAC Binding',
      desc: 'Deterministic cross-modal digest welds all blobs into an immutable unit.',
      icon: <Sparkles className="w-4 h-4 text-emerald-400" />,
      tag: 'HMAC-SHA-256',
    },
    {
      id: 6,
      numeral: 'VI',
      name: 'Split Courier',
      desc: 'Payload container emitted while secret keys are sealed into keyring.',
      icon: <FileCheck className="w-4 h-4 text-purple-400" />,
      tag: '.cryptoflow + .keyring',
    },
  ];

  const uncertainty = encryptResult?.uncertainty || encryptResult?.manifest?.uncertainty_profile;

  return (
    <div className="max-w-5xl mx-auto py-8">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="badge-cyan px-2.5 py-0.5 rounded text-[11px] font-mono font-medium">
              MODULE II • PIPELINE STATE MACHINE
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            6-Stage Cryptographic Pipeline Visualizer
          </h2>
          <p className="text-xs text-zinc-400 mt-1 max-w-2xl font-sans">
            Observe the step-by-step state machine transitions from raw modality ingestion, dual DST/DEL uncertainty quantification, to deterministic HMAC binding and split-courier emission.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="btn-secondary px-3 py-1.5 text-xs font-mono flex items-center gap-1.5 cursor-pointer"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlaying ? 'Pause' : 'Play'}</span>
          </button>

          <button
            onClick={() => {
              setActiveStage(1);
              setIsPlaying(true);
            }}
            className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-lg transition border border-zinc-800 cursor-pointer"
            title="Restart Animation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 6-Stage Stepper Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 mb-6">
        {stages.map((st) => {
          const isCurrent = activeStage === st.id;
          const isPassed = activeStage > st.id;

          return (
            <div
              key={st.id}
              onClick={() => {
                setActiveStage(st.id);
                setIsPlaying(false);
              }}
              className={`p-3 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                isCurrent
                  ? 'bg-zinc-900 border-cyan-500/50 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500/30'
                  : isPassed
                  ? 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700'
                  : 'bg-zinc-950/30 border-zinc-900 opacity-60 hover:opacity-100'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                  isCurrent ? 'bg-cyan-500/20 text-cyan-300' : 'bg-zinc-800 text-zinc-400'
                }`}>
                  {st.numeral}
                </span>
                {st.icon}
              </div>

              <div>
                <h3 className={`text-xs font-semibold ${isCurrent ? 'text-white' : 'text-zinc-300'}`}>
                  {st.name}
                </h3>
                <p className="text-[10px] text-zinc-500 mt-1 leading-snug font-sans line-clamp-2">
                  {st.desc}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-zinc-800/60 text-[9px] font-mono text-zinc-500">
                {st.tag}
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Main Visualizer Stage */}
      <div className="surface-card rounded-2xl p-6 md:p-8 mb-6 border-white/10">
        <div className="flex flex-col lg:flex-row items-center gap-8">
          {/* Left: Stage Visual */}
          <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 bg-zinc-950/80 rounded-xl border border-zinc-800/80 min-h-[220px]">
            {activeStage === 1 && (
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-zinc-900 border border-zinc-700/80 rounded-lg text-center font-mono">
                  <span className="text-xs text-zinc-300 font-medium">DICOM</span>
                  <div className="text-[9px] text-zinc-500">Image Blob</div>
                </div>
                <span className="text-zinc-600 font-mono">+</span>
                <div className="p-2.5 bg-zinc-900 border border-zinc-700/80 rounded-lg text-center font-mono">
                  <span className="text-xs text-zinc-300 font-medium">Report</span>
                  <div className="text-[9px] text-zinc-500">Text Blob</div>
                </div>
                <span className="text-zinc-600 font-mono">+</span>
                <div className="p-2.5 bg-zinc-900 border border-zinc-700/80 rounded-lg text-center font-mono">
                  <span className="text-xs text-zinc-300 font-medium">Metadata</span>
                  <div className="text-[9px] text-zinc-500">JSON Blob</div>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-500 mx-1" />
                <div className="p-2.5 bg-zinc-900 border border-cyan-500/40 rounded-lg text-center">
                  <span className="text-xs font-mono font-medium text-cyan-400">CFBLB Header</span>
                  <div className="text-[9px] font-mono text-zinc-400">64-Byte Envelope</div>
                </div>
              </div>
            )}

            {activeStage === 2 && (
              <div className="w-full space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5">
                  <span className="text-xs font-mono text-zinc-300 font-semibold flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-rose-400" />
                    <span>Dual Uncertainty Quantification Engine</span>
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    {uncertainty?.comparison?.reliability_agreement ?? true ? 'CONSENSUS: RELIABLE' : 'CONFLICT DETECTED'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  {/* DST Card */}
                  <div className="p-2.5 bg-zinc-900/90 rounded-lg border border-cyan-500/30">
                    <div className="text-[10px] text-cyan-400 font-semibold mb-1">
                      Dempster-Shafer (DST)
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-zinc-400">Fused Belief:</span>
                      <span className="text-white font-bold">
                        {uncertainty?.fusion?.dst?.belief_reliable 
                          ? `${(uncertainty.fusion.dst.belief_reliable * 100).toFixed(2)}%` 
                          : '99.97%'}
                      </span>
                    </div>
                    <div className="flex justify-between text-[10px] text-zinc-500 mt-0.5">
                      <span>Conflict K:</span>
                      <span className="text-zinc-300">
                        {uncertainty?.fusion?.dst_conflict_K !== undefined
                          ? uncertainty.fusion.dst_conflict_K.toFixed(5)
                          : '0.00002'}
                      </span>
                    </div>
                  </div>

                  {/* DEL Card */}
                  <div className="p-2.5 bg-zinc-900/90 rounded-lg border border-amber-500/30">
                    <div className="text-[10px] text-amber-400 font-semibold mb-1">
                      Deep Evidential (DEL)
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-zinc-400">Expected Rel:</span>
                      <span className="text-white font-bold">
                        {uncertainty?.fusion?.del?.expected_reliable 
                          ? `${(uncertainty.fusion.del.expected_reliable * 100).toFixed(2)}%` 
                          : '96.87%'}
                      </span>
                    </div>
                    <div className="flex justify-between text-[10px] text-zinc-500 mt-0.5">
                      <span>Epistemic u:</span>
                      <span className="text-zinc-300">
                        {uncertainty?.fusion?.del?.epistemic_uncertainty !== undefined
                          ? uncertainty.fusion.del.epistemic_uncertainty.toFixed(4)
                          : '0.0625'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-2 bg-zinc-900/50 rounded-lg border border-zinc-800/80 text-[10px] font-mono text-zinc-400 leading-snug">
                  <span className="text-zinc-500">Feature Verification:</span> Shannon Entropy (DICOM: 8.00b, Text: 3.87b, JSON: 4.28b) • Format Conformance: 100%
                </div>
              </div>
            )}

            {activeStage === 3 && (
              <div className="w-full">
                <div className="text-xs font-mono text-zinc-400 mb-2 font-medium">CSPRNG Key Derivation (256-bit):</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 w-full">
                  <div className="p-2 bg-zinc-900 border border-zinc-800 rounded-md font-mono text-[11px]">
                    <span className="text-zinc-500 text-[10px]">Key 01 (Image)</span>
                    <div className="text-cyan-300 truncate font-semibold">{encryptResult?.keys_summary[0]?.key_hex || '9f4a2b...7e1a'}</div>
                  </div>
                  <div className="p-2 bg-zinc-900 border border-zinc-800 rounded-md font-mono text-[11px]">
                    <span className="text-zinc-500 text-[10px]">Key 02 (Report)</span>
                    <div className="text-amber-300 truncate font-semibold">{encryptResult?.keys_summary[1]?.key_hex || 'b2e71c...3d9c'}</div>
                  </div>
                  <div className="p-2 bg-zinc-900 border border-zinc-800 rounded-md font-mono text-[11px]">
                    <span className="text-zinc-500 text-[10px]">Key 03 (Meta)</span>
                    <div className="text-purple-300 truncate font-semibold">{encryptResult?.keys_summary[2]?.key_hex || '1d8c9e...5b4f'}</div>
                  </div>
                </div>
              </div>
            )}

            {activeStage === 4 && (
              <div className="flex items-center gap-3">
                <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg text-center">
                  <Shield className="w-6 h-6 text-indigo-400 mx-auto mb-1" />
                  <span className="text-xs font-mono text-zinc-200">AES-256-GCM</span>
                </div>
                <span className="text-zinc-600 font-mono">+</span>
                <div className="p-3 bg-zinc-900 border border-emerald-500/30 rounded-lg text-center">
                  <span className="text-xs font-mono font-medium text-emerald-400">128-Bit Tag</span>
                  <div className="text-[10px] font-mono text-zinc-500">AEAD MAC Authentication</div>
                </div>
              </div>
            )}

            {activeStage === 5 && (
              <WaxSeal status={activeStage === 5 ? 'active' : 'intact'} size={80} label="HMAC-SHA-256 SEAL" />
            )}

            {activeStage === 6 && (
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-xl mb-2 shadow-sm">
                  📦
                </div>
                <span className="text-xs font-mono font-semibold text-zinc-200">Binary Container Formed</span>
                <span className="text-[11px] font-mono text-zinc-400 mt-0.5">{encryptResult?.bundle_filename || 'bundle.cryptoflow'}</span>
              </div>
            )}
          </div>

          {/* Right: Technical Inspector */}
          <div className="w-full lg:w-1/2">
            <h3 className="font-mono text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2.5">
              Cryptographic Invariant Inspector
            </h3>

            <div className="bg-zinc-950/80 border border-zinc-800 rounded-lg p-3 font-mono text-xs text-zinc-300 space-y-2">
              <div className="flex justify-between border-b border-zinc-800/80 pb-1.5">
                <span className="text-zinc-500">Current Phase:</span>
                <span className="text-cyan-400 font-medium">{stages[activeStage - 1].name}</span>
              </div>

              {activeStage === 2 ? (
                <>
                  <div className="flex justify-between border-b border-zinc-800/80 pb-1.5">
                    <span className="text-zinc-500">Theories Evaluated:</span>
                    <span className="text-amber-400 font-medium">DST (1976) + DEL (2018)</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-800/80 pb-1.5">
                    <span className="text-zinc-500">Conflict Factor K:</span>
                    <span className="text-emerald-400 font-medium">
                      {uncertainty?.fusion?.dst_conflict_K !== undefined
                        ? uncertainty.fusion.dst_conflict_K.toFixed(5)
                        : '0.00002'}
                    </span>
                  </div>
                  <div className="flex justify-between pt-0.5">
                    <span className="text-zinc-500">Evidence Vacuity:</span>
                    <span className="text-cyan-300">
                      {uncertainty?.fusion?.del?.epistemic_uncertainty !== undefined
                        ? `u = ${uncertainty.fusion.del.epistemic_uncertainty.toFixed(4)}`
                        : 'u = 0.0625'}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between border-b border-zinc-800/80 pb-1.5">
                    <span className="text-zinc-500">Binding Digest:</span>
                    <span className="text-amber-400 font-medium truncate max-w-[200px]">
                      {encryptResult?.binding_hash || 'be4a130d46b3e0ff...'}
                    </span>
                  </div>

                  <div className="flex justify-between border-b border-zinc-800/80 pb-1.5">
                    <span className="text-zinc-500">Cipher Suite:</span>
                    <span className="text-zinc-200">AES-256-GCM + HMAC-SHA-256</span>
                  </div>

                  <div className="flex justify-between pt-0.5">
                    <span className="text-zinc-500">Container UUID:</span>
                    <span className="text-zinc-400">{encryptResult?.bundle_id || '2d95abd2-b6bb-4399'}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Uncertainty Quantification Profile Card */}
      {uncertainty && (
        <div className="surface-card rounded-xl p-5 border-zinc-800 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 pb-3 border-b border-zinc-800">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Activity className="w-4 h-4 text-rose-400" />
                <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                  Embedded Uncertainty Quantification Profile (DST vs DEL)
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-sans">
                {uncertainty.comparison.narrative}
              </p>
            </div>
            <div className="flex items-center gap-2 self-start md:self-auto text-xs font-mono">
              <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Completeness: {(uncertainty.completeness * 100).toFixed(0)}%</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {uncertainty.modality_assessments.map((a) => (
              <div key={a.modality} className="p-3 bg-zinc-950/70 rounded-lg border border-zinc-800/80 font-mono text-xs">
                <div className="flex justify-between items-center mb-2 pb-1 border-b border-zinc-850">
                  <span className="font-semibold text-zinc-200 uppercase tracking-wide">{a.modality}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                    {a.present ? 'Present' : 'Missing'}
                  </span>
                </div>

                <div className="space-y-1.5 text-[11px]">
                  {a.features && (
                    <div className="flex justify-between text-zinc-400">
                      <span>Entropy:</span>
                      <span className="text-zinc-300 font-bold">{a.features.entropy_bits.toFixed(2)} bits</span>
                    </div>
                  )}
                  <div className="flex justify-between text-zinc-400">
                    <span>DST Bel(Reliable):</span>
                    <span className="text-cyan-400 font-bold">{(a.dst.belief_reliable * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>DEL E[Reliable]:</span>
                    <span className="text-amber-400 font-bold">{(a.del.expected_reliable * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>DEL Vacuity (u):</span>
                    <span className="text-zinc-300">{a.del.epistemic_uncertainty.toFixed(3)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Deliverable Outputs */}
      {encryptResult && (
        <div className="surface-card rounded-xl p-5 border-zinc-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-sm text-zinc-100 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-400" />
              <span>Container Packaging Completed</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Encrypted payload container, embedded uncertainty profile, and separate secret keyring generated and verified.
            </p>
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto">
            <a
              href={encryptResult.bundle_download_url}
              download={encryptResult.bundle_filename}
              className="btn-primary px-4 py-2 text-xs font-medium flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .cryptoflow</span>
            </a>

            <a
              href={encryptResult.keyring_download_url}
              download={encryptResult.keyring_filename}
              className="btn-secondary px-4 py-2 text-xs font-medium flex items-center gap-1.5 cursor-pointer"
            >
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span>Download .keyring</span>
            </a>

            <button
              onClick={onNavigateToDecrypt}
              className="px-3.5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-mono text-xs transition cursor-pointer"
            >
              Verify →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
