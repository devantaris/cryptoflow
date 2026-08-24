import type { AttackResult, DecryptResult, EncryptResult, MetricsResponse } from '../types';

const API_BASE = '/api/v1';

export async function fetchHealth(): Promise<{ status: string }> {
  const res = await fetch(`${API_BASE}/health`);
  return res.json();
}

export async function generateSyntheticData(imageSizeKb = 100) {
  const res = await fetch(`${API_BASE}/generate-synthetic`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ count: 1, image_size_kb: imageSizeKb }),
  });
  if (!res.ok) throw new Error('Failed to generate synthetic data');
  return res.json();
}

export async function encryptBundle(
  imageFile: File | null,
  reportText: string,
  metadataJson: string,
  anonymize = false,
  opId?: string
): Promise<EncryptResult> {
  const formData = new FormData();
  if (imageFile) {
    formData.append('image', imageFile);
  }
  formData.append('report', reportText);
  formData.append('metadata', metadataJson);
  formData.append('anonymize', anonymize ? 'true' : 'false');
  if (opId) formData.append('operation_id', opId);

  const res = await fetch(`${API_BASE}/encrypt`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Encryption failed');
  }

  return res.json();
}

export async function decryptBundleApi(
  bundleFile: File,
  keyringFile: File,
  opId?: string
): Promise<DecryptResult> {
  const formData = new FormData();
  formData.append('bundle_file', bundleFile);
  formData.append('keyring_file', keyringFile);
  if (opId) formData.append('operation_id', opId);

  const res = await fetch(`${API_BASE}/decrypt`, {
    method: 'POST',
    body: formData,
  });

  return res.json();
}

export async function simulateAttackApi(attackType: string): Promise<AttackResult> {
  const res = await fetch(`${API_BASE}/attack/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ attack_type: attackType }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Attack simulation failed');
  }

  return res.json();
}

export async function fetchMetrics(): Promise<MetricsResponse> {
  const res = await fetch(`${API_BASE}/metrics`);
  if (!res.ok) throw new Error('Failed to fetch benchmark metrics');
  return res.json();
}
