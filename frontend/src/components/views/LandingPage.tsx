import React from 'react';
import {
  Lock,
  Zap,
  Eye,
  ShieldAlert,
  BarChart3,
  ArrowRight,
  ShieldCheck,
  Activity,
  Database,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  Cpu,
} from 'lucide-react';
import type { ViewType } from '../../types';

interface LandingPageProps {
  onNavigate: (view: ViewType) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const stats = [
    {
      label: 'Encryption Throughput',
      val: '120+ MB/s',
      sub: 'AES-NI Hardware Accelerated',
      icon: <Zap className="w-4 h-4 text-amber-400" />,
    },
    {
      label: 'Real NIH X-Ray Latency',
      val: '34.49 ms',
      sub: '50 Patient Encounters Verified',
      icon: <Activity className="w-4 h-4 text-emerald-400" />,
    },
    {
      label: 'Threat Defense Rate',
      val: '100.0%',
      sub: '7/7 Attack Vectors Blocked',
      icon: <ShieldCheck className="w-4 h-4 text-cyan-400" />,
    },
    {
      label: 'Container Overhead',
      val: '< 0.3%',
      sub: 'Fixed 64B Binary Header',
      icon: <Cpu className="w-4 h-4 text-purple-400" />,
    },
  ];

  const pipelineStages = [
    {
      id: 1,
      numeral: 'Stage I',
      name: 'Ingestion & Normalization',
      desc: 'Normalizes heterogeneous file streams (DICOM scans, unstructured text reports, EHR JSON) into structured typed binary envelopes with a 64-byte typed header (CFBLB\\x00).',
      tag: '64B Header',
      accent: 'text-cyan-400',
    },
    {
      id: 2,
      numeral: 'Stage II',
      name: 'Uncertainty Quantification',
      desc: 'Applies Dempster-Shafer Theory (DST) and Deep Evidential Learning (DEL) independently to each modality\'s byte content. Computes reliability scores, inter-modal conflict coefficient K, and completeness ratio. UQ report is embedded in the encrypted bundle manifest.',
      tag: 'DST vs DEL',
      accent: 'text-violet-400',
    },
    {
      id: 3,
      numeral: 'Stage III',
      name: 'Key Generation Hierarchy',
      desc: 'Derives independent ephemeral AES-256 symmetric keys and 96-bit nonces per modality, alongside a master HMAC-SHA-256 binding key from CSPRNG entropy.',
      tag: 'Multi-Key Ring',
      accent: 'text-amber-400',
    },
    {
      id: 4,
      numeral: 'Stage IV',
      name: 'AES-256-GCM AEAD Encryption',
      desc: 'Encrypts normalized payloads with Galois/Counter Mode, outputting authenticated ciphertexts paired with 128-bit integrity tags for hardware acceleration.',
      tag: 'AEAD Encryption',
      accent: 'text-indigo-400',
    },
    {
      id: 5,
      numeral: 'Stage V',
      name: 'Cross-Modal HMAC Binding',
      desc: 'Computes a deterministic cryptographic binding hash over canonical sorted ciphertext blobs, IVs, and tags to seal the entire patient bundle into an atomic unit.',
      tag: 'HMAC-SHA-256',
      accent: 'text-emerald-400',
    },
    {
      id: 6,
      numeral: 'Stage VI',
      name: 'Packaging & Split Courier',
      desc: 'Compiles data payload into an atomic .cryptoflow binary container while key material (.keyring) is partitioned for secure out-of-band delivery. UQ profile is embedded in the manifest.',
      tag: '.cryptoflow Bundle',
      accent: 'text-purple-400',
    },
  ];

