"""Integration tests for the full end-to-end CryptoFlow pipeline."""

from __future__ import annotations

import json
from pathlib import Path
import pytest

from cryptoflow.decrypt.pipeline import decrypt_bundle
from cryptoflow.models.modality import ModalityType
from cryptoflow.pipeline import encrypt_pipeline
from cryptoflow.stages.binding import bind, verify_binding
from cryptoflow.synthetic import generate_patient_bundle
from cryptoflow.utils.crypto import generate_rsa_keypair


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

    # Track progress callbacks
    progress_stages = []
    def on_progress(stage: int, name: str, details: dict):
        progress_stages.append((stage, name))

    # 2. Encrypt
    enc_dir = tmp_path / "encrypted"
    bundle_path, keyring_path, meta = encrypt_pipeline(
        file_paths, enc_dir, progress_callback=on_progress
    )

    assert bundle_path.exists()
    assert keyring_path.exists()
    assert len(progress_stages) == 7
    assert meta["file_count"] == 3
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
    bundle_path, keyring_path, _ = encrypt_pipeline(file_paths, enc_dir)

    dec_dir = tmp_path / "decrypted_partial"
    restored_files = decrypt_bundle(bundle_path, keyring_path, dec_dir)

    assert len(restored_files) == 2
    restored_map = {p.name: p for p in restored_files}
    assert restored_map[raw["image"].name].read_bytes() == orig_image
    assert restored_map[raw["text"].name].read_bytes() == orig_text


def test_rsa_hybrid_pipeline(tmp_path: Path) -> None:
    """Test full pipeline using RSA-OAEP public key wrapping and private key unwrapping."""
    priv_pem, pub_pem = generate_rsa_keypair(key_size=2048)
    pub_path = tmp_path / "recipient_pub.pem"
    priv_path = tmp_path / "recipient_priv.pem"
    pub_path.write_bytes(pub_pem)
    priv_path.write_bytes(priv_pem)

    raw = generate_patient_bundle(tmp_path / "raw_rsa", image_size_bytes=4096)
    file_paths = {
        ModalityType.IMAGE: raw["image"],
        ModalityType.TEXT: raw["text"],
    }

    enc_dir = tmp_path / "enc_rsa"
    bundle_path, keyring_path, _ = encrypt_pipeline(
        file_paths, enc_dir, recipient_pubkey_path=pub_path
    )

    keyring_data = json.loads(keyring_path.read_text(encoding="utf-8"))
    assert keyring_data["wrapped"] is True
    assert "envelope" in keyring_data

    # Decrypt with private key
    dec_dir = tmp_path / "dec_rsa"
    restored = decrypt_bundle(bundle_path, keyring_path, dec_dir, private_key_path=priv_path)
    assert len(restored) == 2
