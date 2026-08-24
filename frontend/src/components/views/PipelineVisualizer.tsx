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
      }, 1600);
    } else if (activeStage === 5) {
      setIsPlaying(false);
    }
    return () => clearTimeout(timer);
  }, [isPlaying, activeStage]);

  const stages = [
    {
      id: 1,
      name: '01. Ingest & Normalize',
      desc: 'Raw heterogeneous files are validated and encapsulated into 64-byte typed binary headers.',
      icon: <Layers className="w-5 h-5 text-cyan-400" />,
      tag: 'CFBLB\\x00 Prefix',
    },
    {
      id: 2,
      name: '02. Key Fountain (CSPRNG)',
      desc: 'Generates isolated 256-bit AES keys + 96-bit nonces per modality, plus a 256-bit HMAC key.',
      icon: <Key className="w-5 h-5 text-amber-400" />,
      tag: 'AES-256 + HMAC Keys',
    },
    {
      id: 3,
      name: '03. AES-256-GCM Chamber',
      desc: 'Authenticated AEAD encryption locks data and produces 128-bit authentication tags.',
      icon: <Shield className="w-5 h-5 text-purple-400" />,
      tag: 'AEAD Lock + Auth Tag',
    },
    {
      id: 4,
      name: '04. Cross-Modal HMAC Binding',
      desc: 'Welds all encrypted blobs into an atomic mathematical unit with a deterministic HMAC-SHA-256 seal.',
      icon: <Sparkles className="w-5 h-5 text-emerald-400" />,
      tag: 'HMAC Wax Seal',
    },
    {
      id: 5,
      name: '05. .cryptoflow Packaging',
      desc: 'Assembles binary container file (Header + JSON Manifest + Blobs) & decouples key material.',
      icon: <FileCheck className="w-5 h-5 text-blue-400" />,
      tag: 'Binary Container v1',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-obsidian-800">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl md:text-3xl font-display font-bold text-white tracking-tight">
              5-Stage Cryptographic Pipeline
            </h1>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-400 border border-amber-800">
              Interactive Execution Engine
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Watch multimodal medical data transform in real time through cryptographic stages.
          </p>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center gap-2 bg-obsidian-900 p-1.5 rounded-xl border border-obsidian-800">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 transition cursor-pointer"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlaying ? 'Pause' : 'Play'}</span>
          </button>
          <button
            onClick={() => { setActiveStage(1); setIsPlaying(true); }}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
            title="Replay from Stage 1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 5 Stages Node Track */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        {stages.map((st) => {
          const isPassed = activeStage >= st.id;
          const isCurrent = activeStage === st.id;

          return (
            <div
              key={st.id}
              onClick={() => { setActiveStage(st.id); setIsPlaying(false); }}
              className={`glass-panel rounded-2xl p-4 border transition-all duration-300 cursor-pointer flex flex-col justify-between ${
                isCurrent
                  ? 'border-cyan-400 shadow-glow-cyan bg-obsidian-800/90 scale-105 z-10'
                  : isPassed
                  ? 'border-emerald-500/60 bg-obsidian-900/80 text-slate-300'
                  : 'border-obsidian-800 bg-obsidian-950/60 opacity-60'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${
                    isCurrent ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300' : isPassed ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400' : 'bg-obsidian-800 border-obsidian-700 text-slate-500'
                  }`}>
                    {st.icon}
                  </div>
                  <span className={`text-[11px] font-mono font-bold ${isCurrent ? 'text-cyan-400' : isPassed ? 'text-emerald-400' : 'text-slate-600'}`}>
                    {st.id === 4 ? '★ BIND' : `ST-${st.id}`}
                  </span>
                </div>

                <h4 className="font-display font-semibold text-xs text-white mb-1.5">{st.name}</h4>
                <p className="text-[11px] text-slate-400 line-clamp-3 leading-relaxed">{st.desc}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-obsidian-800/80 flex items-center justify-between text-[10px] font-mono">
                <span className="text-slate-500">{st.tag}</span>
                <span className={isPassed ? 'text-emerald-400 font-bold' : 'text-slate-600'}>
                  {isCurrent ? 'ACTIVE' : isPassed ? 'DONE ✓' : 'PENDING'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Stage Deep-Dive & Hex Inspector */}
      <div className="glass-panel rounded-2xl p-6 border border-obsidian-700 mb-8">
        <div className="flex flex-col lg:flex-row gap-8 items-center justify-between">
          {/* Left: Stage Visual Representation */}
          <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 bg-obsidian-950/70 rounded-xl border border-obsidian-800 min-h-[160px]">
            {activeStage === 1 && (
              <div className="flex items-center gap-3">
                <div className="p-3 bg-obsidian-900 border border-cyan-500/40 rounded-xl text-center">
                  <span className="text-2xl">🖼️</span>
                  <div className="text-[10px] font-mono text-cyan-400 mt-1">DICOM</div>
                </div>
                <span className="text-slate-500 font-mono">+</span>
                <div className="p-3 bg-obsidian-900 border border-amber-500/40 rounded-xl text-center">
                  <span className="text-2xl">📝</span>
                  <div className="text-[10px] font-mono text-amber-400 mt-1">Report</div>
                </div>
                <span className="text-slate-500 font-mono">+</span>
                <div className="p-3 bg-obsidian-900 border border-purple-500/40 rounded-xl text-center">
                  <span className="text-2xl">👤</span>
                  <div className="text-[10px] font-mono text-purple-400 mt-1">Metadata</div>
                </div>
                <ChevronRight className="w-5 h-5 text-cyan-400 mx-2" />
                <div className="p-3 bg-cyan-950/60 border border-cyan-400 rounded-xl text-center shadow-glow-cyan">
                  <span className="text-xs font-mono font-bold text-cyan-300">CFBLB (64B Header)</span>
                  <div className="text-[10px] font-mono text-slate-400">Normalized Binary Blob</div>
                </div>
              </div>
            )}

            {activeStage === 2 && (
              <div className="flex flex-col items-center gap-3 w-full">
                <div className="text-xs font-mono text-amber-400 font-semibold mb-1">CSPRNG Key Distribution</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 w-full">
                  <div className="p-2.5 bg-obsidian-900 border border-amber-500/30 rounded-lg text-center font-mono text-[11px]">
                    <span className="text-amber-400 font-bold">Key-A (Image)</span>
                    <div className="text-slate-400 text-[10px] truncate">{encryptResult?.keys_summary[0]?.key_hex || '9f4a2b...7e1a'}</div>
                  </div>
                  <div className="p-2.5 bg-obsidian-900 border border-amber-500/30 rounded-lg text-center font-mono text-[11px]">
                    <span className="text-amber-400 font-bold">Key-B (Report)</span>
                    <div className="text-slate-400 text-[10px] truncate">{encryptResult?.keys_summary[1]?.key_hex || 'b2e71c...3d9c'}</div>
                  </div>
                  <div className="p-2.5 bg-obsidian-900 border border-amber-500/30 rounded-lg text-center font-mono text-[11px]">
                    <span className="text-amber-400 font-bold">Key-C (Meta)</span>
                    <div className="text-slate-400 text-[10px] truncate">{encryptResult?.keys_summary[2]?.key_hex || '1d8c9e...5b4f'}</div>
                  </div>
                </div>
              </div>
            )}

            {activeStage === 3 && (
              <div className="flex items-center gap-4">
                <div className="p-3 bg-obsidian-900 border border-purple-500/40 rounded-xl text-center">
                  <span className="text-xl">🔐</span>
                  <div className="text-[10px] font-mono text-purple-300 mt-1">Ciphertext</div>
                </div>
                <span className="text-lg font-mono text-cyan-400">+</span>
                <div className="p-3 bg-emerald-950/80 border border-emerald-500/60 rounded-xl text-center shadow-glow-emerald">
                  <span className="text-xs font-mono font-bold text-emerald-300">128-Bit GCM Tag</span>
                  <div className="text-[10px] font-mono text-slate-400">Tamper-Evident Seal</div>
                </div>
              </div>
            )}

            {activeStage === 4 && (
              <WaxSeal status={activeStage === 4 ? 'active' : 'intact'} size={95} label="HMAC-SHA-256 SEAL" />
            )}

            {activeStage === 5 && (
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-2xl shadow-glow-cyan mb-2">
                  📦
                </div>
                <span className="text-xs font-mono font-bold text-white">.cryptoflow Bundle</span>
                <span className="text-[10px] font-mono text-cyan-300">{encryptResult?.bundle_filename || 'bundle.cryptoflow'}</span>
              </div>
            )}
          </div>

          {/* Right: Technical Inspector / Hex Data */}
          <div className="w-full lg:w-1/2">
            <h3 className="font-display font-semibold text-sm text-white mb-2 flex items-center gap-2">
              <span className="text-cyan-400">⚡</span>
              <span>Cryptographic State Inspector</span>
            </h3>

            <div className="bg-obsidian-950 border border-obsidian-800 rounded-xl p-3.5 font-mono text-xs text-slate-300 space-y-2">
              <div className="flex justify-between border-b border-obsidian-800/80 pb-1.5">
                <span className="text-slate-500">Active Stage:</span>
                <span className="text-cyan-400 font-bold">{stages[activeStage - 1].name}</span>
              </div>

              <div className="flex justify-between border-b border-obsidian-800/80 pb-1.5">
                <span className="text-slate-500">Cross-Modal Binding Hash:</span>
                <span className="text-amber-400 font-bold truncate max-w-[200px]">
                  {encryptResult?.binding_hash || 'be4a130d46b3e0ff9d8c...'}
                </span>
              </div>

              <div className="flex justify-between border-b border-obsidian-800/80 pb-1.5">
                <span className="text-slate-500">AEAD Cipher:</span>
                <span className="text-slate-200">AES-256-GCM (Hardware Accelerated)</span>
              </div>

              <div className="flex justify-between pt-0.5">
                <span className="text-slate-500">Atomic Bundle ID:</span>
                <span className="text-purple-400">{encryptResult?.bundle_id || '2d95abd2-b6bb-4399'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Deliverable Downloads */}
      {encryptResult && (
        <div className="glass-panel rounded-2xl p-6 border border-emerald-500/40 bg-emerald-950/10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="font-display font-bold text-base text-white flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-emerald-400" />
              <span>Bundle Packaging Complete — Ready for Delivery</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Data truck container and out-of-band key material are ready for split courier transport.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <a
              href={encryptResult.bundle_download_url}
              download={encryptResult.bundle_filename}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-obsidian-950 font-mono font-bold text-xs shadow-glow-cyan transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .cryptoflow</span>
            </a>

            <a
              href={encryptResult.keyring_download_url}
              download={encryptResult.keyring_filename}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-obsidian-950 font-mono font-bold text-xs shadow-glow-amber transition cursor-pointer"
            >
              <Key className="w-3.5 h-3.5" />
              <span>Download .keyring</span>
            </a>

            <button
              onClick={onNavigateToDecrypt}
              className="px-4 py-2.5 rounded-xl bg-obsidian-800 hover:bg-obsidian-700 text-slate-200 border border-obsidian-700 font-mono text-xs transition cursor-pointer"
            >
              Test Decrypt →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
