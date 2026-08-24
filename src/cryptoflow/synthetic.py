"""Synthetic medical data generator for CryptoFlow testing.

Produces realistic-looking (but fake) medical files for pipeline
testing and benchmarking without requiring real patient data.
"""

from __future__ import annotations

import json
import logging
import os
import struct
from pathlib import Path

from cryptoflow.utils.io import ensure_dir, write_file, format_size

logger = logging.getLogger(__name__)

# Sample data pools for realistic generation
_FIRST_NAMES = [
    "Alex", "Maria", "James", "Priya", "Chen", "Sofia",
    "Omar", "Yuki", "David", "Fatima", "Lucas", "Anika",
]
_LAST_NAMES = [
    "Rivera", "Johnson", "Patel", "Kim", "Mueller", "Santos",
    "Okafor", "Tanaka", "Williams", "Hassan", "Garcia", "Singh",
]
_BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]
_ALLERGIES = [
    "penicillin", "sulfa", "aspirin", "ibuprofen",
    "latex", "none", "codeine", "morphine",
]
_FINDINGS = [
    "Suspicious mass measuring 2.3cm in lower right lobe.",
    "No acute cardiopulmonary abnormality.",
    "Small pleural effusion on the left side.",
    "Bilateral ground-glass opacities consistent with pneumonia.",
    "Calcified granuloma in right upper lobe, likely benign.",
    "Enlarged mediastinal lymph nodes requiring follow-up.",
    "Fracture of the 7th rib, posterolateral aspect.",
    "Normal cardiac silhouette. Clear lungs bilaterally.",
]
_RECOMMENDATIONS = [
    "Immediate biopsy required.",
    "Follow-up CT in 3 months recommended.",
    "No further imaging needed at this time.",
    "Correlate with clinical findings. Consider MRI.",
    "Surgical consultation recommended.",
    "Repeat chest X-ray in 6 weeks.",
    "Bronchoscopy recommended for further evaluation.",
    "Continue current management. No acute intervention needed.",
]
_DOCTORS = [
    "Dr. Chen, MD", "Dr. Patel, MD", "Dr. Williams, MD",
    "Dr. Kim, MD", "Dr. Mueller, MD", "Dr. Santos, MD",
]
_STUDY_TYPES = [
    "CT Chest with contrast",
    "CT Abdomen and Pelvis",
    "MRI Brain without contrast",
    "Chest X-ray PA and Lateral",
    "CT Head without contrast",
    "PET-CT Whole Body",
]


def _rand_choice(pool: list[str]) -> str:
    """Pick a random item using os.urandom for seeding."""
    idx = int.from_bytes(os.urandom(2), "big") % len(pool)
    return pool[idx]


def _rand_int(low: int, high: int) -> int:
    """Random int in [low, high] using os.urandom."""
    span = high - low + 1
    return low + (int.from_bytes(os.urandom(4), "big") % span)


def generate_image(size_bytes: int) -> bytes:
    """Generate a fake DICOM-like binary image.

    Produces a byte sequence starting with a DICOM-like preamble
    followed by random pixel data to reach the target size.

    Args:
        size_bytes: Target file size in bytes (minimum 256).

    Returns:
        Binary data mimicking a DICOM file.
    """
    size_bytes = max(256, size_bytes)

    # DICOM preamble: 128 zero bytes + "DICM" magic
    preamble = b"\x00" * 128 + b"DICM"

    # Fake DICOM metadata tags (simplified)
    meta = struct.pack("<HH", 0x0008, 0x0060)  # Modality tag
    meta += b"CT\x00\x00"  # CT modality
    meta += struct.pack("<HH", 0x0010, 0x0010)  # Patient Name
    meta += b"SYNTHETIC^PATIENT\x00"

    header = preamble + meta

    # Fill remaining with pseudo-random pixel data
    remaining = size_bytes - len(header)
    if remaining > 0:
        # Use os.urandom for realistic-looking binary data
        pixel_data = os.urandom(remaining)
    else:
        pixel_data = b""

    return header + pixel_data


