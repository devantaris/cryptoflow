export type ViewType = 'landing' | 'encrypt' | 'pipeline' | 'decrypt' | 'sandbox' | 'metrics';

export interface ModalityFile {
  type: 'image' | 'text' | 'metadata';
  filename: string;
  sizeBytes: number;
  content: string | ArrayBuffer;
  previewUrl?: string;
}

export interface EncryptPayload {
  imageFile?: File | null;
  reportText: string;
  metadataJson: string;
  bundleName?: string;
  anonymize?: boolean;
}

export interface DSTMetrics {
  mass_reliable: number;
  mass_unreliable: number;
  mass_uncertain: number;
  belief_reliable: number;
  plausibility_reliable: number;
  uncertainty_interval: number;
}

export interface DELMetrics {
  alpha_reliable: number;
  alpha_unreliable: number;
  expected_reliable: number;
  expected_unreliable: number;
  epistemic_uncertainty: number;
  dirichlet_strength: number;
}

export interface FeatureVectorData {
  entropy_bits: number;
  entropy_score: number;
  size_score: number;
  format_score: number;
}

export interface ModalityAssessmentData {
  modality: string;
  present: boolean;
  dst: DSTMetrics;
  del: DELMetrics;
  features?: FeatureVectorData;
}

export interface FusionResultData {
  dst: DSTMetrics;
  del: DELMetrics;
  dst_conflict_K: number;
}

export interface TheoryComparisonData {
  reliability_agreement: boolean;
  dst_reliable_belief: number;
  del_reliable_probability: number;
  belief_difference: number;
  uncertainty_comparison: string;
  narrative: string;
}

export interface UncertaintyProfile {
  modality_assessments: ModalityAssessmentData[];
  fusion: FusionResultData;
  comparison: TheoryComparisonData;
  completeness: number;
  present_modalities: string[];
  missing_modalities: string[];
}

export interface EncryptResult {
  success: boolean;
  operation_id: string;
  bundle_id: string;
  bundle_filename: string;
  keyring_filename: string;
  bundle_download_url: string;
  keyring_download_url: string;
  metrics: {
    total_raw_bytes: number;
    bundle_size_bytes: number;
    overhead_percent: number;
    duration_seconds: number;
  };
  manifest: {
    version: number;
    bundle_id: string;
    created_at: string;
    modality_count: number;
    binding_hash: string;
    total_size: number;
    modalities: Array<{
      modality_type: string;
      original_filename: string;
      original_size: number;
      encrypted_size: number;
      offset: number;
      auth_tag: string;
      iv: string;
    }>;
    uncertainty_profile?: UncertaintyProfile;
  };
  keys_summary: Array<{
    modality: string;
    key_hex: string;
    iv_hex: string;
  }>;
  binding_hash: string;
  uncertainty?: UncertaintyProfile;
}

export interface DecryptResult {
  success: boolean;
  verified: boolean;
  integrity_status: string;
  duration_seconds: number;
  files_restored: Array<{
    filename: string;
    size_bytes: number;
    size_formatted: string;
    download_url: string;
    content_preview?: string;
  }>;
  uncertainty_profile?: UncertaintyProfile;
  error_type?: string;
  detail?: string;
}

export interface AttackResult {
  success: boolean;
  attack_type: string;
  description: string;
  detected: boolean;
  exception_raised: string;
  expected_exception: string;
  security_control_passed: boolean;
  forensic_details: string;
  timestamp: string;
}

export interface BenchmarkItem {
  size_label: string;
  raw_size_bytes: number;
  bundle_size_bytes: number;
  overhead_ratio: number;
  iterations: number;
  mean_enc_time_s: number;
  std_enc_time_s: number;
  mean_dec_time_s: number;
  std_dec_time_s: number;
  mean_enc_throughput_mb_s: number;
  mean_dec_throughput_mb_s: number;
}

export interface MetricsResponse {
  success: boolean;
  benchmarks: BenchmarkItem[];
  summary: {
    max_throughput_enc_mbps: number;
    max_throughput_dec_mbps: number;
    avg_overhead_percent: number;
  };
}
