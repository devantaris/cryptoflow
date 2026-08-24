import React, { useState } from 'react';
import { Sparkles, Lock, ArrowRight, ShieldAlert, CheckCircle2, Info } from 'lucide-react';
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
      {/* Prominent Info Banner */}
      <div className="mb-8 p-4 rounded-xl bg-emerald-950/30 border border-emerald-900 flex items-start gap-3">
        <Info className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
        <div>
          <h2 className="text-emerald-100 font-medium mb-1">What does this page do?</h2>
          <p className="text-emerald-400/80 text-sm">
            Here you can combine three different types of patient data (Image, Text Report, and JSON Metadata) into a single, highly secure, encrypted bundle.
          </p>
        </div>
      </div>

      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-white tracking-tight">
            Encryption Studio
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Securely package multimodal medical records.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleLoadSample}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Load Sample Data</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-950/80 border border-red-900 text-red-300 text-sm flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 text-red-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 3 Modality Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Modality A: Medical Image / DICOM */}
        <div className="glass-panel bg-slate-900 rounded-2xl p-5 border border-slate-700/50 flex flex-col justify-between">
          <div>
            <div className="flex items-center mb-4 gap-3">
              <div className="w-10 h-10 rounded-full bg-cyan-950 text-cyan-400 flex items-center justify-center font-bold text-lg border border-cyan-900">
                A
              </div>
              <div>
                <h3 className="font-display font-semibold text-base text-white">Imaging Data</h3>
                <p className="text-xs text-slate-500">DICOM / PNG Files</p>
              </div>
            </div>

            <DicomViewer filename={imageFilename} />

            <div className="mt-4">
              <label className="block text-xs text-slate-400 mb-1.5">
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
                className="w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-slate-800 file:text-cyan-400 hover:file:bg-slate-700 cursor-pointer"
              />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-xs text-slate-500 flex justify-between">
            <span className="tooltip-trigger">
              Header size: 64B
              <span className="tooltip-content">Standardized binary header for routing</span>
            </span>
            <span className="text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Validated
            </span>
          </div>
        </div>

        {/* Modality B: Radiology Report */}
        <div className="glass-panel bg-slate-900 rounded-2xl p-5 border border-slate-700/50 flex flex-col justify-between">
          <div>
            <div className="flex items-center mb-4 gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-950 text-amber-400 flex items-center justify-center font-bold text-lg border border-amber-900">
                B
              </div>
              <div>
                <h3 className="font-display font-semibold text-base text-white">Clinical Report</h3>
                <p className="text-xs text-slate-500">Text Notes</p>
              </div>
            </div>

            <label className="block text-xs text-slate-400 mb-1.5">
              Radiology Impression & Diagnosis:
            </label>
            <textarea
              rows={11}
              value={reportText}
              onChange={(e) => setReportText(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-amber-400 transition leading-relaxed resize-none"
              placeholder="Enter clinical findings..."
            />
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-xs text-slate-500 flex justify-between">
            <span>Size: {reportText.length} bytes</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Validated
            </span>
          </div>
        </div>

        {/* Modality C: EHR Metadata */}
        <div className="glass-panel bg-slate-900 rounded-2xl p-5 border border-slate-700/50 flex flex-col justify-between">
          <div>
            <div className="flex items-center mb-4 gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-950 text-purple-400 flex items-center justify-center font-bold text-lg border border-purple-900">
                C
              </div>
              <div>
                <h3 className="font-display font-semibold text-base text-white">Patient Metadata</h3>
                <p className="text-xs text-slate-500">Structured JSON</p>
              </div>
            </div>

            <label className="block text-xs text-slate-400 mb-1.5">
              Structured EHR Details:
            </label>
            <textarea
              rows={11}
              value={metadataJson}
              onChange={(e) => setMetadataJson(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm font-mono text-slate-200 focus:outline-none focus:border-purple-400 transition leading-relaxed resize-none"
              placeholder="Enter JSON metadata..."
            />
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-xs text-slate-500 flex justify-between">
            <span>Size: {metadataJson.length} bytes</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Validated
            </span>
          </div>
        </div>
      </div>

      {/* Configuration & Action Bar */}
      <div className="glass-panel bg-slate-900 rounded-2xl p-6 border border-slate-700/50 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-wrap items-center gap-6 w-full md:w-auto">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Bundle Name (Identifier):</label>
            <input
              type="text"
              value={bundleName}
              onChange={(e) => setBundleName(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400 w-64"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer mt-4 md:mt-0">
            <input
              type="checkbox"
              checked={anonymize}
              onChange={(e) => setAnonymize(e.target.checked)}
              className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0 cursor-pointer"
            />
            <span className="text-sm text-slate-300">Remove Patient Names (Anonymize)</span>
          </label>
        </div>

        <button
          onClick={handleEncrypt}
          disabled={loading}
          className="w-full md:w-auto flex items-center justify-center gap-3 px-8 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-sm transition cursor-pointer disabled:opacity-50"
        >
          <Lock className="w-4 h-4" />
          <span>{loading ? 'Encrypting Data...' : 'Encrypt & Package Bundle'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
