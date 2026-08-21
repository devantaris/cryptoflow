"""Stage 5 -- Package encrypted blobs into a .cryptoflow bundle.

Writes the custom binary bundle format (header + JSON manifest +
concatenated ciphertext blobs) and a separate .keyring JSON file
for key transport.
"""

from __future__ import annotations

import json
import logging
import struct
import uuid as _uuid
from pathlib import Path

from cryptoflow.models.bundle import (
    BUNDLE_HEADER_SIZE,
    BUNDLE_MAGIC,
    BUNDLE_VERSION,
    BundleManifest,
    EncryptedBlob,
    KeyRing,
    ModalityEntry,
)
from cryptoflow.models.modality import ModalityType
from cryptoflow.utils.io import ensure_dir, format_size, write_file

logger = logging.getLogger(__name__)


def _build_bundle_header(
    bundle_id: str,
    manifest_length: int,
    modality_count: int,
) -> bytes:
    """Build the fixed 64-byte binary bundle header.

    Layout::

        [0:6]   BUNDLE_MAGIC ("CFLOW\\x00")
        [6:8]   Version (uint16 LE)
        [8:24]  Bundle UUID (16 raw bytes)
        [24:28] Manifest length (uint32 LE)
        [28:29] Modality count (uint8)
        [29:64] Reserved zeros (35 bytes)
    """
    uuid_bytes = _uuid.UUID(bundle_id).bytes
    header = (
        BUNDLE_MAGIC
        + struct.pack("<H", BUNDLE_VERSION)
        + uuid_bytes
        + struct.pack("<I", manifest_length)
        + struct.pack("<B", modality_count)
        + b"\x00" * 35
    )
    assert len(header) == BUNDLE_HEADER_SIZE
    return header


def package_bundle(
    encrypted_blobs: list[EncryptedBlob],
    keyring: KeyRing,
    binding_hash: bytes,
    original_filenames: dict[ModalityType, str],
    output_dir: Path,
) -> tuple[Path, Path]:
    """Package encrypted blobs into a .cryptoflow bundle file.

    Produces two output files:

    - ``<bundle_id>.cryptoflow`` — the binary bundle
    - ``<bundle_id>.keyring`` — JSON key file (separate transport)

    Args:
        encrypted_blobs: Encrypted blobs in modality-sorted order.
        keyring: The KeyRing used for encryption.
        binding_hash: 32-byte HMAC-SHA-256 binding digest.
        original_filenames: Map of modality to original basename.
        output_dir: Directory for output files.

    Returns:
        Tuple of (bundle_path, keyring_path).
    """
    ensure_dir(output_dir)

    # Sort blobs deterministically
    sorted_blobs = sorted(
        encrypted_blobs, key=lambda b: b.modality_type.value
    )

    # Compute offsets for each blob in the blob section
    modality_entries: list[ModalityEntry] = []
    current_offset = 0

    for blob in sorted_blobs:
        entry = ModalityEntry(
            modality_type=blob.modality_type,
            original_filename=original_filenames.get(
                blob.modality_type, f"{blob.modality_type.value}.bin"
            ),
            original_size=blob.original_size,
            encrypted_size=len(blob.ciphertext),
            offset=current_offset,
            auth_tag=blob.auth_tag,
            iv=blob.iv,
        )
        modality_entries.append(entry)
        current_offset += len(blob.ciphertext)

    # Build manifest
    manifest = BundleManifest(
        version=BUNDLE_VERSION,
        bundle_id=keyring.bundle_id,
        created_at=keyring.created_at,
        modality_count=len(sorted_blobs),
        modalities=modality_entries,
        binding_hash=binding_hash,
        total_size=0,  # Will be updated after computing total
    )

    manifest_json = json.dumps(
        manifest.to_json(), separators=(",", ":")
    ).encode("utf-8")

    # Concatenate all ciphertext blobs
    blob_section = b"".join(b.ciphertext for b in sorted_blobs)

    # Build bundle header
    bundle_header = _build_bundle_header(
        keyring.bundle_id, len(manifest_json), len(sorted_blobs)
    )

    # Assemble full bundle
    bundle_bytes = bundle_header + manifest_json + blob_section

    # Update total_size in manifest (for metadata purposes)
    manifest.total_size = len(bundle_bytes)

    # Write bundle file
    bundle_path = output_dir / f"{keyring.bundle_id}.cryptoflow"
    write_file(bundle_path, bundle_bytes)

    logger.info(
        "[PACKAGE] Bundle written: %s (%s)",
        bundle_path.name,
        format_size(len(bundle_bytes)),
    )

    # Write keyring file (separate transport channel)
    keyring_json = json.dumps(
        keyring.to_json(), indent=2
    ).encode("utf-8")
    keyring_path = output_dir / f"{keyring.bundle_id}.keyring"
    write_file(keyring_path, keyring_json)

    logger.info(
        "[PACKAGE] KeyRing written: %s (%s)",
        keyring_path.name,
        format_size(len(keyring_json)),
    )
    logger.info(
        "[PACKAGE] Data truck: %s | Key truck: %s",
        bundle_path.name,
        keyring_path.name,
    )

    return bundle_path, keyring_path