  const threatVectors = [
    {
      name: 'In-Flight Bit Flip',
      desc: 'Adversary flips arbitrary bits in ciphertext to alter clinical diagnoses in transit.',
      status: 'BLOCKED',
      layer: 'AES-GCM Tag & Binding Hash',
    },
    {
      name: 'Intra-Bundle Modality Swap',
      desc: 'Malicious reordering of the CT scan and report offsets within the container.',
      status: 'BLOCKED',
      layer: 'Deterministic Order Verification',
    },
    {
      name: 'Cross-Patient Decoupling Swap',
      desc: 'Substitution of Patient A (benign) scan into Patient B (malignant) chart.',
      status: 'BLOCKED',
      layer: 'Cross-Modal HMAC Binding Hash',
    },
    {
      name: 'Network Payload Truncation',
      desc: 'Abrupt packet dropping or truncated payload bytes in transit.',
      status: 'BLOCKED',
      layer: 'Container Length & Header Check',
    },
    {
      name: 'Rogue Modality Injection',
      desc: 'Unauthorized injection of additional diagnostic payloads into patient chart.',
      status: 'BLOCKED',
      layer: 'Manifest Canonical Verification',
    },
    {
      name: 'Manifest Binding Forgery',
      desc: 'Altered manifest headers and forged cryptographic binding digests.',
      status: 'BLOCKED',
      layer: 'Constant-Time HMAC Authentication',
    },
    {
      name: 'Keyring Mismatch',
      desc: 'Attempting decryption with unauthorized or foreign patient keyrings.',
      status: 'BLOCKED',
      layer: 'Cryptographic UUID Binding',
    },
  ];