def generate_report() -> bytes:
    """Generate a fake radiology report.

    Returns:
        UTF-8 encoded text that looks like a real radiology report.
    """
    first = _rand_choice(_FIRST_NAMES)
    last = _rand_choice(_LAST_NAMES)
    year = _rand_int(1950, 2005)
    month = _rand_int(1, 12)
    day = _rand_int(1, 28)

    report = (
        f"RADIOLOGY REPORT\n"
        f"{'=' * 40}\n"
        f"Patient: {first} {last}\n"
        f"DOB: {year}-{month:02d}-{day:02d}\n"
        f"Study: {_rand_choice(_STUDY_TYPES)}\n"
        f"Date: 2026-08-{_rand_int(1,28):02d}\n"
        f"\n"
        f"CLINICAL HISTORY:\n"
        f"Evaluation for suspected pulmonary pathology.\n"
        f"\n"
        f"TECHNIQUE:\n"
        f"Helical CT of the chest was performed with "
        f"intravenous contrast.\n"
        f"\n"
        f"FINDINGS:\n"
        f"{_rand_choice(_FINDINGS)}\n"
        f"\n"
        f"IMPRESSION:\n"
        f"{_rand_choice(_FINDINGS)}\n"
        f"\n"
        f"RECOMMENDATION:\n"
        f"{_rand_choice(_RECOMMENDATIONS)}\n"
        f"\n"
        f"Signed: {_rand_choice(_DOCTORS)}\n"
        f"Report ID: RPT-{_rand_int(10000, 99999)}\n"
    )
    return report.encode("utf-8")


def generate_metadata() -> bytes:
    """Generate fake patient metadata JSON.

    Returns:
        UTF-8 encoded JSON with realistic patient demographics.
    """
    first = _rand_choice(_FIRST_NAMES)
    last = _rand_choice(_LAST_NAMES)
    year = _rand_int(1950, 2005)
    month = _rand_int(1, 12)
    day = _rand_int(1, 28)

    meta = {
        "patient_id": f"P-{_rand_int(1000, 99999)}",
        "name": f"{first} {last}",
        "dob": f"{year}-{month:02d}-{day:02d}",
        "sex": _rand_choice(["M", "F"]),
        "blood_type": _rand_choice(_BLOOD_TYPES),
        "allergies": [
            _rand_choice(_ALLERGIES)
            for _ in range(_rand_int(0, 3))
        ],
        "weight_kg": _rand_int(45, 120),
        "height_cm": _rand_int(150, 200),
        "dosage_mg": _rand_int(5, 100),
        "insurance_id": f"INS-{_rand_int(100000, 999999)}",
        "referring_physician": _rand_choice(_DOCTORS),
        "study_date": f"2026-08-{_rand_int(1,28):02d}",
    }
    return json.dumps(meta, indent=2).encode("utf-8")


def generate_patient_bundle(
    output_dir: Path,
    image_size_bytes: int = 10 * 1024,
    patient_index: int = 0,
) -> dict[str, Path]:
    """Generate a complete synthetic patient bundle.

    Creates three files in ``output_dir``:
    - ``patient_<N>_scan.dcm`` — fake DICOM image
    - ``patient_<N>_report.txt`` — fake radiology report
    - ``patient_<N>_meta.json`` — fake patient metadata

    Args:
        output_dir: Directory to write generated files.
        image_size_bytes: Target size for the image file.
        patient_index: Numeric index for filename uniqueness.

    Returns:
        Dict mapping ``"image"``, ``"text"``, ``"metadata"``
        to their file paths.
    """
    ensure_dir(output_dir)
    prefix = f"patient_{patient_index:03d}"

    image_path = output_dir / f"{prefix}_scan.dcm"
    report_path = output_dir / f"{prefix}_report.txt"
    meta_path = output_dir / f"{prefix}_meta.json"

    image_data = generate_image(image_size_bytes)
    report_data = generate_report()
    meta_data = generate_metadata()

    write_file(image_path, image_data)
    write_file(report_path, report_data)
    write_file(meta_path, meta_data)

    logger.info(
        "[SYNTH] Patient %03d: image=%s, report=%s, meta=%s",
        patient_index,
        format_size(len(image_data)),
        format_size(len(report_data)),
        format_size(len(meta_data)),
    )

    return {
        "image": image_path,
        "text": report_path,
        "metadata": meta_path,
    }


def generate_dataset(
    output_dir: Path,
    count: int = 10,
    image_size_bytes: int = 10 * 1024,
) -> list[dict[str, Path]]:
    """Generate a full synthetic dataset of patient bundles.

    Args:
        output_dir: Root directory for the dataset.
        count: Number of patient bundles to generate.
        image_size_bytes: Target image size per patient.

    Returns:
        List of dicts, each mapping modality name to file path.
    """
    ensure_dir(output_dir)
    bundles = []

    for i in range(count):
        bundle = generate_patient_bundle(
            output_dir, image_size_bytes, i
        )
        bundles.append(bundle)

    total_files = count * 3
    logger.info(
        "[SYNTH] Generated %d patient bundles (%d files) in %s",
        count, total_files, output_dir,
    )
    return bundles


# Backwards-compatible alias
generate_synthetic_bundle = generate_patient_bundle
