"""Integration tests for the full end-to-end CryptoFlow pipeline."""

from __future__ import annotations

import json
from pathlib import Path
import pytest

from cryptoflow.decrypt.pipeline import decrypt_bundle
from cryptoflow.models.modality import ModalityType
from cryptoflow.pipeline import encrypt_pipeline
from cryptoflow.synthetic import generate_patient_bundle


def test_full_pipeline_roundtrip(tmp_path: Path) -> None:
    # 1. Create synthetic files
    raw = generate_patient_bundle(tmp_path / "raw", image_size_bytes=8192)
    file_paths = {
        ModalityType.IMAGE: raw["image"],
        ModalityType.TEXT: raw["text"],
        ModalityType.METADATA: raw["metadata"],
    }

    orig_image = raw["image"].read_bytes()
    orig_text = raw["text"].read_bytes()
    orig_meta = raw["metadata"].read_bytes()

    # 2. Encrypt
    enc_dir = tmp_path / "encrypted"
    bundle_path, keyring_path = encrypt_pipeline(file_paths, enc_dir)

    assert bundle_path.exists()
    assert keyring_path.exists()
    assert bundle_path.stat().st_size > len(orig_image) + len(orig_text) + len(orig_meta)

    # 3. Decrypt
    dec_dir = tmp_path / "decrypted"
    restored_files = decrypt_bundle(bundle_path, keyring_path, dec_dir)

    assert len(restored_files) == 3
    restored_map = {p.name: p for p in restored_files}

    assert restored_map[raw["image"].name].read_bytes() == orig_image
    assert restored_map[raw["text"].name].read_bytes() == orig_text
    assert restored_map[raw["metadata"].name].read_bytes() == orig_meta


def test_partial_modalities_roundtrip(tmp_path: Path) -> None:
    """Test encrypting and decrypting with only 2 modalities (image + text, no metadata)."""
    raw = generate_patient_bundle(tmp_path / "raw_partial", image_size_bytes=4096)
    file_paths = {
        ModalityType.IMAGE: raw["image"],
        ModalityType.TEXT: raw["text"],
    }

    orig_image = raw["image"].read_bytes()
    orig_text = raw["text"].read_bytes()

    enc_dir = tmp_path / "encrypted_partial"
    bundle_path, keyring_path = encrypt_pipeline(file_paths, enc_dir)

    dec_dir = tmp_path / "decrypted_partial"
    restored_files = decrypt_bundle(bundle_path, keyring_path, dec_dir)

    assert len(restored_files) == 2
    restored_map = {p.name: p for p in restored_files}
    assert restored_map[raw["image"].name].read_bytes() == orig_image
    assert restored_map[raw["text"].name].read_bytes() == orig_text
