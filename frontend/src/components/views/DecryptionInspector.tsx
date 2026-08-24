import React, { useState } from 'react';
import { Upload, Key, CheckCircle2, ShieldAlert, Download, Image as ImageIcon, Unlock } from 'lucide-react';
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
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8 pb-6 border-b border-obsidian-800">
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl md:text-3xl font-display font-bold text-white tracking-tight">
            Decryption & Integrity Inspector
          </h1>
          <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800">
            Constant-Time Verification
          </span>
        </div>
        <p className="text-sm text-slate-400 mt-1">
          Upload an encrypted bundle and separate keyring to verify cross-modal integrity and restore patient records.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-crimson-950/80 border border-crimson-700 text-crimson-300 text-xs font-mono flex items-center gap-3 animate-alarm-pulse">
          <ShieldAlert className="w-5 h-5 text-crimson-400 flex-shrink-0" />
          <div>
            <div className="font-bold text-crimson-200">DECRYPTION BLOCKED / TAMPER DETECTED</div>
            <div className="mt-0.5">{error}</div>
          </div>
        </div>
      )}

      {/* Dual Upload Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Dropzone 1: .cryptoflow Bundle */}
        <div className="glass-panel rounded-2xl p-6 border border-obsidian-700 relative">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
                <Upload className="w-4 h-4" />
              </div>
              <h3 className="font-display font-semibold text-sm text-white">1. Encrypted Bundle</h3>
            </div>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-900">
              .cryptoflow
            </span>
          </div>

          <div className="border-2 border-dashed border-obsidian-700 hover:border-cyan-500/60 rounded-xl p-6 text-center transition cursor-pointer bg-obsidian-950/40">
            <input
              type="file"
              accept=".cryptoflow"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setBundleFile(e.target.files[0]);
                }
              }}
              className="w-full text-xs font-mono text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-mono file:bg-obsidian-800 file:text-cyan-400 cursor-pointer"
            />
            <p className="text-[11px] font-mono text-slate-500 mt-2">
              {bundleFile ? `Selected: ${bundleFile.name} (${(bundleFile.size / 1024).toFixed(1)} KB)` : 'Drop .cryptoflow bundle file here'}
            </p>
          </div>
        </div>

        {/* Dropzone 2: .keyring Key Material */}
        <div className="glass-panel rounded-2xl p-6 border border-obsidian-700 relative">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center border border-amber-500/30">
                <Key className="w-4 h-4" />
              </div>
              <h3 className="font-display font-semibold text-sm text-white">2. Secret Key Material</h3>
            </div>
            <span className="text-[10px] font-mono text-amber-400 bg-amber-950 px-2 py-0.5 rounded border border-amber-900">
              .keyring (JSON)
            </span>
          </div>

          <div className="border-2 border-dashed border-obsidian-700 hover:border-amber-500/60 rounded-xl p-6 text-center transition cursor-pointer bg-obsidian-950/40">
            <input
              type="file"
              accept=".keyring,.json"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setKeyringFile(e.target.files[0]);
                }
              }}
              className="w-full text-xs font-mono text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-mono file:bg-obsidian-800 file:text-amber-400 cursor-pointer"
            />
            <p className="text-[11px] font-mono text-slate-500 mt-2">
              {keyringFile ? `Selected: ${keyringFile.name} (${(keyringFile.size / 1024).toFixed(1)} KB)` : 'Drop .keyring JSON key file here'}
            </p>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="flex justify-center mb-8">
        <button
          onClick={handleDecrypt}
          disabled={loading || !bundleFile || !keyringFile}
          className="flex items-center gap-3 px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-obsidian-950 font-display font-bold text-sm shadow-glow-emerald hover:scale-105 transition transform cursor-pointer disabled:opacity-40"
        >
          <Unlock className="w-4 h-4 stroke-[2.5]" />
          <span>{loading ? 'Verifying Integrity & Decrypting...' : 'Verify Wax Seal & Decrypt Bundle'}</span>
        </button>
      </div>

      {/* Verification Results Panel */}
      {decryptResult && decryptResult.verified && (
        <div className="glass-panel rounded-2xl p-6 border border-emerald-500/50 bg-emerald-950/10 mb-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-obsidian-800">
            <div className="flex items-center gap-4">
              <WaxSeal status="intact" size={70} label="SEAL VERIFIED" />
              <div>
                <h3 className="font-display font-bold text-lg text-white flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span>Cross-Modal Integrity 100% Authentic</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  HMAC-SHA-256 cross-modal binding hash and all 3 GCM authentication tags verified in constant time.
                </p>
              </div>
            </div>

            <div className="text-right font-mono text-xs text-slate-400">
              <div>Decryption Latency: <span className="text-cyan-400 font-bold">{(decryptResult.duration_seconds * 1000).toFixed(1)} ms</span></div>
              <div>Status: <span className="text-emerald-400 font-bold">LOSSLESS RESTORE</span></div>
            </div>
          </div>

          {/* Restored Files Preview */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-display font-semibold text-sm text-white">Restored Modality Artifacts:</h4>
              <div className="flex gap-2">
                {decryptResult.files_restored.map((f) => (
                  <button
                    key={f.filename}
                    onClick={() => setActiveTab(f.filename.includes('report') ? 'report' : f.filename.includes('meta') ? 'meta' : 'image')}
                    className={`px-3 py-1 rounded-lg text-xs font-mono transition cursor-pointer ${
                      (f.filename.includes('report') && activeTab === 'report') ||
                      (f.filename.includes('meta') && activeTab === 'meta') ||
                      (f.filename.includes('.dcm') && activeTab === 'image')
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : 'bg-obsidian-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    {f.filename}
                  </button>
                ))}
              </div>
            </div>

            {/* Content Previews */}
            <div className="bg-obsidian-950 rounded-xl p-4 border border-obsidian-800 font-mono text-xs text-slate-200">
              {decryptResult.files_restored.map((f) => {
                if (activeTab === 'report' && f.filename.includes('report')) {
                  return (
                    <div key={f.filename} className="space-y-3">
                      <div className="flex justify-between items-center pb-2 border-b border-obsidian-800 text-slate-500">
                        <span>{f.filename} ({f.size_formatted})</span>
                        <a href={f.download_url} download={f.filename} className="text-cyan-400 flex items-center gap-1 hover:underline">
                          <Download className="w-3.5 h-3.5" /> Download
                        </a>
                      </div>
                      <pre className="whitespace-pre-wrap font-mono text-xs text-slate-300 leading-relaxed">
                        {f.content_preview || 'Plaintext recovered successfully.'}
                      </pre>
                    </div>
                  );
                }
                if (activeTab === 'meta' && f.filename.includes('meta')) {
                  return (
                    <div key={f.filename} className="space-y-3">
                      <div className="flex justify-between items-center pb-2 border-b border-obsidian-800 text-slate-500">
                        <span>{f.filename} ({f.size_formatted})</span>
                        <a href={f.download_url} download={f.filename} className="text-cyan-400 flex items-center gap-1 hover:underline">
                          <Download className="w-3.5 h-3.5" /> Download
                        </a>
                      </div>
                      <pre className="whitespace-pre-wrap font-mono text-xs text-purple-300 leading-relaxed">
                        {f.content_preview || 'JSON metadata recovered.'}
                      </pre>
                    </div>
                  );
                }
                if (activeTab === 'image' && f.filename.includes('.dcm')) {
                  return (
                    <div key={f.filename} className="flex flex-col items-center py-4 text-center">
                      <ImageIcon className="w-12 h-12 text-cyan-400 mb-2 opacity-80" />
                      <span className="text-white font-bold">{f.filename}</span>
                      <span className="text-slate-500 text-[11px] mt-1">{f.size_formatted} — Byte-for-byte exact DICOM payload</span>
                      <a href={f.download_url} download={f.filename} className="mt-4 px-4 py-2 bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 rounded-xl text-xs flex items-center gap-2 hover:bg-cyan-500/30">
                        <Download className="w-3.5 h-3.5" /> Download Restored DICOM File
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
