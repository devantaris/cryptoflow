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
    <div className="max-w-5xl mx-auto py-8">
      {/* Header */}
      <div className="mb-8 pb-6 border-b border-stone-300">
        <div className="flex items-center gap-2 mb-2">
          <span className="badge-oxford px-2 py-0.5 rounded text-[11px] font-mono font-medium">
            SECTION III • VERIFICATION
          </span>
          <span className="text-stone-400 text-xs">•</span>
          <span className="text-stone-500 font-serif italic text-xs">
            Constant-Time Authenticated Unsealing
          </span>
        </div>
        <h1 className="text-2xl md:text-3xl font-serif font-bold text-stone-900 tracking-tight">
          Decryption & Cross-Modal Integrity Inspection
        </h1>
        <p className="text-sm font-serif text-stone-600 mt-1 max-w-2xl leading-relaxed">
          Provide the sealed .cryptoflow binary container and separate .keyring file to mathematically verify the HMAC cross-modal invariant and AEAD tags prior to clinical payload extraction.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-900 text-xs font-mono flex items-center gap-3">
          <ShieldAlert className="w-4 h-4 text-red-700 flex-shrink-0" />
          <div>
            <div className="font-bold text-red-900">DECRYPTION ABORTED — INTEGRITY BREACH IDENTIFIED</div>
            <div className="mt-0.5 text-red-700">{error}</div>
          </div>
        </div>
      )}

      {/* Dual Upload Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Dropzone 1: .cryptoflow Bundle */}
        <div className="journal-card rounded-lg p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-stone-200">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-stone-900 text-stone-100 font-serif font-bold text-xs flex items-center justify-center">
                1
              </span>
              <h3 className="font-serif font-bold text-sm text-stone-900">
                1. Sealed Bundle (.cryptoflow)
              </h3>
            </div>
            <span className="badge-editorial text-[10px] px-2 py-0.5 rounded">
              Ciphertext Binary
            </span>
          </div>

          <div className="border border-dashed border-stone-300 hover:border-stone-500 rounded p-6 text-center transition cursor-pointer bg-[#FAF9F6]">
            <input
              type="file"
              accept=".cryptoflow"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setBundleFile(e.target.files[0]);
                }
              }}
              className="w-full text-xs font-mono text-stone-600 file:mr-2.5 file:py-1 file:px-2.5 file:rounded file:border file:border-stone-300 file:text-[11px] file:font-medium file:bg-stone-100 file:text-stone-800 hover:file:bg-stone-200 cursor-pointer"
            />
            <p className="text-[11px] font-mono text-stone-500 mt-2">
              {bundleFile ? `${bundleFile.name} (${(bundleFile.size / 1024).toFixed(1)} KB)` : 'Drop .cryptoflow bundle file here'}
            </p>
          </div>
        </div>

        {/* Dropzone 2: .keyring */}
        <div className="journal-card rounded-lg p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-stone-200">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-stone-900 text-stone-100 font-serif font-bold text-xs flex items-center justify-center">
                2
              </span>
              <h3 className="font-serif font-bold text-sm text-stone-900">
                2. Out-of-Band Keyring (.keyring)
              </h3>
            </div>
            <span className="badge-editorial text-[10px] px-2 py-0.5 rounded">
              JSON Key Material
            </span>
          </div>

          <div className="border border-dashed border-stone-300 hover:border-stone-500 rounded p-6 text-center transition cursor-pointer bg-[#FAF9F6]">
            <input
              type="file"
              accept=".keyring,.json"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setKeyringFile(e.target.files[0]);
                }
              }}
              className="w-full text-xs font-mono text-stone-600 file:mr-2.5 file:py-1 file:px-2.5 file:rounded file:border file:border-stone-300 file:text-[11px] file:font-medium file:bg-stone-100 file:text-stone-800 hover:file:bg-stone-200 cursor-pointer"
            />
            <p className="text-[11px] font-mono text-stone-500 mt-2">
              {keyringFile ? `${keyringFile.name} (${(keyringFile.size / 1024).toFixed(1)} KB)` : 'Drop .keyring JSON file here'}
            </p>
          </div>
        </div>
      </div>

      {/* Decrypt Action */}
      <div className="flex justify-center mb-8">
        <button
          onClick={handleDecrypt}
          disabled={loading || !bundleFile || !keyringFile}
          className="btn-journal-primary px-8 py-2.5 text-xs flex items-center gap-2 cursor-pointer disabled:opacity-40"
        >
          <Unlock className="w-3.5 h-3.5" />
          <span>{loading ? 'Verifying Integrity Digest...' : 'Verify Wax Seal & Extract Multimodal Encounter'}</span>
        </button>
      </div>

      {/* Verification Results Panel */}
      {decryptResult && decryptResult.verified && (
        <div className="journal-card rounded-lg p-6 mb-8 border-emerald-300 bg-emerald-50/20">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-5 border-b border-stone-300">
            <div className="flex items-center gap-4">
              <WaxSeal status="intact" label="SEAL AUTHENTIC" />
              <div>
                <h3 className="font-serif font-bold text-base text-stone-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-800" />
                  <span>Cross-Modal Invariant Validated (100% Authentic)</span>
                </h3>
                <p className="text-xs font-serif text-stone-600 mt-0.5">
                  Constant-time HMAC-SHA-256 cross-modal binding hash and all 3 GCM authentication tags verified successfully.
                </p>
              </div>
            </div>

            <div className="text-right font-mono text-xs text-stone-600">
              <div>Decryption Latency: <span className="text-stone-900 font-bold">{(decryptResult.duration_seconds * 1000).toFixed(1)} ms</span></div>
              <div>Integrity Status: <span className="text-emerald-800 font-bold">BYTE-PERFECT RESTORATION</span></div>
            </div>
          </div>

          {/* Restored Modalities Tabs */}
          <div className="mt-5">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-serif font-bold text-sm text-stone-900">
                Restored Modality Artifacts:
              </h4>
              <div className="flex gap-1.5">
                {decryptResult.files_restored.map((f) => (
                  <button
                    key={f.filename}
                    onClick={() => setActiveTab(f.filename.includes('report') ? 'report' : f.filename.includes('meta') ? 'meta' : 'image')}
                    className={`px-3 py-1 rounded text-xs font-mono transition cursor-pointer ${
                      (f.filename.includes('report') && activeTab === 'report') ||
                      (f.filename.includes('meta') && activeTab === 'meta') ||
                      (f.filename.includes('.dcm') && activeTab === 'image')
                        ? 'bg-stone-900 text-stone-100 font-medium'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    {f.filename}
                  </button>
                ))}
              </div>
            </div>

            {/* Content Previews */}
            <div className="bg-white rounded-md p-4 border border-stone-300 font-mono text-xs text-stone-800 shadow-xs">
              {decryptResult.files_restored.map((f) => {
                if (activeTab === 'report' && f.filename.includes('report')) {
                  return (
                    <div key={f.filename} className="space-y-2">
                      <div className="flex justify-between items-center pb-2 border-b border-stone-200 text-stone-500">
                        <span>{f.filename} ({f.size_formatted})</span>
                        <a href={f.download_url} download={f.filename} className="text-blue-700 hover:underline flex items-center gap-1 font-sans">
                          <Download className="w-3.5 h-3.5" /> Download Plaintext
                        </a>
                      </div>
                      <pre className="whitespace-pre-wrap font-mono text-xs text-stone-800 leading-relaxed">
                        {f.content_preview || 'Plaintext recovered successfully.'}
                      </pre>
                    </div>
                  );
                }
                if (activeTab === 'meta' && f.filename.includes('meta')) {
                  return (
                    <div key={f.filename} className="space-y-2">
                      <div className="flex justify-between items-center pb-2 border-b border-stone-200 text-stone-500">
                        <span>{f.filename} ({f.size_formatted})</span>
                        <a href={f.download_url} download={f.filename} className="text-blue-700 hover:underline flex items-center gap-1 font-sans">
                          <Download className="w-3.5 h-3.5" /> Download JSON
                        </a>
                      </div>
                      <pre className="whitespace-pre-wrap font-mono text-xs text-stone-800 leading-relaxed">
                        {f.content_preview || 'JSON metadata recovered.'}
                      </pre>
                    </div>
                  );
                }
                if (activeTab === 'image' && f.filename.includes('.dcm')) {
                  return (
                    <div key={f.filename} className="flex flex-col items-center py-4 text-center">
                      <ImageIcon className="w-10 h-10 text-stone-500 mb-2" />
                      <span className="text-stone-900 font-serif font-bold">{f.filename}</span>
                      <span className="text-stone-500 text-[11px] mt-0.5">{f.size_formatted} — Byte-for-byte authentic DICOM payload</span>
                      <a href={f.download_url} download={f.filename} className="mt-3 btn-journal-secondary px-4 py-1.5 text-xs flex items-center gap-1.5 cursor-pointer">
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
