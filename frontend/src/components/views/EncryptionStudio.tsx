import React, { useState } from 'react';
import { Sparkles, Lock, ArrowRight, ShieldAlert, CheckCircle2, ChevronDown, ChevronUp, Image as ImageIcon } from 'lucide-react';
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
  const [showArchitectureFigure, setShowArchitectureFigure] = useState<boolean>(true);

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
    <div className="max-w-5xl mx-auto py-8">
      {/* Editorial Journal Paper Masthead */}
      <div className="mb-8 pb-6 border-b border-stone-300">
        <div className="flex items-center gap-2 mb-2">
          <span className="badge-oxford px-2 py-0.5 rounded text-[11px] font-mono font-medium">
            SECTION I • INGESTION
          </span>
          <span className="text-stone-400 text-xs">•</span>
          <span className="text-stone-500 font-serif italic text-xs">
            Protocol: RFC-AEAD-HMAC-2026
          </span>
        </div>

        <h1 className="text-2xl md:text-3xl font-serif font-bold text-stone-900 tracking-tight leading-tight">
          Heterogeneous Modality Ingestion & Cross-Modal Binding
        </h1>
        <p className="text-sm md:text-base font-serif text-stone-600 mt-2 leading-relaxed max-w-3xl">
          Medical encounters require simultaneous protection of binary diagnostic imagery, unformatted clinical notes, and structured electronic health records. This workbench normalizes disparate modalities into typed 64-byte binary envelopes and applies deterministic HMAC-SHA-256 cross-modal binding.
        </p>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-stone-200">
          <div className="flex items-center gap-3 text-xs font-mono text-stone-500">
            <span>Author: Clinical Cryptography Lab</span>
            <span>•</span>
            <span>Evaluation: NIH & RSNA Datasets</span>
          </div>

          <button
            onClick={handleLoadSample}
            disabled={loading}
            className="btn-journal-secondary px-3.5 py-1.5 text-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-700" />
            <span>Load Clinical Sample Preset</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-900 text-xs font-mono flex items-center gap-3">
          <ShieldAlert className="w-4 h-4 text-red-700 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Featured Architecture Diagram Figure (Collapsible) */}
      <div className="journal-card rounded-lg p-4 mb-8">
        <div 
          className="flex items-center justify-between cursor-pointer select-none"
          onClick={() => setShowArchitectureFigure(!showArchitectureFigure)}
        >
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-stone-700" />
            <h3 className="font-serif font-bold text-sm text-stone-900">
              Figure 1: Complete System Architecture & Cryptographic Data Flow
            </h3>
          </div>
          <button className="text-stone-500 hover:text-stone-800 text-xs flex items-center gap-1 font-sans">
            {showArchitectureFigure ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {showArchitectureFigure && (
          <div className="mt-3 pt-3 border-t border-stone-200">
            <div className="bg-stone-950 rounded-md p-2 flex justify-center overflow-hidden shadow-inner">
              <img
                src="/diagrams/architecture_overview.png"
                alt="System Architecture Overview Diagram"
                className="max-h-72 object-contain w-auto rounded"
              />
            </div>
            <p className="text-[11px] font-serif italic text-stone-600 mt-2 text-center">
              Diagram illustrates the full 5-stage transformation: heterogeneous file ingest (S1), CSPRNG key generation (S2), AES-256-GCM AEAD encryption (S3), HMAC binding hash calculation (S4), and atomic .cryptoflow container packaging (S5).
            </p>
          </div>
        )}
      </div>

      {/* 3 Modality Input Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Modality A: Medical Image / DICOM */}
        <div className="journal-card journal-card-hover rounded-lg p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded bg-stone-900 text-stone-100 font-serif font-bold text-xs flex items-center justify-center">
                  A
                </span>
                <h3 className="font-serif font-bold text-sm text-stone-900">
                  Modality A: Imaging
                </h3>
              </div>
              <span className="badge-editorial px-2 py-0.5 rounded text-[10px]">
                DICOM / 512px
              </span>
            </div>

            <DicomViewer filename={imageFilename} />

            <div className="mt-4">
              <label className="block text-[11px] font-mono text-stone-600 mb-1">
                Upload Custom Scan File (.dcm, .png, .tiff):
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
                className="w-full text-xs font-mono text-stone-600 file:mr-2.5 file:py-1 file:px-2.5 file:rounded file:border file:border-stone-300 file:text-[11px] file:font-medium file:bg-stone-100 file:text-stone-800 hover:file:bg-stone-200 cursor-pointer"
              />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-stone-200 text-[11px] font-mono text-stone-500 flex justify-between items-center">
            <span>Envelope: 64B Prefix</span>
            <span className="text-emerald-700 flex items-center gap-1 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" /> Validated
            </span>
          </div>
        </div>

        {/* Modality B: Radiology Report */}
        <div className="journal-card journal-card-hover rounded-lg p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded bg-stone-900 text-stone-100 font-serif font-bold text-xs flex items-center justify-center">
                  B
                </span>
                <h3 className="font-serif font-bold text-sm text-stone-900">
                  Modality B: Clinical Note
                </h3>
              </div>
              <span className="badge-editorial px-2 py-0.5 rounded text-[10px]">
                UTF-8 Text
              </span>
            </div>

            <label className="block text-[11px] font-mono text-stone-600 mb-1">
              Diagnostic Impression & Report:
            </label>
            <textarea
              rows={11}
              value={reportText}
              onChange={(e) => setReportText(e.target.value)}
              className="w-full bg-[#FAF9F6] border border-stone-300 focus:border-stone-600 rounded-md p-3 text-xs font-mono text-stone-800 focus:outline-none transition leading-relaxed resize-none"
              placeholder="Enter diagnostic report..."
            />
          </div>

          <div className="mt-4 pt-3 border-t border-stone-200 text-[11px] font-mono text-stone-500 flex justify-between items-center">
            <span>Size: {reportText.length} bytes</span>
            <span className="text-emerald-700 flex items-center gap-1 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" /> Validated
            </span>
          </div>
        </div>

        {/* Modality C: EHR Metadata */}
        <div className="journal-card journal-card-hover rounded-lg p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded bg-stone-900 text-stone-100 font-serif font-bold text-xs flex items-center justify-center">
                  C
                </span>
                <h3 className="font-serif font-bold text-sm text-stone-900">
                  Modality C: EHR Record
                </h3>
              </div>
              <span className="badge-editorial px-2 py-0.5 rounded text-[10px]">
                FHIR JSON
              </span>
            </div>

            <label className="block text-[11px] font-mono text-stone-600 mb-1">
              Structured Patient Demographics:
            </label>
            <textarea
              rows={11}
              value={metadataJson}
              onChange={(e) => setMetadataJson(e.target.value)}
              className="w-full bg-[#FAF9F6] border border-stone-300 focus:border-stone-600 rounded-md p-3 text-xs font-mono text-stone-800 focus:outline-none transition leading-relaxed resize-none"
              placeholder="Enter JSON attributes..."
            />
          </div>

          <div className="mt-4 pt-3 border-t border-stone-200 text-[11px] font-mono text-stone-500 flex justify-between items-center">
            <span>Size: {metadataJson.length} bytes</span>
            <span className="text-emerald-700 flex items-center gap-1 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" /> Validated
            </span>
          </div>
        </div>
      </div>

      {/* Configuration & Primary Action */}
      <div className="journal-card rounded-lg p-5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          <div>
            <label className="block text-[11px] font-mono text-stone-600 mb-1">Encounter Identifier:</label>
            <input
              type="text"
              value={bundleName}
              onChange={(e) => setBundleName(e.target.value)}
              className="bg-[#FAF9F6] border border-stone-300 focus:border-stone-700 rounded px-3 py-1.5 text-xs font-mono text-stone-900 focus:outline-none w-60"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer mt-4 md:mt-0 select-none">
            <input
              type="checkbox"
              checked={anonymize}
              onChange={(e) => setAnonymize(e.target.checked)}
              className="w-4 h-4 rounded border-stone-300 text-stone-900 focus:ring-0 cursor-pointer"
            />
            <span className="text-xs font-mono text-stone-700">De-identify PHI (HIPAA Safe Harbor)</span>
          </label>
        </div>

        <button
          onClick={handleEncrypt}
          disabled={loading}
          className="btn-journal-primary px-6 py-2.5 text-xs flex items-center gap-2 cursor-pointer w-full md:w-auto justify-center disabled:opacity-50"
        >
          <Lock className="w-3.5 h-3.5" />
          <span>{loading ? 'Encrypting & Binding...' : 'Encrypt & Seal Multimodal Bundle'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
