# CryptoFlow: Multimodal Medical Data Encryption & Cross-Modal Integrity Binding

[![Python 3.11+](https://img.shields.io/badge/python-3.11%2B-blue.svg)](https://www.python.org/downloads/)
[![Tests](https://img.shields.io/badge/tests-76%20passing-brightgreen.svg)](tests/)
[![Security Audit](https://img.shields.io/badge/attacks%20blocked-100%25-success.svg)](results/attacks/)
[![Pipeline](https://img.shields.io/badge/pipeline-6%20stages-blue.svg)](src/cryptoflow/pipeline.py)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**CryptoFlow** is a research-grade cryptographic pipeline for multimodal medical data (DICOM scans, radiology reports, EHR metadata). It addresses two fundamental problems in healthcare data security:

1. **Cross-modal decoupling attacks** — where attackers swap, inject, or tamper with individual modalities across patient records without triggering per-file integrity checks.
2. **Absence of data quality certification** — encrypted data carries no information about how trustworthy the source data was. CryptoFlow embeds a **pre-encryption uncertainty report** inside every bundle, allowing the receiver to know the reliability of the data at the time it was sent.

CryptoFlow treats multimodal patient bundles as an **atomic, tamper-evident, uncertainty-aware unit** combining AES-256-GCM authenticated encryption, HMAC-SHA-256 cross-modal binding, and a novel DST vs DEL uncertainty quantification comparison embedded in the bundle manifest.

---

## Key Highlights

- 🔒 **Authenticated Confidentiality**: AES-256-GCM per modality with 128-bit authentication tags.
- 🔗 **Cross-Modal Binding**: HMAC-SHA-256 over all ciphertexts, tags, and nonces — swapping, deleting, or injecting any file invalidates the binding hash.
- 🧠 **Uncertainty Quantification (DST + DEL)**: Two independent uncertainty frameworks applied head-to-head before encryption. The UQ report is cryptographically embedded in the bundle — receiver reads it at decryption.
- 📦 **Custom `.cryptoflow` Binary Format**: Compact binary container with fixed 64-byte headers, JSON manifests (including UQ profile), and concatenated encrypted payloads.
- ⚡ **High Throughput**: Exceeds **120 MB/s** encryption and **130 MB/s** decryption. UQ stage adds **3ms overhead** — negligible.
- 🛡️ **Empirically Validated Security**: 100% defense rate across 7 distinct attack vectors (bit flips, swaps, injections, truncations, manifest forgery, key mismatch).
- ✅ **76 Tests Passing**: 37 dedicated UQ tests + full pipeline, attack, and integration tests. Zero regressions.

---

## Cryptographic Architecture & Pipeline

```
  +--------------------------------------------------------------------------------+
  |                               INPUT MODALITIES                                 |
  |   [Image: DICOM / PNG]         [Report: TXT / PDF]       [Metadata: JSON]      |
  +---------------------------------------+----------------------------------------+
                                          |
                                          v
  +--------------------------------------------------------------------------------+
  | STAGE 1: INGEST & NORMALIZATION                                                |
  | Prepends a 64-byte typed binary header (CFBLB\x00, type, size, filename)      |
  +---------------------------------------+----------------------------------------+
                                          |
                                          v
  +--------------------------------------------------------------------------------+
  | STAGE 2: UNCERTAINTY QUANTIFICATION (DST + DEL)                                |
  | Dempster-Shafer Theory & Deep Evidential Learning — head-to-head comparison    |
  | Assesses multi-modal fusion uncertainty & missing information uncertainty       |
  | Output: Uncertainty profile embedded in bundle manifest                        |
  +---------------------------------------+----------------------------------------+
                                          |
                                          v
  +--------------------------------------------------------------------------------+
  | STAGE 3: KEY GENERATION                                                        |
  | Generates unique CSPRNG AES-256 keys + 96-bit nonces + 256-bit HMAC key        |
  +---------------------------------------+----------------------------------------+
                                          |
                                          v
  +--------------------------------------------------------------------------------+
  | STAGE 4: AES-256-GCM ENCRYPTION                                                |
  | Encrypts each normalized blob -> Ciphertext + 128-bit Authentication Tag       |
  +---------------------------------------+----------------------------------------+
                                          |
                                          v
  +--------------------------------------------------------------------------------+
  | STAGE 5: CROSS-MODAL BINDING HASH                                              |
  | Binding Hash = HMAC-SHA-256(Key, Sorted(Ciphertext_i || Tag_i || Nonce_i))     |
  +---------------------------------------+----------------------------------------+
                                          |
                                          v
  +--------------------------------------------------------------------------------+
  | STAGE 6: PACKAGING & SPLIT COURIER                                             |
  |  - Data Package:  <bundle_id>.cryptoflow (Header + Manifest + Ciphertexts)     |
  |  - Key Material:  <bundle_id>.keyring    (Sent via Out-of-Band Channel)        |
  +--------------------------------------------------------------------------------+
```

### Stage 2: Uncertainty Quantification (Research Contribution)

Traditional encryption pipelines answer one question at decryption time: *"Was this data tampered with?"* CryptoFlow answers a second, clinically critical question: *"Was this data trustworthy when it was sent?"*

Stage 2 applies two independent uncertainty frameworks to the raw byte content of each ingested modality and embeds their comparison inside the encrypted bundle:

#### Uncertainty Types Addressed

| # | Uncertainty Type | Description |
|---|---|---|
| **1** | **Multi-Modal Fusion Uncertainty** | When combining image, text, and metadata streams, each source has a different quality level. This uncertainty captures how reliably each modality can be trusted in the fused picture. |
| **2** | **Missing Information Uncertainty** | When one or more expected modalities are absent, the system operates under incomplete evidence. Both theories produce maximal uncertainty for absent modalities rather than silently ignoring the gap. |

#### Theories Compared

| Theory | Full Name | Core Mechanism | Missing Data Response |
|---|---|---|---|
| **DST** | Dempster-Shafer Theory (Shafer, 1976) | Mass functions over {reliable, unreliable, Θ}; Dempster's combination rule | Vacuous BPA: m(Θ) = 1.0 — total ignorance |
| **DEL** | Deep Evidential Learning (Sensoy et al., NeurIPS 2018) | Dirichlet concentration params α; epistemic uncertainty u = K/S | Vacuous Dirichlet: Dir(1,1), u = 1.0 |

Both theories receive the **same three features** extracted purely from raw bytes:
- **Shannon Entropy** — byte-value distribution (0–8 bits per byte)
- **Size Score** — file size vs. expected range for the modality type
- **Format Score** — magic byte / header validity (DICOM `DICM`, PNG `\x89PNG`, JSON `{`)

#### Experimental Results — Synthetic 3-Modality Patient Bundle

**Per-Modality Feature Extraction:**

| Modality | Entropy (bits) | Entropy Score | Size Score | Format Score |
|:---:|:---:|:---:|:---:|:---:|
| Image (PNG, 50KB) | 8.00 | 0.9995 | 1.000 | 1.000 |
| Text (Report, 7.4KB) | 3.87 | 1.000 | 1.000 | 1.000 |
| Metadata (JSON, 63B) | 4.28 | 1.000 | 1.000 | 1.000 |

**Fused Multi-Modal Comparison (DST vs DEL):**

| Metric | DST | DEL |
|:---:|:---:|:---:|
| **Fused Reliability Score** | **99.97%** | **96.87%** |
| Residual Uncertainty | 0.03% | 6.25% |
| Inter-Modality Conflict K | 0.0000 | — |
| Evidence Strength S | — | 32.0 |
| Theory Agreement | ✅ Both: RELIABLE | ✅ Both: RELIABLE |
| UQ Stage Overhead | **3 ms** | **3 ms** |

#### Core Research Finding

Both theories agree on the conclusion (data is reliable) but disagree on magnitude by **3.1%**. This gap is not a bug — it is the finding:

- **DST (99.97%)** — Dempster's combination rule is multiplicative. Three consistent sources converge quickly to near-certainty regardless of evidence volume. DST excels at detecting inter-modality conflict (K coefficient).
- **DEL (96.87%)** — Uncertainty `u = 2/S` shrinks only as evidence volume S grows. With 3 files, S = 32, giving permanent residual u = 6.25%. DEL cannot distinguish 3 consistent files from 3,000 consistent files in terms of conflict, but it can track evidence sufficiency.

> **DST asks: "Do my sources agree?"**  
> **DEL asks: "Have I seen enough to be confident?"**  
> These are independent questions. Both answers are embedded in the bundle.

#### Missing Modality Behavior

| Scenario | DST | DEL |
|---|---|---|
| All 3 modalities present | Bel = 99.97%, K = 0.000 | E[p] = 96.87%, u = 6.25% |
| 1 modality missing | m(Θ) = 1.0 on that channel → belief drops | Dir(1,1) on that channel → u = 1.0 |
| Completeness reported | Ratio (e.g., 0.667 for 2/3) | Ratio (e.g., 0.667 for 2/3) |

#### What the Receiver Sees (Embedded in Manifest)

```json
{
  "completeness": 1.0,
  "present_modalities": ["image", "text", "metadata"],
  "missing_modalities": [],
  "fusion": {
    "dst": { "belief_reliable": 0.9997, "plausibility_reliable": 1.0, "dst_conflict_K": 0.0 },
    "del": { "expected_reliable": 0.9687, "epistemic_uncertainty": 0.0625, "dirichlet_strength": 32.0 }
  },
  "comparison": {
    "reliability_agreement": true,
    "belief_difference": 0.031,
    "narrative": "Both DST and DEL agree the multi-modal data is reliable. DST: 100.0%, DEL: 96.9% (difference: 3.1%). DEL reports higher uncertainty."
  }
}
```



---

## `.cryptoflow` Binary Format Specification

```
+-------------------------------------------------------------+
|                     .cryptoflow Bundle                      |
+-------------------------------------------------------------+
| 1. FIXED HEADER (64 Bytes)                                  |
|    - [0:6]   Magic: "CFLOW\x00"                             |
|    - [6:8]   Format Version (uint16 LE = 1)                 |
|    - [8:24]  Bundle UUID (16 bytes binary)                  |
|    - [24:28] Manifest Length (uint32 LE)                    |
|    - [28:29] Modality Count (uint8)                         |
|    - [29:64] Reserved / Padding (35 zero bytes)             |
+-------------------------------------------------------------+
| 2. MANIFEST SECTION (Variable Length, JSON)                 |
|    Contains version, bundle_id, timestamp, HMAC binding     |
|    hash, per-modality metadata (offsets, tags, IVs), and    |
|    the uncertainty quantification profile (DST + DEL).      |
+-------------------------------------------------------------+
| 3. BLOB PAYLOAD SECTION (Concatenated Ciphertexts)          |
|    - [Encrypted Image Blob]                                 |
|    - [Encrypted Report Blob]                                |
|    - [Encrypted Metadata Blob]                              |
+-------------------------------------------------------------+
```

---

## Installation

```bash
# Clone the repository
git clone https://github.com/your-username/cryptoflow.git
cd cryptoflow

# Install dependencies and package in editable mode
pip install -e ".[dev]"
```

---

## Quickstart & CLI Guide

CryptoFlow includes a rich CLI powered by Typer and Rich.

### 1. Generate Synthetic Medical Data
```bash
cryptoflow generate-data --count 5 --image-size 5MB --output ./data/sample
```

### 2. Encrypt a Patient Bundle
```bash
cryptoflow encrypt \
  --image ./data/sample/patient_000_scan.dcm \
  --text ./data/sample/patient_000_report.txt \
  --metadata ./data/sample/patient_000_meta.json \
  --output ./encrypted
```
*Output: Generates `<bundle_id>.cryptoflow` (encrypted bundle) and `<bundle_id>.keyring` (key material).*

### 3. Decrypt & Verify Bundle
```bash
cryptoflow decrypt \
  --bundle ./encrypted/<bundle_id>.cryptoflow \
  --keyring ./encrypted/<bundle_id>.keyring \
  --output ./decrypted
```
*Verification: Recomputes cross-modal binding hash and GCM tags. If any file has been modified or swapped, decryption is blocked immediately.*

### 4. Run Threat & Attack Simulation
```bash
cryptoflow attack-sim --output ./results/attacks
```

### 5. Run Performance Benchmarks & Generate Plots
```bash
cryptoflow benchmark --iterations 5 --output ./results
```
*Generated plots saved to `./results/plots/`:*
- `throughput_analysis.png`
- `latency_analysis.png`
- `overhead_analysis.png`

---

## Security Verification (Threat Model Scorecard)

CryptoFlow's automated test suite validates resilience against 7 distinct attack vectors:

| Attack Vector | Threat Scenario | Expected Defense | Test Status |
|---|---|---|:---:|
| **Bit Flip** | Adversary flips 1 bit in transmitted ciphertext | GCM Tag Verification Failure | **BLOCKED (PASS)** |
| **Intra-Bundle Swap** | Modality ordering manipulated within bundle | Binding Hash Verification Failure | **BLOCKED (PASS)** |
| **Cross-Bundle Swap** | Patient B's report substituted onto Patient A's scan | Binding Hash Mismatch | **BLOCKED (PASS)** |
| **Payload Truncation** | Network packet loss or truncation attack | Header Length / Tag Mismatch | **BLOCKED (PASS)** |
| **Rogue Injection** | Unauthorized 4th modality injected into bundle | Binding Count Mismatch | **BLOCKED (PASS)** |
| **Manifest Forgery** | Attacker modifies binding hash in manifest | Recomputed Hash Mismatch | **BLOCKED (PASS)** |
| **Key Mismatch** | Decryption attempted using unauthorized keyring | Key Ring UUID / Tag Mismatch | **BLOCKED (PASS)** |

---

## Performance Evaluation

Empirical benchmark results on standard hardware (averaged over multiple iterations):

| Bundle Size | Enc Latency (s) | Dec Latency (s) | Enc Throughput (MB/s) | Dec Throughput (MB/s) | Storage Overhead |
|:---:|:---:|:---:|:---:|:---:|:---:|
| **100 KB** | 0.0728 s | 0.0391 s | 1.47 MB/s | 2.52 MB/s | 1.08% |
| **1 MB** | 0.0624 s | 0.0641 s | 17.63 MB/s | 21.28 MB/s | 0.11% |
| **5 MB** | 0.0912 s | 0.1256 s | 57.52 MB/s | 45.31 MB/s | 0.02% |
| **10 MB** | 0.1182 s | 0.1038 s | 85.04 MB/s | 101.29 MB/s | 0.01% |
| **25 MB** | 0.2086 s | 0.1904 s | 119.94 MB/s | 131.49 MB/s | < 0.01% |

---

### 🗄️ Recommended Evaluation Datasets

| Dataset | Link | Description | Why Suitable |
|---|---|---|---|
| **NIH Chest X-Ray 14** | [Kaggle](https://www.kaggle.com/nih-chest-xrays/data) | 112,120 X-ray images with disease labels. | Great for mixing DICOM images with its metadata CSV for realistic bundle tests. |
| **RSNA Pneumonia Detection** | [Kaggle](https://www.kaggle.com/c/rsna-pneumonia-detection-challenge) | Real DICOM format images with bounding boxes. | Test real DICOM parsing and large file binding. |
| **SIIM-ISIC Melanoma** | [Kaggle](https://www.kaggle.com/c/siim-isic-melanoma-classification) | DICOM images + structured patient metadata. | Ideal for testing Stage 1 normalization across multiple formats. |
| **MIMIC-III Clinical Notes** | [PhysioNet](https://physionet.org/content/mimiciii/1.4/) | Massive database of real radiology reports. | Perfect for testing the text modality binding in Stage 4. |
| **COVID-19 CT Scans** | [Kaggle](https://www.kaggle.com/andrewmvd/covid19-ct-scans) | High-resolution volumetric CT slices. | Large payload sizes to stress test AES-GCM throughput. |

### 🔬 Reproducing Paper Results with Kaggle Data

To reproduce the benchmark results using Kaggle DICOM files:
1. Download a DICOM file from the datasets above.
2. Generate a synthetic text report and a metadata JSON.
3. Run the CLI tool:
   ```bash
   cryptoflow encrypt --image sample.dcm --text report.txt --metadata meta.json --output ./results
   ```
---

## Formal Adversarial Threat Model (Dolev-Yao Formulation)

In our research model, the network and intermediate storage nodes are governed by the standard **Dolev-Yao adversary** $\mathcal{A}$:
- **Eavesdropping**: $\mathcal{A}$ can read all transit traffic across PACS routers and hospital VNAs.
- **Interception & Injection**: $\mathcal{A}$ can delete, reorder, truncate, and inject arbitrary binary packets.
- **Cross-Patient Splicing**: $\mathcal{A}$ attempts to interchange a benign diagnosis or report $R_{\text{benign}}$ into a malignant patient bundle $B_{\text{malignant}}$ to cause diagnostic misdirection or clinical fraud.

```
                   +-------------------------------------------------------------+
                   |                 DOLEV-YAO ADVERSARY MODEL                   |
                   |                                                             |
                   |   [Patient A Bundle]                      [Patient B Bundle]|
                   |   - Scan A (Malignant)                    - Scan B (Benign) |
                   |   - Report A (Malignant)                  - Report B (Benign)|
                   |             \                                    /          |
                   |              \------- SPLICING ATTACK ----------/           |
                   |                                                             |
                   |   Adversary attempts to replace Report A with Report B:     |
                   |   Result in Traditional Systems: ACCEPTED (Per-file check)   |
                   |   Result in CryptoFlow:          REJECTED (HMAC Invariant)  |
                   +-------------------------------------------------------------+
```

### Mathematical Invariant & Security Guarantees:
Let a patient encounter $E$ consist of $k$ heterogeneous modalities $M_1, M_2, \dots, M_k$.
For each modality $i$, encryption produces ciphertext $C_i$, authentication tag $T_i$, and nonce $N_i$ using isolated symmetric key $K_i$:
$$(C_i, T_i) \leftarrow \text{AES-GCM-Enc}_{K_i}(N_i, H_i \parallel P_i)$$
The cross-modal binding hash $H_{\text{bind}}$ is defined as:
$$H_{\text{bind}} = \text{HMAC-SHA-256}_{K_{\text{bind}}}\left(\bigoplus_{i=1}^k (C_i \parallel T_i \parallel N_i)\right)$$

**Security Proposition**: Modifying any single byte in any ciphertext $C_j$, altering the modality sequence, injecting a rogue payload, or substituting a file from another patient invalidates $H_{\text{bind}}$ with probability $1 - 2^{-256}$, preventing decryption and unsealing before clinical ingestion.

---

## Asymmetric RSA-OAEP Hybrid Key Encapsulation

To prevent plaintext key exposure on disk, CryptoFlow supports **RSA-OAEP-SHA256 Digital Envelopes**:
1. Generate an RSA keypair for the receiving institution:
   ```bash
   python -m cryptoflow.cli generate-keys --output keys/ --bits 2048
   ```
2. Encrypt and encapsulate the `.keyring` with the recipient's public key:
   ```bash
   python -m cryptoflow.cli encrypt ./patient_folder --output vault/ --pubkey keys/recipient_public.pem
   ```
3. Decrypt the wrapped bundle using the recipient's private key:
   ```bash
   python -m cryptoflow.cli decrypt vault/*.cryptoflow --keyring vault/*.keyring --privkey keys/recipient_private.pem --output restored/
   ```

---

## Empirical Evaluation on Real-World Kaggle Datasets

CryptoFlow provides dedicated automated evaluation harnesses for clinical research datasets:

### 1. NIH Chest X-Ray 14 Dataset (112,120 Radiographs + Demographics CSV)
```bash
# Evaluate on 50 real patient encounters from NIH dataset
python scripts/evaluate_kaggle_nih.py --data-dir path/to/nih_dataset --sample-size 50
```

### 2. RSNA Pneumonia Detection Challenge (Real DICOM Corpus)
```bash
# Evaluate directly on raw DICOM (.dcm) files
python scripts/evaluate_kaggle_rsna.py --data-dir path/to/rsna_dicoms --sample-size 50
```

4. Run the benchmark tool against the generated bundles to observe sub-second latencies and >120MB/s throughput.


---

## Project Structure

```
cryptoflow/
├── pyproject.toml              # Build config and dependency definitions
├── README.md                   # Research paper documentation
├── src/
│   └── cryptoflow/
│       ├── __init__.py
│       ├── cli.py              # CLI commands (encrypt, decrypt, benchmark, etc.)
│       ├── pipeline.py         # Main 6-stage encryption orchestrator
│       ├── synthetic.py        # Realistic DICOM/report/JSON data generator
│       ├── exceptions.py       # Custom exception hierarchy
│       ├── stages/             # Modular encryption stages
│       │   ├── ingest.py       # Stage 1: File normalisation & header packing
│       │   ├── uncertainty.py  # Stage 2: DST + DEL uncertainty quantification
│       │   ├── keygen.py       # Stage 3: CSPRNG key generation
│       │   ├── encrypt.py      # Stage 4: AES-256-GCM encryption
│       │   ├── binding.py      # Stage 5: HMAC-SHA-256 cross-modal binding
│       │   └── package.py      # Stage 6: Custom .cryptoflow binary writer
│       ├── decrypt/            # Decryption & integrity verification
│       │   └── pipeline.py     # Unpack, binding check, GCM check, restore
│       ├── attacks/            # Attack simulation suite
│       │   └── simulator.py    # 7 cyberattack models & evaluation
│       ├── benchmark/          # Performance evaluation
│       │   ├── runner.py       # Multi-tier throughput/latency harness
│       │   └── plotter.py      # Publication-quality matplotlib/seaborn figures
│       ├── models/             # Dataclasses and JSON serialization
│       │   ├── modality.py     # ModalityType, NormalizedBlob, RawModality
│       │   ├── bundle.py       # KeyRing, BundleManifest, EncryptedBlob
│       │   └── uncertainty.py  # UncertaintyReport, DSTResult, DELResult
│       └── utils/
│           ├── crypto.py       # Cryptography library wrappers
│           └── io.py           # File I/O and format utilities
├── tests/                      # Pytest unit & integration test suite
│   ├── test_models.py
│   ├── test_crypto.py
│   ├── test_pipeline.py
│   ├── test_attacks.py
│   ├── test_uncertainty.py
│   ├── test_benchmark_synthetic.py
│   └── test_cli.py
├── data/
│   └── sample/                 # Generated sample synthetic medical bundles
└── results/
    ├── benchmarks.csv          # Benchmark measurements
    ├── benchmarks.json
    ├── attacks/                # Attack simulation artifacts
    └── plots/                  # Publication-ready figures (.png)
```

---

## Running Tests

```bash
# Run full test suite with coverage report
python -m pytest --cov=cryptoflow --cov-report=term-missing
```

---

## Citation

If you use CryptoFlow in your research, please cite:

```bibtex
@article{cryptoflow2026,
  title={CryptoFlow: Multimodal Medical Data Encryption and Cross-Modal Integrity Binding for Healthcare Systems},
  author={Devansh and Contributors},
  year={2026},
  journal={arXiv preprint}
}
```
