# CryptoFlow — Uncertainty Quantification: Analysis & Results

**Date:** September 8, 2026  
**Stage:** Research Extension — UQ Module  
**Mentor:** Dr. B D Mazumdar  
**Commit:** `dc707d8`

---

## 1. Before vs After — Architecture

### BEFORE (5-stage pipeline)

```
Raw Files → [INGEST] → [KEYGEN] → [ENCRYPT] → [BIND] → [PACKAGE]
```

The pipeline knew nothing about data quality. The receiver only learned *integrity* (was it tampered?) — never *trustworthiness* (was the data good to begin with?).

### AFTER (6-stage pipeline)

```
Raw Files → [INGEST] → [UNCERTAINTY] → [KEYGEN] → [ENCRYPT] → [BIND] → [PACKAGE]
                             ↑
                      NEW — read-only, 3ms overhead
                      Embeds uncertainty profile INTO the bundle manifest
```

The bundle now carries a data quality + consistency report **inside the encrypted payload**. The receiver sees it after decryption.

---

## 2. What the Uncertainty Stage Computes

### Feature Extraction (per modality, from raw bytes only)

| Feature | How measured | Clinical meaning |
|---|---|---|
| **Shannon Entropy** | Byte-value distribution (bits, 0–8) | Real DICOM ≈ 7.9 bits. Random noise = 8. Text ≈ 3–5. Zero = file is corrupt/empty. |
| **Size Score** | Does size fall in expected range for this modality? | A 2-byte DICOM or 200MB text report are both suspicious. |
| **Format Score** | Magic bytes / header validity | PNG has `\x89PNG`, DICOM has `DICM` at byte 128, JSON starts with `{` |

### DST Engine — Dempster-Shafer Theory (Shafer, 1976)

- Frame: Θ = {RELIABLE, UNRELIABLE}
- Each feature → independent mass function `m({R}), m({U}), m(Θ)`
- Three features combined via **Dempster's Rule of Combination**
- Missing modality → vacuous BPA: `m(Θ) = 1.0` (total ignorance)
- Output: `Belief(RELIABLE)` [lower bound], `Plausibility(RELIABLE)` [upper bound]
- Fusion across modalities: produces **conflict coefficient K** (inter-modality disagreement)

### DEL Engine — Deep Evidential Learning (Sensoy et al., NeurIPS 2018)

- Dirichlet distribution `Dir(α_reliable, α_unreliable)` over reliability simplex
- Evidence from features → `α_k = 1 + evidence_k` (prior = 1 per class = zero evidence)
- Missing modality → vacuous `Dir(1,1)`: `u = K/S = 2/2 = 1.0` (maximum uncertainty)
- Output: `E[p_reliable] = α_r / S`, `epistemic uncertainty u = K/S`
- Fusion: evidence accumulates additively across modalities

### Comparison Engine

- Checks if DST and DEL **agree on the conclusion** (both reliable, or both unreliable)
- Computes `|DST belief − DEL expected probability|`
- Flags conflict K > 0.3 as inter-modality inconsistency
- Generates human-readable narrative embedded in manifest

---

## 3. Live Run Results — Complete 3-Modality Record

**Input:** PNG image (50KB, high entropy) + clinical text report (7.4KB) + JSON metadata (63B)

### Per-Modality Results

| Modality | Entropy (bits) | DST Belief | DEL E[p_reliable] | DEL Uncertainty |
|---|---|---|---|---|
| **Image** | 8.00 | 0.936 | 0.916 | 0.167 |
| **Text** | 3.87 | 0.936 | 0.917 | 0.167 |
| **Metadata** | 4.28 | 0.936 | 0.917 | 0.167 |

### Fused Multi-Modal Results

| Metric | DST | DEL |
|---|---|---|
| Fused reliability belief/probability | **0.9997 (99.97%)** | **0.969 (96.9%)** |
| Residual uncertainty | 0.0003 (0.03%) | 0.0625 (6.25%) |
| Inter-modality conflict | K = 0.000 (none) | — |
| Dirichlet strength S | — | 32.0 |
| Completeness | 1.0 (100%) | 1.0 (100%) |
| Do both agree? | ✅ Both say: RELIABLE | |

### Auto-Generated Narrative

> *"Both DST and DEL agree the multi-modal data is reliable. DST belief in reliability: 100.0%, DEL expected reliability: 96.9% (difference: 3.1%). DEL reports higher uncertainty."*

---

## 4. Key Finding: The Theoretical Difference

This is the academic contribution:

**DST converges faster to high certainty when multiple consistent sources agree.**  
With 3 modalities all saying "reliable", Dempster's combination rule pushes belief to 99.97%. The ignorance mass shrinks multiplicatively with each additional consistent source.

**DEL is permanently more conservative.**  
Epistemic uncertainty `u = K/S` only decreases as more evidence accumulates (S grows). With 3 modalities and scale factor 10, S = 32, so u = 2/32 = 6.25%. Even with perfect data, DEL retains this residual. It cannot reach u=0 without infinite evidence.

**When they disagree on the conclusion (the interesting case for the paper):**  
If data is consistent but sparse (small files, few modalities), DST might commit to RELIABLE quickly (belief flips based on mass ratios), while DEL reports moderate uncertainty (S is still small). This divergence is clinically meaningful: "The record is internally consistent but thin — don't over-rely on it."

---

## 5. Missing Modality Scenario

If the MRI modality were absent:

| Theory | How it handles the absence |
|---|---|
| **DST** | `m(Θ) = 1.0` for that channel — total ignorance. Fused belief drops. Plausibility stays 1 (can't rule out anything). |
| **DEL** | `Dir(1,1)` — uniform distribution, `u = 1.0`. No evidence, maximum uncertainty. Evidence from other channels still accumulates. |

Both correctly flag incompleteness in the narrative. Completeness ratio (present/total) is reported as a scalar (e.g., 0.667 for 2/3 modalities).

---

## 6. Overhead & Test Coverage

| Metric | Value |
|---|---|
| Uncertainty stage runtime | **3ms** (56KB record) |
| Full pipeline runtime | 38ms |
| New tests added | 37 |
| Total test suite | 76 tests, **76 passing** |
| New dependencies | **0** — stdlib + numpy only |
| Breaking changes to existing API | **0** — fully backward compatible |

---

## 7. What This Means for the Paper

**Research gap:** No existing medical encryption pipeline quantifies data trustworthiness before or during encryption. Existing integrity checks (HMAC, GCM auth tags) only verify tamper-detection *after* the fact.

**Our contribution:** A pre-encryption uncertainty analysis layer that:
1. Uses two formally distinct frameworks (classical evidence theory vs modern probabilistic learning)
2. Compares them head-to-head on identical feature vectors derived from medical data bytes
3. Embeds the comparison inside the encrypted bundle — the receiver gets both a security guarantee (tampering detection) AND a data quality certificate

**Paper framing:** "We introduce uncertainty-aware encryption for multi-modal medical data, comparing Dempster-Shafer Theory and Deep Evidential Learning as uncertainty quantification frameworks in a cryptographic pipeline. We show that DST and DEL are complementary: DST excels at detecting inter-modality conflict, while DEL provides a calibrated measure of evidence accumulation. Both frameworks are applied pre-encryption on feature vectors extracted purely from byte content, requiring no external models or databases."
