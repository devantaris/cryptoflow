import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, Download, Key, Shield, FileCheck, Layers, Sparkles } from 'lucide-react';
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
    if (isPlaying && activeStage < 5) {
      timer = setTimeout(() => {
        setActiveStage((prev) => prev + 1);
      }, 1400);
    } else if (activeStage === 5) {
      setIsPlaying(false);
    }
    return () => clearTimeout(timer);
  }, [isPlaying, activeStage]);

  const stages = [
    {
      id: 1,
      name: 'Ingest & Normalize',
      desc: 'Heterogeneous files normalized into 64-byte typed binary headers.',
      icon: <Layers className="w-4 h-4 text-blue-400" />,
      tag: 'CFBLB\\x00 Prefix',
    },
    {
      id: 2,
      name: 'Key Generation',
      desc: 'CSPRNG generates 256-bit AES keys + nonces per modality and HMAC key.',
      icon: <Key className="w-4 h-4 text-amber-400" />,
      tag: 'CSPRNG Entropy',
    },
    {
      id: 3,
      name: 'AES-256-GCM AEAD',
      desc: 'Authenticated encryption produces ciphertext + 128-bit integrity tags.',
      icon: <Shield className="w-4 h-4 text-indigo-400" />,
      tag: 'AES-NI Hardware',
    },
    {
      id: 4,
      name: 'HMAC-SHA-256 Binding',
      desc: 'Deterministic cross-modal digest welds all blobs into an immutable unit.',
      icon: <Sparkles className="w-4 h-4 text-emerald-400" />,
      tag: 'Invariant Seal',
    },
    {
      id: 5,
      name: 'Container Packaging',
      desc: 'Assembles binary container and decouples key material out-of-band.',
      icon: <FileCheck className="w-4 h-4 text-zinc-300" />,
      tag: '.cryptoflow Container',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto py-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-7 pb-5 border-b border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Stage 02 Execution
            </span>
            <span className="text-zinc-500 text-xs">•</span>
            <span className="text-zinc-400 text-xs font-mono">5-Stage Deterministic Pipeline</span>
          </div>
          <h1 className="text-xl md:text-2xl font-semibold text-zinc-100 tracking-tight">
            Pipeline Execution & State Visualizer
          </h1>
          <p className="text-xs md:text-sm text-zinc-400 mt-1 max-w-2xl leading-relaxed">
            Live sequential progression from raw multimodality input to cryptographically bound binary container.
          </p>
        </div>

        {/* Stepper Controls */}
        <div className="flex items-center gap-2 bg-zinc-900/90 p-1 rounded-lg border border-zinc-800">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-zinc-200 hover:bg-zinc-800 transition cursor-pointer"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlaying ? 'Pause' : 'Play'}</span>
          </button>
          <button
            onClick={() => { setActiveStage(1); setIsPlaying(true); }}
            className="p-1.5 text-zinc-400 hover:text-zinc-200 rounded-md transition cursor-pointer"
            title="Replay from Beginning"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 5-Stage Stepper Flowchart */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-6">
        {stages.map((st) => {
          const isPassed = activeStage >= st.id;
          const isCurrent = activeStage === st.id;

          return (
            <div
              key={st.id}
              onClick={() => { setActiveStage(st.id); setIsPlaying(false); }}
              className={`surface-card rounded-xl p-4 transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                isCurrent
                  ? 'border-zinc-500 bg-zinc-850/90 shadow-md ring-1 ring-white/10'
                  : isPassed
                  ? 'border-zinc-800 bg-zinc-900/80 text-zinc-300'
                  : 'border-zinc-900 bg-zinc-950/40 opacity-50'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <div className={`w-7 h-7 rounded-md flex items-center justify-center border ${
                    isCurrent 
                      ? 'bg-zinc-800 border-zinc-600 text-white' 
                      : isPassed 
                      ? 'bg-zinc-900 border-zinc-800 text-zinc-300' 
                      : 'bg-zinc-950 border-zinc-900 text-zinc-600'
                  }`}>
                    {st.icon}
                  </div>
                  <span className={`text-[10px] font-mono font-medium ${isCurrent ? 'text-zinc-200' : 'text-zinc-500'}`}>
                    0{st.id}
                  </span>
                </div>

                <h4 className="font-medium text-xs text-zinc-100 mb-1">{st.name}</h4>
                <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">{st.desc}</p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-zinc-800/80 flex items-center justify-between text-[10px] font-mono">
                <span className="text-zinc-500">{st.tag}</span>
                <span className={isPassed ? 'text-emerald-400 font-medium' : 'text-zinc-600'}>
                  {isCurrent ? 'ACTIVE' : isPassed ? 'COMPLETE' : 'QUEUED'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Stage Detail Inspector */}
      <div className="surface-card rounded-xl p-5 md:p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
          {/* Left: Stage Visual */}
          <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 bg-zinc-950/80 rounded-xl border border-zinc-800/80 min-h-[180px]">
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
                <div className="p-2.5 bg-zinc-850 border border-blue-500/30 rounded-lg text-center">
                  <span className="text-xs font-mono font-medium text-blue-400">CFBLB Header</span>
                  <div className="text-[9px] font-mono text-zinc-400">64-Byte Normalized</div>
                </div>
              </div>
            )}

            {activeStage === 2 && (
              <div className="w-full">
                <div className="text-xs font-mono text-zinc-400 mb-2 font-medium">CSPRNG Key Derivation (256-bit):</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 w-full">
                  <div className="p-2 bg-zinc-900 border border-zinc-800 rounded-md font-mono text-[11px]">
                    <span className="text-zinc-400 text-[10px]">Key 01 (Image)</span>
                    <div className="text-zinc-200 truncate font-semibold">{encryptResult?.keys_summary[0]?.key_hex || '9f4a2b...7e1a'}</div>
                  </div>
                  <div className="p-2 bg-zinc-900 border border-zinc-800 rounded-md font-mono text-[11px]">
                    <span className="text-zinc-400 text-[10px]">Key 02 (Report)</span>
                    <div className="text-zinc-200 truncate font-semibold">{encryptResult?.keys_summary[1]?.key_hex || 'b2e71c...3d9c'}</div>
                  </div>
                  <div className="p-2 bg-zinc-900 border border-zinc-800 rounded-md font-mono text-[11px]">
                    <span className="text-zinc-400 text-[10px]">Key 03 (Meta)</span>
                    <div className="text-zinc-200 truncate font-semibold">{encryptResult?.keys_summary[2]?.key_hex || '1d8c9e...5b4f'}</div>
                  </div>
                </div>
              </div>
            )}

            {activeStage === 3 && (
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

            {activeStage === 4 && (
              <WaxSeal status={activeStage === 4 ? 'active' : 'intact'} size={80} label="HMAC-SHA-256 SEAL" />
            )}

            {activeStage === 5 && (
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
                <span className="text-zinc-200 font-medium">{stages[activeStage - 1].name}</span>
              </div>

              <div className="flex justify-between border-b border-zinc-800/80 pb-1.5">
                <span className="text-zinc-500">Binding Digest:</span>
                <span className="text-amber-400 font-medium truncate max-w-[200px]">
                  {encryptResult?.binding_hash || 'be4a130d46b3e0ff...'}
                </span>
              </div>

              <div className="flex justify-between border-b border-zinc-800/80 pb-1.5">
                <span className="text-zinc-500">Cipher Suite:</span>
                <span className="text-zinc-200">AES-256-GCM + SHA256-HMAC</span>
              </div>

              <div className="flex justify-between pt-0.5">
                <span className="text-zinc-500">Container UUID:</span>
                <span className="text-zinc-400">{encryptResult?.bundle_id || '2d95abd2-b6bb-4399'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Deliverable Outputs */}
      {encryptResult && (
        <div className="surface-card rounded-xl p-5 border-zinc-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-medium text-sm text-zinc-100 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-400" />
              <span>Container Packaging Completed</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Encrypted payload container and separate secret keyring generated and verified.
            </p>
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto">
            <a
              href={encryptResult.bundle_download_url}
              download={encryptResult.bundle_filename}
              className="btn-primary px-4 py-2 text-xs font-medium flex items-center gap-1.5 cursor-pointer"
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
              className="px-3.5 py-2 rounded-md bg-zinc-850 hover:bg-zinc-800 text-zinc-300 border border-zinc-700/60 font-mono text-xs transition cursor-pointer"
            >
              Verify →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
