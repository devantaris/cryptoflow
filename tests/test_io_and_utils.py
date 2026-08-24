"""Unit tests for I/O utilities, formatters, and binding verification."""

from __future__ import annotations

from pathlib import Path
import pytest

from cryptoflow.exceptions import IngestError
from cryptoflow.models.bundle import EncryptedBlob
from cryptoflow.models.modality import ModalityType
from cryptoflow.stages.binding import bind, verify_binding
from cryptoflow.utils.crypto import generate_hmac_key
from cryptoflow.utils.io import (
    detect_modality,
    ensure_dir,
    format_size,
    read_file,
    write_file,
)
from cryptoflow.utils.stats import get_stats, record_attack_blocked, record_encryption


def test_format_size() -> None:
    assert format_size(500) == "500 B"
    assert format_size(1024) == "1.0 KB"
    assert format_size(1024 * 1024) == "1.0 MB"
    assert format_size(1024 * 1024 * 1024) == "1.0 GB"


def test_detect_modality() -> None:
    assert detect_modality(Path("scan.dcm")) == ModalityType.IMAGE
    assert detect_modality(Path("scan.png")) == ModalityType.IMAGE
    assert detect_modality(Path("notes.txt")) == ModalityType.TEXT
    assert detect_modality(Path("notes.pdf")) == ModalityType.TEXT
    assert detect_modality(Path("patient.json")) == ModalityType.METADATA

    with pytest.raises(IngestError):
        detect_modality(Path("unknown.xyz123"))


def test_io_read_write(tmp_path: Path) -> None:
    test_file = tmp_path / "subdir" / "data.bin"
    write_file(test_file, b"sample content")
    assert test_file.exists()
    assert read_file(test_file) == b"sample content"

    # Read non-existent file
    with pytest.raises(IngestError):
        read_file(tmp_path / "missing.bin")

    # Read directory as file
    with pytest.raises(IngestError):
        read_file(tmp_path / "subdir")


def test_stages_verify_binding() -> None:
    key = generate_hmac_key()
    blob1 = EncryptedBlob(
        ciphertext=b"CIPHER1",
        auth_tag=b"T" * 16,
        iv=b"I" * 12,
        modality_type=ModalityType.IMAGE,
        original_size=10,
    )
    blob2 = EncryptedBlob(
        ciphertext=b"CIPHER2",
        auth_tag=b"T" * 16,
        iv=b"I" * 12,
        modality_type=ModalityType.TEXT,
        original_size=10,
    )

    digest, details = bind([blob1, blob2], key)
    assert len(digest) == 32
    assert details["count"] == 2

    assert verify_binding([blob1, blob2], key, digest) is True
    assert verify_binding([blob1], key, digest) is False


def test_stats_tracking() -> None:
    record_encryption(5000)
    record_attack_blocked()
    stats = get_stats()
    assert stats["total_bundles_encrypted"] >= 1
    assert stats["total_bytes_encrypted"] >= 5000
    assert stats["total_attacks_blocked"] >= 1
