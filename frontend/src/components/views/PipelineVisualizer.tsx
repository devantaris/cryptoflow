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
      }, 2000);
    } else if (activeStage === 5) {
      setIsPlaying(false);
    }
    return () => clearTimeout(timer);
  }, [isPlaying, activeStage]);

  const stages = [
    {
      id: 1,
      name: 'Read & Prepare',
      layman: 'Collects your files and makes them ready.',
      desc: 'Heterogeneous files are validated and encapsulated into standard headers.',
      icon: <Layers className="w-5 h-5 text-cyan-400" />,
    },
    {
      id: 2,
      name: 'Create Keys',
      layman: 'Makes unique passwords for each file.',
      desc: 'Generates 256-bit AES keys + 96-bit nonces per modality.',
      icon: <Key className="w-5 h-5 text-amber-400" />,
    },
    {
      id: 3,
      name: 'Lock Data',
      layman: 'Scrambles the files so no one can read them.',
      desc: 'Authenticated AEAD encryption produces ciphertext and auth tags.',
      icon: <Shield className="w-5 h-5 text-purple-400" />,
    },
    {
      id: 4,
      name: 'Seal Together',
      layman: 'Glues the locked files into one tamper-proof bundle.',
      desc: 'Cross-modal HMAC binding welds blobs into an atomic unit.',
      icon: <Sparkles className="w-5 h-5 text-emerald-400" />,
    },
    {
      id: 5,
      name: 'Final Package',
      layman: 'Wraps everything in a secure delivery box.',
      desc: 'Assembles binary container file & decouples key material.',
      icon: <FileCheck className="w-5 h-5 text-blue-400" />,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-white tracking-tight">
            How Your Data is Secured (5 Stages)
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Watch the step-by-step process of how we encrypt and package your medical records.
          </p>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-xl border border-slate-800">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 transition cursor-pointer"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isPlaying ? 'Pause' : 'Play'}</span>
          </button>
          <button
            onClick={() => { setActiveStage(1); setIsPlaying(true); }}
            className="p-2 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
            title="Replay from Stage 1"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Horizontal Flowchart Node Track */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-2 mb-12">
        {stages.map((st, idx) => {
          const isPassed = activeStage > st.id;
          const isCurrent = activeStage === st.id;

          return (
            <React.Fragment key={st.id}>
              <div
                onClick={() => { setActiveStage(st.id); setIsPlaying(false); }}
                className={`relative flex-1 flex flex-col items-center text-center p-4 rounded-xl border transition-all duration-300 cursor-pointer min-w-[140px] ${
                  isCurrent
                    ? 'border-cyan-400 shadow-glow-cyan bg-slate-800 z-10 scale-105'
                    : isPassed
                    ? 'border-emerald-500/50 bg-slate-900/80 text-slate-300'
                    : 'border-slate-800 bg-slate-900/40 opacity-60'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border mb-3 ${
                  isCurrent ? 'bg-cyan-950 border-cyan-400 text-cyan-400' : isPassed ? 'bg-emerald-950 border-emerald-500 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-500'
                }`}>
                  {st.icon}
                </div>
                <h4 className="font-semibold text-sm text-white mb-1">Stage {st.id}: {st.name}</h4>
                <p className="text-xs text-slate-400 leading-tight">{st.layman}</p>
                <div className="mt-2 text-[10px] text-slate-500 font-mono hidden md:block tooltip-trigger">
                  Technical Details
                  <span className="tooltip-content whitespace-normal w-32">{st.desc}</span>
                </div>
              </div>

              {idx < stages.length - 1 && (
                <div className="flex items-center justify-center px-1">
                  <ChevronRight className={`w-6 h-6 ${isPassed ? 'text-emerald-500' : 'text-slate-700'}`} />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Active Stage Deep-Dive & Hex Inspector */}
      <div className="glass-panel bg-slate-900 rounded-2xl p-6 border border-slate-700/50 mb-8">
        <div className="flex flex-col lg:flex-row gap-8 items-center justify-between">
          {/* Left: Stage Visual Representation */}
          <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 bg-slate-950 rounded-xl border border-slate-800 min-h-[200px]">
            {activeStage === 1 && (
              <div className="text-center">
                <div className="flex items-center justify-center gap-4 mb-4 text-3xl">
                  <span>🖼️</span> <span className="text-slate-600">+</span> <span>📝</span> <span className="text-slate-600">+</span> <span>👤</span>
                </div>
                <p className="text-slate-300 text-sm">Gathering Image, Report, and Metadata files.</p>
              </div>
            )}
            {activeStage === 2 && (
              <div className="text-center w-full">
                <div className="text-amber-400 mb-2 font-medium">Creating Unique Passwords (Keys)</div>
                <div className="flex flex-col gap-2 w-full max-w-xs mx-auto text-xs font-mono">
                  <div className="p-2 bg-slate-900 border border-slate-700 rounded text-slate-300">Key for Image: {encryptResult?.keys_summary[0]?.key_hex.substring(0, 16) || '9f4a2b8...'}</div>
                  <div className="p-2 bg-slate-900 border border-slate-700 rounded text-slate-300">Key for Report: {encryptResult?.keys_summary[1]?.key_hex.substring(0, 16) || 'b2e71ca...'}</div>
                  <div className="p-2 bg-slate-900 border border-slate-700 rounded text-slate-300">Key for Data: {encryptResult?.keys_summary[2]?.key_hex.substring(0, 16) || '1d8c9e5...'}</div>
                </div>
              </div>
            )}
            {activeStage === 3 && (
              <div className="text-center">
                <div className="text-4xl mb-2">🔐</div>
                <p className="text-purple-300 text-sm">Locking data with AES-256 (Military-grade encryption)</p>
              </div>
            )}
            {activeStage === 4 && (
              <div className="flex flex-col items-center">
                <WaxSeal status={activeStage === 4 ? 'active' : 'intact'} size={80} label="SEALED" />
                <p className="text-emerald-400 text-sm mt-4">Applying tamper-proof mathematical seal</p>
              </div>
            )}
            {activeStage === 5 && (
              <div className="text-center">
                <div className="text-5xl mb-2">📦</div>
                <p className="text-cyan-300 font-medium text-sm">Package Ready: {encryptResult?.bundle_filename || 'secure_bundle.cryptoflow'}</p>
              </div>
            )}
          </div>

          {/* Right: Technical Inspector */}
          <div className="w-full lg:w-1/2">
            <h3 className="font-semibold text-base text-white mb-4">
              Under the Hood
            </h3>
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-slate-300 space-y-3">
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-500">Current Action:</span>
                <span className="text-cyan-400">{stages[activeStage - 1].desc}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2 tooltip-trigger">
                <span className="text-slate-500">Seal Hash (HMAC):</span>
                <span className="text-amber-400 font-mono text-xs truncate max-w-[200px]">
                  {encryptResult?.binding_hash || 'be4a130d46b3e0ff9d8c...'}
                </span>
                <span className="tooltip-content">Unique fingerprint ensuring data wasn't changed</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-500">Encryption Method:</span>
                <span className="text-slate-200">AES-256-GCM</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Unique Bundle ID:</span>
                <span className="text-purple-400 font-mono text-xs">{encryptResult?.bundle_id || '2d95abd2-b6bb-4399'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Deliverable Downloads */}
      {encryptResult && activeStage === 5 && !isPlaying && (
        <div className="glass-panel rounded-2xl p-6 border border-emerald-500/30 bg-emerald-950/20 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="font-bold text-lg text-emerald-400 mb-1">
              Done! Your data is fully secured.
            </h3>
            <p className="text-sm text-slate-300">
              You can now download the encrypted bundle and the decryption keys separately.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <a
              href={encryptResult.bundle_download_url}
              download={encryptResult.bundle_filename}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-sm transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Get Encrypted File</span>
            </a>

            <a
              href={encryptResult.keyring_download_url}
              download={encryptResult.keyring_filename}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-medium text-sm transition cursor-pointer"
            >
              <Key className="w-4 h-4" />
              <span>Get Keys</span>
            </a>

            <button
              onClick={onNavigateToDecrypt}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm border border-slate-600 transition cursor-pointer ml-2"
            >
              Next: Decrypt →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
