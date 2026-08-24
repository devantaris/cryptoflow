import React, { useState } from 'react';
import { Sparkles, Lock, ArrowRight, ShieldAlert, CheckCircle2 } from 'lucide-react';
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
    <div className="max-w-6xl mx-auto py-6">
      {/* Top Banner / Hero */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-7 pb-5 border-b border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Stage 01 Ingest
            </span>
            <span className="text-zinc-500 text-xs">•</span>
            <span className="text-zinc-400 text-xs font-mono">Heterogeneous Multimodal Packaging</span>
          </div>
          <h1 className="text-xl md:text-2xl font-semibold text-zinc-100 tracking-tight">
            Encryption Studio
          </h1>
          <p className="text-xs md:text-sm text-zinc-400 mt-1 max-w-2xl leading-relaxed">
            Configure disparate medical data modalities into an atomic, tamper-evident container with deterministic cross-modal cryptographic binding.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <button
            onClick={handleLoadSample}
            disabled={loading}
            className="btn-secondary px-3.5 py-2 text-xs font-medium flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Load Clinical Sample</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-mono flex items-center gap-3">
          <ShieldAlert className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 3 Modality Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        {/* Modality A: Medical Image / DICOM */}
        <div className="surface-card surface-card-hover rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-zinc-800 text-zinc-300 text-[10px] font-mono font-bold flex items-center justify-center border border-zinc-700">
                  A
                </span>
                <h3 className="font-medium text-xs text-zinc-200 uppercase tracking-wider font-mono">
                  Radiology Imaging
                </h3>
              </div>
              <span className="badge-neutral text-[10px] font-mono px-2 py-0.5 rounded">
                DICOM / 512px
              </span>
            </div>

            <DicomViewer filename={imageFilename} />

            <div className="mt-3.5">
              <label className="block text-[11px] font-mono text-zinc-400 mb-1.5">
                Custom Scan Upload:
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
                className="w-full text-xs font-mono text-zinc-400 file:mr-2.5 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-[11px] file:font-medium file:bg-zinc-800 file:text-zinc-300 hover:file:bg-zinc-700 cursor-pointer"
              />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-800/80 text-[11px] font-mono text-zinc-500 flex justify-between items-center">
            <span>64-Byte Normalization</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Validated
            </span>
          </div>
        </div>

        {/* Modality B: Radiology Report */}
        <div className="surface-card surface-card-hover rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-zinc-800 text-zinc-300 text-[10px] font-mono font-bold flex items-center justify-center border border-zinc-700">
                  B
                </span>
                <h3 className="font-medium text-xs text-zinc-200 uppercase tracking-wider font-mono">
                  Clinical Impression
                </h3>
              </div>
              <span className="badge-neutral text-[10px] font-mono px-2 py-0.5 rounded">
                UTF-8 Text
              </span>
            </div>

            <label className="block text-[11px] font-mono text-zinc-400 mb-1.5">
              Diagnostic Findings & Summary:
            </label>
            <textarea
              rows={10}
              value={reportText}
              onChange={(e) => setReportText(e.target.value)}
              className="w-full bg-zinc-950/70 border border-zinc-800 focus:border-zinc-600 rounded-lg p-3 text-xs font-mono text-zinc-200 focus:outline-none transition leading-relaxed resize-none"
              placeholder="Enter clinical report..."
            />
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-800/80 text-[11px] font-mono text-zinc-500 flex justify-between items-center">
            <span>Payload: {reportText.length} bytes</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Validated
            </span>
          </div>
        </div>

        {/* Modality C: EHR Metadata */}
        <div className="surface-card surface-card-hover rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-zinc-800 text-zinc-300 text-[10px] font-mono font-bold flex items-center justify-center border border-zinc-700">
                  C
                </span>
                <h3 className="font-medium text-xs text-zinc-200 uppercase tracking-wider font-mono">
                  EHR Demographics
                </h3>
              </div>
              <span className="badge-neutral text-[10px] font-mono px-2 py-0.5 rounded">
                FHIR JSON
              </span>
            </div>

            <label className="block text-[11px] font-mono text-zinc-400 mb-1.5">
              Structured Patient Attributes:
            </label>
            <textarea
              rows={10}
              value={metadataJson}
              onChange={(e) => setMetadataJson(e.target.value)}
              className="w-full bg-zinc-950/70 border border-zinc-800 focus:border-zinc-600 rounded-lg p-3 text-xs font-mono text-zinc-200 focus:outline-none transition leading-relaxed resize-none"
              placeholder="Enter JSON metadata..."
            />
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-800/80 text-[11px] font-mono text-zinc-500 flex justify-between items-center">
            <span>Schema: {metadataJson.length} bytes</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Validated
            </span>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="surface-card rounded-xl p-4 md:p-5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          <div>
            <label className="block text-[11px] font-mono text-zinc-400 mb-1">Bundle Descriptor</label>
            <input
              type="text"
              value={bundleName}
              onChange={(e) => setBundleName(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 focus:border-zinc-600 rounded-md px-3 py-1.5 text-xs font-mono text-zinc-100 focus:outline-none w-56"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer mt-4 md:mt-0 select-none">
            <input
              type="checkbox"
              checked={anonymize}
              onChange={(e) => setAnonymize(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-zinc-700 bg-zinc-900 text-blue-500 focus:ring-0 cursor-pointer"
            />
            <span className="text-xs font-mono text-zinc-300">Anonymize PHI Fields</span>
          </label>
        </div>

        <button
          onClick={handleEncrypt}
          disabled={loading}
          className="btn-primary px-6 py-2.5 text-xs font-medium flex items-center gap-2 cursor-pointer w-full md:w-auto justify-center disabled:opacity-50"
        >
          <Lock className="w-3.5 h-3.5" />
          <span>{loading ? 'Encrypting & Binding...' : 'Encrypt & Seal Bundle'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
