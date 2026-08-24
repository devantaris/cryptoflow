import React, { useState } from 'react';
import { Upload, FileText, User, Sparkles, Lock, ArrowRight, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { DicomViewer } from '../shared/DicomViewer';
import type { EncryptResult } from '../../types';
import { encryptBundle, generateSyntheticData } from '../../services/api';

interface EncryptionStudioProps {
  onEncryptComplete: (result: EncryptResult) => void;
  onNavigateToPipeline: () => void;
}

export const EncryptionStudio: React.FC<EncryptionStudioProps> = ({
  onEncryptComplete,
  onNavigateToPipeline,
}) => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageFilename, setImageFilename] = useState<string>('chest_ct_scan.dcm');
  const [reportText, setReportText] = useState<string>(
    'RADIOLOGY REPORT\n========================================\nPatient: Alex Rivera\nStudy: CT Chest with contrast\nDate: 2026-08-24\n\nFINDINGS:\nSuspicious mass measuring 2.3cm in lower right lobe.\n\nIMPRESSION:\nSuspicious solitary pulmonary nodule.\n\nRECOMMENDATION:\nImmediate biopsy required. Surgical consultation.\n\nSigned: Dr. Chen, MD'
  );
  const [metadataJson, setMetadataJson] = useState<string>(
    JSON.stringify(
      {
        patient_id: 'P-8842',
        name: 'Alex Rivera',
        dob: '1985-03-12',
        sex: 'M',
        blood_type: 'O+',
        allergies: ['penicillin'],
        dosage_mg: 10,
        referring_physician: 'Dr. Chen, MD',
        study_uid: '1.2.840.113619.2.55.3.283117',
      },
      null,
      2
    )
  );

  const [bundleName, setBundleName] = useState<string>('Patient_Rivera_Encounter_01');
  const [anonymize, setAnonymize] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleLoadSample = async () => {
    try {
      setLoading(true);
      const data = await generateSyntheticData(150);
      setImageFilename(data.image.filename);
      setReportText(data.report.content);
      setMetadataJson(data.metadata.raw_json);
      setBundleName(`Encounter_${data.patient_id}_${new Date().toISOString().slice(0, 10)}`);
      setError(null);
    } catch (e: any) {
      setError(e.message || 'Failed to load sample dataset');
    } finally {
      setLoading(false);
    }
  };

  const handleEncrypt = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await encryptBundle(imageFile, reportText, metadataJson, anonymize);
      onEncryptComplete(result);
      onNavigateToPipeline();
    } catch (e: any) {
      setError(e.message || 'Encryption failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-obsidian-800">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl md:text-3xl font-display font-bold text-white tracking-tight">
              Encryption Studio
            </h1>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-400 border border-cyan-800">
              Multimodal Ingest
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Bundle medical scan, textual radiology impression, and EHR metadata into an atomic, cross-bound encrypted unit.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleLoadSample}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono bg-obsidian-800 hover:bg-obsidian-700 text-slate-200 border border-obsidian-700 transition cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Load Clinical Sample Preset</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-crimson-950/80 border border-crimson-700 text-crimson-300 text-xs font-mono flex items-center gap-3">
          <ShieldAlert className="w-4 h-4 text-crimson-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 3 Modality Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Modality A: Medical Image / DICOM */}
        <div className="glass-panel rounded-2xl p-5 border border-obsidian-700 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-blue-500 opacity-80" />
          
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-cyan-500/15 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
                  <Upload className="w-4 h-4" />
                </div>
                <h3 className="font-display font-semibold text-sm text-white">Modality A: Imaging</h3>
              </div>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-900">
                DICOM / PNG
              </span>
            </div>

            <DicomViewer filename={imageFilename} />

            <div className="mt-4">
              <label className="block text-[11px] font-mono text-slate-400 mb-1.5">
                Upload Custom Scan File:
              </label>
              <input
                type="file"
                accept=".dcm,.png,.jpg,.jpeg,.tiff"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setImageFile(e.target.files[0]);
                    setImageFilename(e.target.files[0].name);
                  }
                }}
                className="w-full text-xs font-mono text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-mono file:bg-obsidian-800 file:text-cyan-400 hover:file:bg-obsidian-700 cursor-pointer"
              />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-obsidian-800 text-[10px] font-mono text-slate-500 flex justify-between">
            <span>Normalized to 64B Header</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Validated
            </span>
          </div>
        </div>

        {/* Modality B: Radiology Report */}
        <div className="glass-panel rounded-2xl p-5 border border-obsidian-700 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-yellow-500 opacity-80" />

          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center border border-amber-500/30">
                  <FileText className="w-4 h-4" />
                </div>
                <h3 className="font-display font-semibold text-sm text-white">Modality B: Report</h3>
              </div>
              <span className="text-[10px] font-mono text-amber-400 bg-amber-950 px-2 py-0.5 rounded border border-amber-900">
                Text / RTF
              </span>
            </div>

            <label className="block text-[11px] font-mono text-slate-400 mb-1.5">
              Radiology Impression & Diagnosis:
            </label>
            <textarea
              rows={11}
              value={reportText}
              onChange={(e) => setReportText(e.target.value)}
              className="w-full bg-obsidian-900/90 border border-obsidian-700 rounded-xl p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-400 transition leading-relaxed resize-none"
              placeholder="Enter clinical findings..."
            />
          </div>

          <div className="mt-4 pt-3 border-t border-obsidian-800 text-[10px] font-mono text-slate-500 flex justify-between">
            <span>Size: {reportText.length} bytes</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Validated
            </span>
          </div>
        </div>

        {/* Modality C: EHR Metadata */}
        <div className="glass-panel rounded-2xl p-5 border border-obsidian-700 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-indigo-500 opacity-80" />

          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-purple-500/15 text-purple-400 flex items-center justify-center border border-purple-500/30">
                  <User className="w-4 h-4" />
                </div>
                <h3 className="font-display font-semibold text-sm text-white">Modality C: EHR Metadata</h3>
              </div>
              <span className="text-[10px] font-mono text-purple-400 bg-purple-950 px-2 py-0.5 rounded border border-purple-900">
                JSON Schema
              </span>
            </div>

            <label className="block text-[11px] font-mono text-slate-400 mb-1.5">
              Structured Patient & Study JSON:
            </label>
            <textarea
              rows={11}
              value={metadataJson}
              onChange={(e) => setMetadataJson(e.target.value)}
              className="w-full bg-obsidian-900/90 border border-obsidian-700 rounded-xl p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-purple-400 transition leading-relaxed resize-none"
              placeholder="Enter JSON metadata..."
            />
          </div>

          <div className="mt-4 pt-3 border-t border-obsidian-800 text-[10px] font-mono text-slate-500 flex justify-between">
            <span>Size: {metadataJson.length} bytes</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Validated
            </span>
          </div>
        </div>
      </div>

      {/* Configuration & Action Bar */}
      <div className="glass-panel rounded-2xl p-6 border border-obsidian-700 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-wrap items-center gap-6 w-full md:w-auto">
          <div>
            <label className="block text-[11px] font-mono text-slate-400 mb-1">Bundle Identifier:</label>
            <input
              type="text"
              value={bundleName}
              onChange={(e) => setBundleName(e.target.value)}
              className="bg-obsidian-900 border border-obsidian-700 rounded-xl px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-cyan-400 w-64"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer mt-4 md:mt-0">
            <input
              type="checkbox"
              checked={anonymize}
              onChange={(e) => setAnonymize(e.target.checked)}
              className="w-4 h-4 rounded border-obsidian-700 bg-obsidian-900 text-cyan-500 focus:ring-0 cursor-pointer"
            />
            <span className="text-xs font-mono text-slate-300">Anonymize PHI (Strip Patient Name)</span>
          </label>
        </div>

        <button
          onClick={handleEncrypt}
          disabled={loading}
          className="w-full md:w-auto flex items-center justify-center gap-3 px-8 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-cyan-400 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-obsidian-950 font-display font-bold text-sm shadow-glow-cyan hover:scale-[1.02] transition transform cursor-pointer disabled:opacity-50"
        >
          <Lock className="w-4 h-4 stroke-[2.5]" />
          <span>{loading ? 'Executing Pipeline...' : 'Lock & Bind Multimodal Bundle'}</span>
          <ArrowRight className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
};
