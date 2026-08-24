import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, ChevronRight, Download, Key, Shield, FileCheck, Layers, Sparkles, ChevronDown, ChevronUp, Image as ImageIcon } from 'lucide-react';
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
  const [showFlowchartFigure, setShowFlowchartFigure] = useState<boolean>(true);

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
      numeral: 'I',
      name: 'Normalization',
      desc: 'Heterogeneous files normalized into 64-byte typed binary headers.',
      icon: <Layers className="w-4 h-4 text-blue-800" />,
      tag: 'CFBLB Header',
    },
    {
      id: 2,
      numeral: 'II',
      name: 'Key Generation',
      desc: 'CSPRNG generates 256-bit AES keys + nonces per modality and HMAC key.',
      icon: <Key className="w-4 h-4 text-amber-800" />,
      tag: 'CSPRNG Pool',
    },
    {
      id: 3,
      numeral: 'III',
      name: 'AES-GCM AEAD',
      desc: 'Hardware accelerated authenticated encryption with 128-bit MAC tags.',
      icon: <Shield className="w-4 h-4 text-indigo-800" />,
      tag: 'AES-NI Engine',
    },
    {
      id: 4,
      numeral: 'IV',
      name: 'HMAC Binding',
      desc: 'Deterministic cross-modal digest welds all blobs into an immutable unit.',
      icon: <Sparkles className="w-4 h-4 text-emerald-800" />,
      tag: 'Invariant Seal',
    },
    {
      id: 5,
      numeral: 'V',
      name: 'Packaging',
      desc: 'Assembles binary container and decouples key material out-of-band.',
      icon: <FileCheck className="w-4 h-4 text-stone-800" />,
      tag: '.cryptoflow File',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto py-8">
      {/* Masthead Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-stone-300">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="badge-oxford px-2 py-0.5 rounded text-[11px] font-mono font-medium">
              SECTION II • PIPELINE
            </span>
            <span className="text-stone-400 text-xs">•</span>
            <span className="text-stone-500 font-serif italic text-xs">
              Algorithmic Progression
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-stone-900 tracking-tight">
            5-Stage Sequential Transformation Engine
          </h1>
          <p className="text-sm font-serif text-stone-600 mt-1 max-w-2xl leading-relaxed">
            Live chronological visualization of the 5-stage transformation pipeline from raw multimodal assets to authenticated binary container.
          </p>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center gap-2 bg-[#F5F4F0] p-1 rounded-lg border border-[#E7E5E4]">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-sans font-medium text-stone-800 hover:bg-stone-200 transition cursor-pointer"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlaying ? 'Pause' : 'Play'}</span>
          </button>
          <button
            onClick={() => { setActiveStage(1); setIsPlaying(true); }}
            className="p-1.5 text-stone-600 hover:text-stone-900 rounded transition cursor-pointer"
            title="Replay from Beginning"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Embedded Flowchart Diagram Figure (Collapsible) */}
      <div className="journal-card rounded-lg p-4 mb-8">
        <div 
          className="flex items-center justify-between cursor-pointer select-none"
          onClick={() => setShowFlowchartFigure(!showFlowchartFigure)}
        >
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-stone-700" />
            <h3 className="font-serif font-bold text-sm text-stone-900">
              Figure 2: 5-Stage Encryption & Key Wrapping State Diagram
            </h3>
          </div>
          <button className="text-stone-500 hover:text-stone-800 text-xs flex items-center gap-1 font-sans">
            {showFlowchartFigure ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {showFlowchartFigure && (
          <div className="mt-3 pt-3 border-t border-stone-200">
            <div className="bg-stone-950 rounded-md p-2 flex justify-center overflow-hidden shadow-inner">
              <img
                src="/diagrams/pipeline_flowchart.png"
                alt="5-Stage Pipeline Flowchart Diagram"
                className="max-h-72 object-contain w-auto rounded"
              />
            </div>
            <p className="text-[11px] font-serif italic text-stone-600 mt-2 text-center">
              Diagram represents the internal state transitions from raw file byte streams to typed 64B headers, AES-256 ciphertexts, cross-modal HMAC digest, and packaged binary container.
            </p>
          </div>
        )}
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
              className={`journal-card rounded-lg p-3.5 transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                isCurrent
                  ? 'border-stone-900 bg-stone-50/80 shadow-sm ring-1 ring-stone-900'
                  : isPassed
                  ? 'border-stone-300 bg-white text-stone-800'
                  : 'border-stone-200 bg-[#FAF9F6] opacity-60'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-serif font-bold text-xs text-stone-900">
                    STAGE {st.numeral}
                  </span>
                  <div className="w-6 h-6 rounded bg-stone-100 border border-stone-200 flex items-center justify-center">
                    {st.icon}
                  </div>
                </div>

                <h4 className="font-serif font-bold text-xs text-stone-900 mb-1">{st.name}</h4>
                <p className="text-[10px] font-serif text-stone-600 line-clamp-2 leading-relaxed">{st.desc}</p>
              </div>

              <div className="mt-3 pt-2 border-t border-stone-200 flex items-center justify-between text-[9px] font-mono">
                <span className="text-stone-500">{st.tag}</span>
                <span className={isPassed ? 'text-emerald-800 font-bold' : 'text-stone-400'}>
                  {isCurrent ? 'ACTIVE' : isPassed ? 'COMPLETE' : 'QUEUED'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Stage Detail Inspector */}
      <div className="journal-card rounded-lg p-5 mb-8">
        <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
          {/* Left: Stage Visual */}
          <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 bg-[#FAF9F6] rounded-md border border-stone-300 min-h-[180px]">
            {activeStage === 1 && (
              <div className="flex items-center gap-2">
                <div className="p-2 bg-white border border-stone-300 rounded text-center font-mono shadow-xs">
                  <span className="text-xs text-stone-900 font-bold">DICOM</span>
                  <div className="text-[9px] text-stone-500">Image Blob</div>
                </div>
                <span className="text-stone-400 font-serif">+</span>
                <div className="p-2 bg-white border border-stone-300 rounded text-center font-mono shadow-xs">
                  <span className="text-xs text-stone-900 font-bold">Report</span>
                  <div className="text-[9px] text-stone-500">Text Blob</div>
                </div>
                <span className="text-stone-400 font-serif">+</span>
                <div className="p-2 bg-white border border-stone-300 rounded text-center font-mono shadow-xs">
                  <span className="text-xs text-stone-900 font-bold">Metadata</span>
                  <div className="text-[9px] text-stone-500">JSON Blob</div>
                </div>
                <ChevronRight className="w-4 h-4 text-stone-400 mx-1" />
                <div className="p-2 bg-blue-50 border border-blue-200 rounded text-center">
                  <span className="text-xs font-mono font-bold text-blue-900">CFBLB Header</span>
                  <div className="text-[9px] font-mono text-blue-700">64-Byte Normalized</div>
                </div>
              </div>
            )}

            {activeStage === 2 && (
              <div className="w-full">
                <div className="text-xs font-serif font-bold text-stone-800 mb-2">CSPRNG Key Derivation (256-bit AES + HMAC):</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 w-full">
                  <div className="p-2 bg-white border border-stone-300 rounded font-mono text-[11px]">
                    <span className="text-stone-500 text-[10px]">Key A (Image)</span>
                    <div className="text-stone-900 truncate font-semibold">{encryptResult?.keys_summary[0]?.key_hex || '9f4a2b...7e1a'}</div>
                  </div>
                  <div className="p-2 bg-white border border-stone-300 rounded font-mono text-[11px]">
                    <span className="text-stone-500 text-[10px]">Key B (Report)</span>
                    <div className="text-stone-900 truncate font-semibold">{encryptResult?.keys_summary[1]?.key_hex || 'b2e71c...3d9c'}</div>
                  </div>
                  <div className="p-2 bg-white border border-stone-300 rounded font-mono text-[11px]">
                    <span className="text-stone-500 text-[10px]">Key C (Meta)</span>
                    <div className="text-stone-900 truncate font-semibold">{encryptResult?.keys_summary[2]?.key_hex || '1d8c9e...5b4f'}</div>
                  </div>
                </div>
              </div>
            )}

            {activeStage === 3 && (
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white border border-stone-300 rounded text-center shadow-xs">
                  <Shield className="w-6 h-6 text-indigo-800 mx-auto mb-1" />
                  <span className="text-xs font-mono font-bold text-stone-900">AES-256-GCM</span>
                </div>
                <span className="text-stone-400 font-serif">+</span>
                <div className="p-3 bg-emerald-50 border border-emerald-300 rounded text-center">
                  <span className="text-xs font-mono font-bold text-emerald-900">128-Bit Tag</span>
                  <div className="text-[10px] font-mono text-emerald-700">AEAD MAC Authentication</div>
                </div>
              </div>
            )}

            {activeStage === 4 && (
              <WaxSeal status={activeStage === 4 ? 'active' : 'intact'} label="CROSS-MODAL SEAL" />
            )}

            {activeStage === 5 && (
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-lg bg-stone-900 text-stone-100 flex items-center justify-center text-xl mb-1 shadow-sm font-serif">
                  Ψ
                </div>
                <span className="text-xs font-serif font-bold text-stone-900">Binary Container Formed</span>
                <span className="text-[11px] font-mono text-stone-600 mt-0.5">{encryptResult?.bundle_filename || 'bundle.cryptoflow'}</span>
              </div>
            )}
          </div>

          {/* Right: Technical Inspector */}
          <div className="w-full lg:w-1/2">
            <h3 className="font-serif font-bold text-sm text-stone-900 mb-2">
              Cryptographic Invariant Parameters:
            </h3>

            <div className="bg-[#FAF9F6] border border-stone-300 rounded-md p-3 font-mono text-xs text-stone-800 space-y-2">
              <div className="flex justify-between border-b border-stone-200 pb-1.5">
                <span className="text-stone-500">Current Phase:</span>
                <span className="text-stone-900 font-bold">{stages[activeStage - 1].name}</span>
              </div>

              <div className="flex justify-between border-b border-stone-200 pb-1.5">
                <span className="text-stone-500">Binding Digest:</span>
                <span className="text-amber-900 font-bold truncate max-w-[200px]">
                  {encryptResult?.binding_hash || 'be4a130d46b3e0ff...'}
                </span>
              </div>

              <div className="flex justify-between border-b border-stone-200 pb-1.5">
                <span className="text-stone-500">Cipher Suite:</span>
                <span className="text-stone-900">AES-256-GCM + SHA256-HMAC</span>
              </div>

              <div className="flex justify-between pt-0.5">
                <span className="text-stone-500">Container UUID:</span>
                <span className="text-stone-700">{encryptResult?.bundle_id || '2d95abd2-b6bb-4399'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Deliverable Outputs */}
      {encryptResult && (
        <div className="journal-card rounded-lg p-5 border-stone-300 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-serif font-bold text-base text-stone-900 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-800" />
              <span>Multimodal Container Packaging Complete</span>
            </h3>
            <p className="text-xs font-serif text-stone-600 mt-0.5">
              Physical .cryptoflow binary artifact and separate cryptographic keyring are ready for download.
            </p>
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto">
            <a
              href={encryptResult.bundle_download_url}
              download={encryptResult.bundle_filename}
              className="btn-journal-primary px-4 py-2 text-xs flex items-center gap-1.5 cursor-pointer font-sans"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .cryptoflow</span>
            </a>

            <a
              href={encryptResult.keyring_download_url}
              download={encryptResult.keyring_filename}
              className="btn-journal-secondary px-4 py-2 text-xs flex items-center gap-1.5 cursor-pointer font-sans"
            >
              <Key className="w-3.5 h-3.5 text-amber-700" />
              <span>Download .keyring</span>
            </a>

            <button
              onClick={onNavigateToDecrypt}
              className="px-3.5 py-2 rounded bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-300 font-sans text-xs transition cursor-pointer"
            >
              Verify →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