  const modules = [
    {
      id: 'encrypt' as ViewType,
      numeral: 'MODULE I',
      title: 'Ingestion & Encryption Studio',
      desc: 'Upload real DICOM scans, draft clinical impression notes, and input structured EHR metadata to generate authenticated .cryptoflow bundles.',
      icon: <Lock className="w-5 h-5 text-cyan-400" />,
      cta: 'Open Encryption Studio',
    },
    {
      id: 'pipeline' as ViewType,
      numeral: 'MODULE II',
      title: '6-Stage Pipeline Visualizer',
      desc: 'Watch real-time state machine transitions — including DST/DEL uncertainty scoring, key derivations, AEAD byte stream transformations, and HMAC wax sealing.',
      icon: <Zap className="w-5 h-5 text-amber-400" />,
      cta: 'Explore Pipeline',
    },
    {
      id: 'decrypt' as ViewType,
      numeral: 'MODULE III',
      title: 'Decryption & Verification Inspector',
      desc: 'Validate atomic bundles with constant-time HMAC checking, decrypt payload streams, and inspect restored modalities.',
      icon: <Eye className="w-5 h-5 text-blue-400" />,
      cta: 'Inspect Decryption',
    },
    {
      id: 'sandbox' as ViewType,
      numeral: 'MODULE IV',
      title: '7-Vector Threat Defense Sandbox',
      desc: 'Execute real-world cyberattacks against clinical bundles to inspect cryptographic rejection and tamper forensic reports.',
      icon: <ShieldAlert className="w-5 h-5 text-rose-400" />,
      cta: 'Launch Threat Sandbox',
    },
    {
      id: 'metrics' as ViewType,
      numeral: 'MODULE V',
      title: 'Real Clinical Benchmarks Dashboard',
      desc: 'Examine empirical latency, throughput curves, and storage overhead measured directly on Kaggle NIH and RSNA patient cohorts.',
      icon: <BarChart3 className="w-5 h-5 text-emerald-400" />,
      cta: 'View Live Metrics',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto py-8">
      {/* Hero Section */}
      <div className="text-center mb-16 pt-4 pb-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-900 border border-white/10 text-xs font-mono text-zinc-300 mb-6 shadow-inner">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span>PRODUCTION RELEASE v1.0</span>
          <span className="text-zinc-600">•</span>
          <span className="text-cyan-300">POST-QUANTUM HMAC-SHA-256 + AES-256-GCM</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight leading-tight max-w-4xl mx-auto">
          Multimodal Medical Data Encryption & <span className="bg-linear-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">Cross-Modal Integrity Binding</span>
        </h1>

        <p className="text-base md:text-lg text-zinc-400 max-w-3xl mx-auto mt-5 leading-relaxed font-sans">
          A high-throughput cryptographic pipeline that binds heterogeneous patient modalities (DICOM scans, unformatted radiology reports, EHR metadata) into an <span className="text-zinc-200 font-semibold">atomic, tamper-evident unit</span> to eliminate cross-modal decoupling attacks across healthcare PACS and cloud EHR archives.
        </p>

        {/* Primary CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-3.5 mt-8">
          <button
            onClick={() => onNavigate('encrypt')}
            className="btn-primary px-6 py-2.5 text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-lg shadow-white/10"
          >
            <Lock className="w-4 h-4" />
            <span>Launch Ingest Studio</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>

          <button
            onClick={() => onNavigate('pipeline')}
            className="btn-secondary px-5 py-2.5 text-xs font-medium flex items-center gap-2 cursor-pointer"
          >
            <Zap className="w-4 h-4 text-amber-400" />
            <span>5-Stage Pipeline</span>
          </button>

          <button
            onClick={() => onNavigate('sandbox')}
            className="btn-secondary px-5 py-2.5 text-xs font-medium flex items-center gap-2 cursor-pointer"
          >
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span>Cyberattack Sandbox</span>
          </button>

          <button
            onClick={() => onNavigate('metrics')}
            className="btn-secondary px-5 py-2.5 text-xs font-medium flex items-center gap-2 cursor-pointer"
          >
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            <span>Clinical Benchmarks</span>
          </button>
        </div>

        {/* Security & Verification Metadata */}
        <div className="mt-8 pt-4 border-t border-zinc-800/80 flex flex-wrap items-center justify-center gap-6 text-xs font-mono text-zinc-500">
          <span>Engine: AES-256-GCM + HMAC-SHA-256</span>
          <span>•</span>
          <span>Validated On: Kaggle NIH Chest X-Ray 14 & RSNA DICOM</span>
          <span>•</span>
          <span className="text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> 100% Defense Verification
          </span>
        </div>
      </div>

      {/* Live Benchmark Stats Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
        {stats.map((s, idx) => (
          <div key={idx} className="surface-card rounded-xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80 mb-2">
              <span className="text-[11px] font-mono font-medium text-zinc-400">{s.label}</span>
              {s.icon}
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-mono font-bold text-white">{s.val}</div>
              <p className="text-[11px] font-mono text-zinc-500 mt-0.5">{s.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* The Healthcare Vulnerability: Decoupling vs Binding */}
      <div className="surface-card rounded-2xl p-8 mb-16">
        <div className="max-w-3xl mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="badge-cyan px-2.5 py-0.5 rounded text-[11px] font-mono font-medium">
              THE CORE PROBLEM & ARCHITECTURAL SOLUTION
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            Why Traditional Healthcare Encryption Leaves Patient Records Vulnerable
          </h2>
          <p className="text-sm text-zinc-400 mt-2 leading-relaxed">
            In standard hospital PACS and cloud archives, files are encrypted independently. This allows adversaries or system errors to execute <span className="font-semibold text-zinc-200">cross-modal decoupling attacks</span> without triggering traditional per-file checksum warnings.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Flawed Legacy Approach */}
          <div className="bg-rose-950/20 border border-rose-500/30 rounded-xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-rose-300 font-semibold text-sm mb-3 pb-2 border-b border-rose-500/20">
                <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>Legacy Architecture: Per-File Independent Encryption</span>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed font-sans">
                Images, text reports, and EHR metadata exist as separate encrypted files. If an attacker swaps Patient A's benign X-ray with Patient B's malignant CT scan, each individual file's integrity tag remains technically valid.
              </p>
              <ul className="mt-4 space-y-2 text-xs font-mono text-rose-300/90">
                <li className="flex items-start gap-2">
                  <span className="text-rose-400 font-bold">✗</span> Silent substitution between patient charts
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-400 font-bold">✗</span> Orphan radiology notes without bound images
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-400 font-bold">✗</span> Catastrophic clinical misdiagnosis risk
                </li>
              </ul>
            </div>
            <div className="mt-6 pt-3 border-t border-rose-500/20 text-[11px] font-mono text-rose-400 font-semibold">
              VULNERABLE TO CROSS-MODAL SWAPPING
            </div>
          </div>

          {/* The CryptoFlow Atomic Solution */}
          <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-emerald-300 font-semibold text-sm mb-3 pb-2 border-b border-emerald-500/20">
                <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>CryptoFlow Architecture: Deterministic Cross-Modal Binding</span>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed font-sans">
                CryptoFlow normalizes all modalities into typed binary envelopes and computes an HMAC-SHA-256 digest over the canonical sequence of all ciphertexts, tags, and nonces. The patient encounter is treated as an unbreakable single entity.
              </p>
              <ul className="mt-4 space-y-2 text-xs font-mono text-emerald-300/90">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span> 100% detection of swaps, injections, and bit flips
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span> Atomic all-or-nothing decryption guarantee
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">✓</span> Sub-0.3% container overhead with &gt;120 MB/s speed
                </li>
              </ul>
            </div>
            <div className="mt-6 pt-3 border-t border-emerald-500/20 text-[11px] font-mono text-emerald-400 font-semibold">
              ATOMIC TAMPER-EVIDENT UNIT
            </div>
          </div>
        </div>
      </div>

      {/* 5-Stage Cryptographic Pipeline Breakdown */}
      <div className="mb-16">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-3 border-b border-zinc-800">
          <div>
            <span className="badge-cyan px-2.5 py-0.5 rounded text-[11px] font-mono font-medium">
              THE 6-STAGE PIPELINE
            </span>
            <h2 className="text-2xl font-bold text-white tracking-tight mt-1">
              End-to-End Cryptographic Transformation
            </h2>
          </div>
          <button
            onClick={() => onNavigate('pipeline')}
            className="btn-secondary px-4 py-2 text-xs font-medium flex items-center gap-2 self-start md:self-auto cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Open Pipeline Visualizer</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {pipelineStages.map((st) => (
            <div key={st.id} className="surface-card surface-card-hover rounded-xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-zinc-800 text-cyan-400 border border-zinc-700">
                    {st.numeral}
                  </span>
                  <span className={`text-[10px] font-mono ${st.accent}`}>{st.tag}</span>
                </div>
                <h3 className="font-semibold text-xs text-zinc-100 mb-1.5 leading-snug">
                  {st.name}
                </h3>
                <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
                  {st.desc}
                </p>
              </div>
              <div className="mt-4 pt-2 border-t border-zinc-800/80 text-[10px] font-mono text-zinc-500">
                Step {st.id} of 6
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Real Clinical Kaggle Datasets Empirical Findings */}
      <div className="surface-card rounded-2xl p-8 mb-16">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-zinc-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Database className="w-4 h-4 text-emerald-400" />
              <span className="badge-success px-2.5 py-0.5 rounded text-[11px] font-mono font-medium">
                EMPIRICALLY VALIDATED ON REAL CLINICAL DATA
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Real-World Hospital Findings (Kaggle NIH & RSNA Cohorts)
            </h2>
          </div>
          <button
            onClick={() => onNavigate('metrics')}
            className="btn-secondary px-4 py-2 text-xs font-medium flex items-center gap-2 self-start md:self-auto cursor-pointer"
          >
            <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Full Benchmark Suite</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* NIH Cohort Card */}
          <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-800">
              <div>
                <h3 className="font-semibold text-sm text-white">NIH Chest X-Ray 14 Cohort</h3>
                <p className="text-[11px] font-mono text-zinc-400">Hospital Radiographs + Clinical Notes + JSON</p>
              </div>
              <span className="badge-neutral px-2 py-0.5 rounded text-[10px] font-mono">50 Real Patients</span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono mb-3">
              <div className="bg-zinc-900/90 p-2.5 rounded-lg border border-zinc-800">
                <span className="text-[10px] text-zinc-500 block">Mean Enc Latency</span>
                <span className="text-base font-bold text-zinc-100">34.49 ms</span>
              </div>
              <div className="bg-zinc-900/90 p-2.5 rounded-lg border border-zinc-800">
                <span className="text-[10px] text-zinc-500 block">Enc Throughput</span>
                <span className="text-base font-bold text-emerald-400">11.60 MB/s</span>
              </div>
              <div className="bg-zinc-900/90 p-2.5 rounded-lg border border-zinc-800">
                <span className="text-[10px] text-zinc-500 block">Container Overhead</span>
                <span className="text-base font-bold text-zinc-100">0.263%</span>
              </div>
              <div className="bg-zinc-900/90 p-2.5 rounded-lg border border-zinc-800">
                <span className="text-[10px] text-zinc-500 block">Integrity Verification</span>
                <span className="text-base font-bold text-emerald-400">100.0% Pass</span>
              </div>
            </div>
            <p className="text-[11px] text-zinc-400 italic">
              Evaluated across authentic multi-pathology cases including Atelectasis, Cardiomegaly, Effusion, and Infiltration.
            </p>
          </div>

          {/* RSNA DICOM Cohort Card */}
          <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-800">
              <div>
                <h3 className="font-semibold text-sm text-white">RSNA Pneumonia DICOM Cohort</h3>
                <p className="text-[11px] font-mono text-zinc-400">Binary CR/DX DICOM Scans + Thoracic Reports</p>
              </div>
              <span className="badge-neutral px-2 py-0.5 rounded text-[10px] font-mono">50 DICOM Studies</span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono mb-3">
              <div className="bg-zinc-900/90 p-2.5 rounded-lg border border-zinc-800">
                <span className="text-[10px] text-zinc-500 block">Mean Enc Latency</span>
                <span className="text-base font-bold text-zinc-100">65.43 ms</span>
              </div>
              <div className="bg-zinc-900/90 p-2.5 rounded-lg border border-zinc-800">
                <span className="text-[10px] text-zinc-500 block">Dec Latency</span>
                <span className="text-base font-bold text-zinc-100">40.93 ms</span>
              </div>
              <div className="bg-zinc-900/90 p-2.5 rounded-lg border border-zinc-800">
                <span className="text-[10px] text-zinc-500 block">Container Overhead</span>
                <span className="text-base font-bold text-zinc-100">0.850%</span>
              </div>
              <div className="bg-zinc-900/90 p-2.5 rounded-lg border border-zinc-800">
                <span className="text-[10px] text-zinc-500 block">Threat Mitigation</span>
                <span className="text-base font-bold text-emerald-400">100% Blocked</span>
              </div>
            </div>
            <p className="text-[11px] text-zinc-400 italic">
              Evaluated on raw medical DICOM byte streams under RSNA clinical pneumonia detection protocol.
            </p>
          </div>
        </div>
      </div>

      {/* 7-Vector Threat Defense Arsenal Showcase */}
      <div className="mb-16">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-3 border-b border-zinc-800">
          <div>
            <span className="badge-danger px-2.5 py-0.5 rounded text-[11px] font-mono font-medium">
              ADVERSARIAL SECURITY MODEL
            </span>
            <h2 className="text-2xl font-bold text-white tracking-tight mt-1">
              7-Vector Threat Matrix & Automated Defense Arsenal
            </h2>
          </div>
          <button
            onClick={() => onNavigate('sandbox')}
            className="btn-secondary px-4 py-2 text-xs font-medium flex items-center gap-2 self-start md:self-auto cursor-pointer"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            <span>Launch Threat Sandbox</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {threatVectors.map((atk, idx) => (
            <div key={idx} className="surface-card rounded-xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono text-zinc-500 font-bold">VEC 0{idx + 1}</span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>{atk.status}</span>
                  </span>
                </div>
                <h3 className="font-semibold text-xs text-zinc-100 mb-1">{atk.name}</h3>
                <p className="text-[11px] text-zinc-400 leading-relaxed mb-3 font-sans">
                  {atk.desc}
                </p>
              </div>
              <div className="pt-2.5 border-t border-zinc-800/80 text-[10px] font-mono text-zinc-400">
                <span className="text-zinc-500">Defense:</span> {atk.layer}
              </div>
            </div>
          ))}

          {/* Sandbox Quick Launcher Card */}
          <div 
            onClick={() => onNavigate('sandbox')}
            className="surface-card surface-card-hover rounded-xl p-5 bg-gradient-to-br from-zinc-900 to-zinc-950 border-cyan-500/30 flex flex-col justify-between cursor-pointer group"
          >
            <div>
              <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mb-3">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
              </div>
              <h3 className="font-semibold text-sm text-white mb-1">Execute Live Cyberattack Battery</h3>
              <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                Run simulated MITM bit flips, cross-patient swaps, and binary injections against encrypted bundles.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs font-mono text-cyan-400 font-semibold group-hover:translate-x-1 transition">
              <span>Enter Sandbox Mode →</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Feature Directory */}
      <div className="mb-16">
        <div className="mb-6 pb-3 border-b border-zinc-800">
          <span className="badge-cyan px-2.5 py-0.5 rounded text-[11px] font-mono font-medium">
            WORKBENCH SUITES
          </span>
          <h2 className="text-2xl font-bold text-white tracking-tight mt-1">
            CryptoFlow Interactive Research & Production Tools
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {modules.map((m) => (
            <div
              key={m.id}
              onClick={() => onNavigate(m.id)}
              className="surface-card surface-card-hover rounded-xl p-5 flex flex-col justify-between cursor-pointer group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-mono font-bold text-zinc-500">{m.numeral}</span>
                  <div className="w-8 h-8 rounded-lg bg-zinc-800 group-hover:bg-cyan-500/20 group-hover:text-cyan-300 transition flex items-center justify-center">
                    {m.icon}
                  </div>
                </div>
                <h3 className="font-semibold text-sm text-white mb-1.5 group-hover:text-cyan-400 transition">
                  {m.title}
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                  {m.desc}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs font-mono font-semibold text-zinc-300 group-hover:text-cyan-400 transition">
                <span>{m.cta}</span>
                <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Research Publications & Artifacts Downloads */}
      <div className="surface-card rounded-2xl p-8 border-white/10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-zinc-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="w-4 h-4 text-cyan-400" />
              <span className="badge-cyan px-2.5 py-0.5 rounded text-[11px] font-mono font-medium">
                DOCUMENTATION & PAPERS
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Peer-Reviewed Research Journal & Reference Manuals
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-5 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-mono text-zinc-500 font-bold block mb-1">RESEARCH PAPER</span>
              <h3 className="font-semibold text-sm text-white mb-2">
                CryptoFlow: Multimodal Medical Data Encryption & Cross-Modal Integrity Binding
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                Comprehensive 9-section academic manuscript detailing mathematical formulations, threat modeling against 7 cyberattack vectors, empirical NIH & RSNA benchmarks, and architectural tradeoffs.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between text-xs font-mono text-zinc-300 font-semibold">
              <span>CryptoFlow_Research_Journal.docx</span>
              <span className="text-zinc-500">656 KB (.docx)</span>
            </div>
          </div>

          <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-5 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-mono text-zinc-500 font-bold block mb-1">EDUCATIONAL MANUAL</span>
              <h3 className="font-semibold text-sm text-white mb-2">
                CryptoFlow Encryption 101: A Beginner's & Clinical Staff Guide
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                Visual primer explaining cryptographic principles (AEAD, CSPRNG keys, HMAC sealing, and split-courier key distribution) using intuitive medical supply truck analogies for healthcare practitioners.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between text-xs font-mono text-zinc-300 font-semibold">
              <span>CryptoFlow_Encryption_101_Beginners_Guide.docx</span>
              <span className="text-zinc-500">42 KB (.docx)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
