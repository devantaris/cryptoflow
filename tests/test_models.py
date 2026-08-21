"""Unit tests for CryptoFlow data models and serialization."""

from __future__ import annotations

import json
import pytest

from cryptoflow.models.bundle import (
    AES_KEY_SIZE,
    BINDING_HASH_SIZE,
    BUNDLE_MAGIC,
    BUNDLE_VERSION,
    GCM_IV_SIZE,
    GCM_TAG_SIZE,
    BundleManifest,
    EncryptedBlob,
    EncryptionKey,
    KeyRing,
    ModalityEntry,
)
from cryptoflow.models.modality import (
    HEADER_MAGIC,
    HEADER_SIZE,
    MAX_FILE_SIZE,
    ModalityType,
    NormalizedBlob,
    RawModality,
)
from cryptoflow.utils.crypto import generate_aes_key, generate_hmac_key, generate_iv


def test_modality_type_enum() -> None:
    assert ModalityType.IMAGE.value == "image"
    assert ModalityType.TEXT.value == "text"
    assert ModalityType.METADATA.value == "metadata"


def test_raw_modality() -> None:
    raw = RawModality(
        modality_type=ModalityType.TEXT,
        filename="test.txt",
        raw_bytes=b"Hello World",
        mime_type="text/plain",
    )
    assert raw.size_bytes == 11
    assert raw.filename == "test.txt"


def test_normalized_blob() -> None:
    header = b"H" * HEADER_SIZE
    payload = b"PAYLOAD"
    blob = NormalizedBlob(
        modality_type=ModalityType.IMAGE,
        header=header,
        payload=payload,
        original_filename="scan.dcm",
        original_size=len(payload),
    )
    assert blob.total_size == HEADER_SIZE + len(payload)
    assert blob.total_bytes == header + payload


def test_encryption_key_validation() -> None:
    valid_key = generate_aes_key()
    valid_iv = generate_iv()

    k = EncryptionKey(key=valid_key, iv=valid_iv, modality_type=ModalityType.IMAGE)
    assert len(k.key) == AES_KEY_SIZE
    assert len(k.iv) == GCM_IV_SIZE

    # Invalid key length
    with pytest.raises(ValueError, match="Key must be 32 bytes"):
        EncryptionKey(key=b"too_short", iv=valid_iv, modality_type=ModalityType.IMAGE)

    # Invalid IV length
    with pytest.raises(ValueError, match="IV must be 12 bytes"):
        EncryptionKey(key=valid_key, iv=b"too_short", modality_type=ModalityType.IMAGE)


def test_keyring_json_roundtrip() -> None:
    keys = [
        EncryptionKey(key=generate_aes_key(), iv=generate_iv(), modality_type=ModalityType.IMAGE),
        EncryptionKey(key=generate_aes_key(), iv=generate_iv(), modality_type=ModalityType.TEXT),
        EncryptionKey(key=generate_aes_key(), iv=generate_iv(), modality_type=ModalityType.METADATA),
    ]
    binding_key = generate_hmac_key()
    kr = KeyRing.create(keys=keys, binding_key=binding_key)

    kr_json = kr.to_json()
    kr_restored = KeyRing.from_json(kr_json)

    assert kr_restored.bundle_id == kr.bundle_id
    assert kr_restored.binding_key == kr.binding_key
    assert len(kr_restored.keys) == 3
    for orig, rest in zip(kr.keys, kr_restored.keys):
        assert orig.key == rest.key
        assert orig.iv == rest.iv
        assert orig.modality_type == rest.modality_type


def test_manifest_json_roundtrip() -> None:
    entries = [
        ModalityEntry(
            modality_type=ModalityType.IMAGE,
            original_filename="ct.dcm",
            original_size=1000,
            encrypted_size=1080,
            offset=0,
            auth_tag=generate_iv() + b"\x00\x00\x00\x00",
            iv=generate_iv(),
        )
    ]
    manifest = BundleManifest(
        version=BUNDLE_VERSION,
        bundle_id="12345678-1234-5678-1234-567812345678",
        created_at="2026-08-21T00:00:00Z",
        modality_count=1,
        modalities=entries,
        binding_hash=generate_hmac_key(),
        total_size=2000,
    )

    m_json = manifest.to_json()
    m_restored = BundleManifest.from_json(m_json)

    assert m_restored.version == manifest.version
    assert m_restored.bundle_id == manifest.bundle_id
    assert m_restored.binding_hash == manifest.binding_hash
    assert len(m_restored.modalities) == 1
    assert m_restored.modalities[0].original_filename == "ct.dcm"
