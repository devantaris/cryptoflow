import React, { useState } from 'react';
import { CheckCircle2, ShieldAlert, Download, Image as ImageIcon, Unlock } from 'lucide-react';
import type { DecryptResult } from '../../types';
import { decryptBundleApi } from '../../services/api';
import { WaxSeal } from '../animations/WaxSeal';

export const DecryptionInspector: React.FC = () => {
  const [bundleFile, setBundleFile] = useState<File | null>(null);
  const [keyringFile, setKeyringFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [decryptResult, setDecryptResult] = useState<DecryptResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('report');

  const handleDecrypt = async () => {
    if (!bundleFile || !keyringFile) {
      setError('Both .cryptoflow bundle and .keyring file are required.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await decryptBundleApi(bundleFile, keyringFile);
      setDecryptResult(res);
      if (!res.verified) {
        setError(res.detail || 'Tamper detected: Verification failed');
      }
    } catch (e: any) {
      setError(e.message || 'Decryption failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-6">
      {/* Header */}
      <div className="mb-7 pb-5 border-b border-zinc-800/80">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Stage 03 Verification
          </span>
          <span className="text-zinc-500 text-xs">•</span>
          <span className="text-zinc-400 text-xs font-mono">Constant-Time Cryptographic Audit</span>
        </div>
        <h1 className="text-xl md:text-2xl font-semibold text-zinc-100 tracking-tight">
          Decryption & Integrity Verification
        </h1>
        <p className="text-xs md:text-sm text-zinc-400 mt-1 max-w-2xl leading-relaxed">
          Recompute HMAC binding digests and verify 128-bit GCM authentication tags before unsealing medical payload.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-mono flex items-center gap-3">
          <ShieldAlert className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <div>
            <div className="font-semibold text-rose-200">DECRYPTION ABORTED — TAMPERING IDENTIFIED</div>
            <div className="mt-0.5 text-rose-400">{error}</div>
          </div>
        </div>
      )}

      {/* Dual Upload Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
        {/* Dropzone 1: .cryptoflow Bundle */}
        <div className="surface-card rounded-xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-zinc-800 text-zinc-300 flex items-center justify-center border border-zinc-700 text-xs font-mono font-bold">
                1
              </span>
              <h3 className="font-medium text-xs text-zinc-200 uppercase tracking-wider font-mono">
                Encrypted Bundle (.cryptoflow)
              </h3>
            </div>
            <span className="badge-neutral text-[10px] font-mono px-2 py-0.5 rounded">
              Binary Data
            </span>
          </div>

          <div className="border border-dashed border-zinc-750 hover:border-zinc-500 rounded-lg p-5 text-center transition cursor-pointer bg-zinc-950/40">
            <input
              type="file"
              accept=".cryptoflow"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setBundleFile(e.target.files[0]);
                }
              }}
              className="w-full text-xs font-mono text-zinc-400 file:mr-2.5 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-[11px] file:font-medium file:bg-zinc-800 file:text-zinc-300 hover:file:bg-zinc-700 cursor-pointer"
            />
            <p className="text-[11px] font-mono text-zinc-500 mt-2">
              {bundleFile ? `${bundleFile.name} (${(bundleFile.size / 1024).toFixed(1)} KB)` : 'Select or drop .cryptoflow file'}
            </p>
          </div>
        </div>

        {/* Dropzone 2: .keyring */}
        <div className="surface-card rounded-xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-zinc-800 text-zinc-300 flex items-center justify-center border border-zinc-700 text-xs font-mono font-bold">
                2
              </span>
              <h3 className="font-medium text-xs text-zinc-200 uppercase tracking-wider font-mono">
                Out-of-Band Keyring (.keyring)
              </h3>
            </div>
            <span className="badge-neutral text-[10px] font-mono px-2 py-0.5 rounded">
              JSON Secret
            </span>
          </div>

          <div className="border border-dashed border-zinc-750 hover:border-zinc-500 rounded-lg p-5 text-center transition cursor-pointer bg-zinc-950/40">
            <input
              type="file"
              accept=".keyring,.json"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setKeyringFile(e.target.files[0]);
                }
              }}
              className="w-full text-xs font-mono text-zinc-400 file:mr-2.5 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-[11px] file:font-medium file:bg-zinc-800 file:text-zinc-300 hover:file:bg-zinc-700 cursor-pointer"
            />
            <p className="text-[11px] font-mono text-zinc-500 mt-2">
              {keyringFile ? `${keyringFile.name} (${(keyringFile.size / 1024).toFixed(1)} KB)` : 'Select or drop .keyring file'}
            </p>
          </div>
        </div>
      </div>

      {/* Decrypt Action */}
      <div className="flex justify-center mb-6">
        <button
          onClick={handleDecrypt}
          disabled={loading || !bundleFile || !keyringFile}
          className="btn-primary px-8 py-2.5 text-xs font-medium flex items-center gap-2 cursor-pointer disabled:opacity-40"
        >
          <Unlock className="w-3.5 h-3.5" />
          <span>{loading ? 'Verifying Integrity...' : 'Verify Cryptographic Seal & Decrypt'}</span>
        </button>
      </div>

      {/* Verification Results Panel */}
      {decryptResult && decryptResult.verified && (
        <div className="surface-card rounded-xl p-5 md:p-6 mb-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-5 border-b border-zinc-800/80">
            <div className="flex items-center gap-4">
              <WaxSeal status="intact" size={60} label="AUTHENTIC" />
              <div>
                <h3 className="font-medium text-sm text-zinc-100 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Cross-Modal Invariant Validated</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Deterministic HMAC binding hash and all 3 GCM tags matched with zero plaintext compromise.
                </p>
              </div>
            </div>

            <div className="text-right font-mono text-xs text-zinc-400">
              <div>Decryption Latency: <span className="text-zinc-100 font-semibold">{(decryptResult.duration_seconds * 1000).toFixed(1)} ms</span></div>
              <div>Status: <span className="text-emerald-400 font-semibold">LOSSLESS RESTORATION</span></div>
            </div>
          </div>

          {/* Restored Modality Artifacts */}
          <div className="mt-5">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-mono text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                Restored Modalities:
              </h4>
              <div className="flex gap-1.5">
                {decryptResult.files_restored.map((f) => (
                  <button
                    key={f.filename}
                    onClick={() => setActiveTab(f.filename.includes('report') ? 'report' : f.filename.includes('meta') ? 'meta' : 'image')}
                    className={`px-3 py-1 rounded-md text-xs font-mono transition cursor-pointer ${
                      (f.filename.includes('report') && activeTab === 'report') ||
                      (f.filename.includes('meta') && activeTab === 'meta') ||
                      (f.filename.includes('.dcm') && activeTab === 'image')
                        ? 'bg-zinc-800 text-zinc-100 border border-zinc-700'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    {f.filename}
                  </button>
                ))}
              </div>
            </div>

            {/* Content Previews */}
            <div className="bg-zinc-950/80 rounded-lg p-4 border border-zinc-800 font-mono text-xs text-zinc-200">
              {decryptResult.files_restored.map((f) => {
                if (activeTab === 'report' && f.filename.includes('report')) {
                  return (
                    <div key={f.filename} className="space-y-2">
                      <div className="flex justify-between items-center pb-2 border-b border-zinc-850 text-zinc-400">
                        <span>{f.filename} ({f.size_formatted})</span>
                        <a href={f.download_url} download={f.filename} className="text-blue-400 hover:text-blue-300 flex items-center gap-1">
                          <Download className="w-3.5 h-3.5" /> Download
                        </a>
                      </div>
                      <pre className="whitespace-pre-wrap font-mono text-xs text-zinc-300 leading-relaxed">
                        {f.content_preview || 'Plaintext recovered.'}
                      </pre>
                    </div>
                  );
                }
                if (activeTab === 'meta' && f.filename.includes('meta')) {
                  return (
                    <div key={f.filename} className="space-y-2">
                      <div className="flex justify-between items-center pb-2 border-b border-zinc-850 text-zinc-400">
                        <span>{f.filename} ({f.size_formatted})</span>
                        <a href={f.download_url} download={f.filename} className="text-blue-400 hover:text-blue-300 flex items-center gap-1">
                          <Download className="w-3.5 h-3.5" /> Download
                        </a>
                      </div>
                      <pre className="whitespace-pre-wrap font-mono text-xs text-zinc-300 leading-relaxed">
                        {f.content_preview || 'JSON metadata recovered.'}
                      </pre>
                    </div>
                  );
                }
                if (activeTab === 'image' && f.filename.includes('.dcm')) {
                  return (
                    <div key={f.filename} className="flex flex-col items-center py-4 text-center">
                      <ImageIcon className="w-8 h-8 text-zinc-400 mb-2" />
                      <span className="text-zinc-200 font-semibold">{f.filename}</span>
                      <span className="text-zinc-500 text-[11px] mt-0.5">{f.size_formatted} — Byte-exact DICOM scan</span>
                      <a href={f.download_url} download={f.filename} className="mt-3 btn-secondary px-3.5 py-1.5 text-xs flex items-center gap-1.5 cursor-pointer">
                        <Download className="w-3.5 h-3.5" /> Download Restored File
                      </a>
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
