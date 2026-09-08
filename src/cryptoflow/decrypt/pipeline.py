"""CryptoFlow decryption pipeline.

Reverses the encryption pipeline: unpack the .cryptoflow bundle,
verify the cross-modal binding hash, verify each GCM auth tag
during decryption, strip the typed header, and write the restored
original files.
"""

from __future__ import annotations

import json
import logging
import struct
import time
from pathlib import Path

from cryptoflow.exceptions import (
    BindingMismatchError,
    InvalidBundleError,
    KeyMismatchError,
)
from cryptoflow.models.bundle import (
    BUNDLE_HEADER_SIZE,
    BUNDLE_MAGIC,
    BundleManifest,
    EncryptedBlob,
    EncryptionKey,
    KeyRing,
)
from cryptoflow.models.modality import HEADER_SIZE, ModalityType
from cryptoflow.utils.crypto import aes_gcm_decrypt, verify_binding_hash
from cryptoflow.utils.io import (
    ensure_dir,
    format_size,
    read_file,
    write_file,
)

logger = logging.getLogger(__name__)


def _parse_bundle_header(data: bytes) -> tuple[int, str, int, int]:
    """Parse the fixed 64-byte bundle header.

    Returns:
        Tuple of (version, bundle_id_hex, manifest_length,
        modality_count).

    Raises:
        InvalidBundleError: If magic bytes don't match or data
            is too short.
    """
    if len(data) < BUNDLE_HEADER_SIZE:
        raise InvalidBundleError(
            f"Bundle too small: {len(data)} bytes "
            f"(need at least {BUNDLE_HEADER_SIZE})"
        )

    magic = data[0:6]
    if magic != BUNDLE_MAGIC:
        raise InvalidBundleError(
            f"Invalid magic bytes: {magic!r} "
            f"(expected {BUNDLE_MAGIC!r})"
        )

    version = struct.unpack_from("<H", data, 6)[0]
    uuid_bytes = data[8:24]
    # Convert raw UUID bytes to standard string form
    import uuid as _uuid
    bundle_id = str(_uuid.UUID(bytes=uuid_bytes))

    manifest_length = struct.unpack_from("<I", data, 24)[0]
    modality_count = data[28]

    return version, bundle_id, manifest_length, modality_count


def _extract_filename_from_header(header: bytes) -> str:
    """Extract the original filename from a 64-byte blob header.

    The filename occupies bytes [11:64], encoded as UTF-8 with null padding.
    Strictly sanitizes against path traversal attacks (e.g. ``../../etc/passwd``).
    """
    fname_raw = header[11:64]
    # Strip null padding
    null_idx = fname_raw.find(b"\x00")
    if null_idx >= 0:
        fname_raw = fname_raw[:null_idx]
    decoded = fname_raw.decode("utf-8", errors="replace")
    # Sanitize to pure basename to prevent directory traversal
    clean_name = Path(decoded).name
    return clean_name or "restored_payload.bin"


def decrypt_bundle(
    bundle_path: Path,
    keyring_path: Path,
    output_dir: Path,
    private_key_path: Path | None = None,
    passphrase: bytes | None = None,
) -> list[Path]:
    """Decrypt a .cryptoflow bundle and restore original files.

    Verification steps performed:

    1. Validate bundle header magic and version
    2. Verify keyring bundle_id matches the bundle (unwrapping RSA digital envelope if present)
    3. Recompute and verify the HMAC-SHA-256 binding hash
    4. Decrypt each blob (GCM auto-verifies auth tags)
    5. Strip typed headers and write original files

    Args:
        bundle_path: Path to the ``.cryptoflow`` bundle file.
        keyring_path: Path to the ``.keyring`` JSON file.
        output_dir: Directory to write decrypted files.
        private_key_path: Optional path to recipient RSA private key PEM file
            if the keyring was encrypted with RSA-OAEP.
        passphrase: Optional passphrase for the private key.

    Returns:
        List of paths to the restored original files.

    Raises:
        InvalidBundleError: If the bundle is corrupted or malformed.
        KeyMismatchError: If the keyring doesn't match the bundle or RSA key is invalid.
        BindingMismatchError: If the binding hash verification fails.
        AuthTagMismatchError: If any individual file's GCM auth tag fails.
    """
    t_start = time.perf_counter()
    ensure_dir(output_dir)

    # --- Read inputs ---
    logger.info("[DECRYPT] Reading bundle: %s", bundle_path.name)
    bundle_data = read_file(bundle_path)

    logger.info("[DECRYPT] Reading keyring: %s", keyring_path.name)
    keyring_data = read_file(keyring_path)
    
    priv_pem: bytes | None = None
    if private_key_path is not None and private_key_path.exists():
        priv_pem = read_file(private_key_path)

    keyring = KeyRing.from_json(
        json.loads(keyring_data.decode("utf-8")),
        private_key_pem=priv_pem,
        passphrase=passphrase,
    )

    # --- Parse bundle header ---
    version, bundle_id, manifest_len, modality_count = (
        _parse_bundle_header(bundle_data)
    )
    logger.info(
        "[DECRYPT] Bundle v%d, id=%s..., %d modalities, "
        "manifest=%d bytes",
        version, bundle_id[:8], modality_count, manifest_len,
    )

    # --- Verify keyring matches bundle ---
    if keyring.bundle_id != bundle_id:
        raise KeyMismatchError(
            f"KeyRing bundle_id ({keyring.bundle_id[:8]}...) "
            f"does not match bundle ({bundle_id[:8]}...)"
        )

    # --- Parse manifest ---
    manifest_start = BUNDLE_HEADER_SIZE
    manifest_end = manifest_start + manifest_len
    manifest_bytes = bundle_data[manifest_start:manifest_end]
    manifest = BundleManifest.from_json(
        json.loads(manifest_bytes.decode("utf-8"))
    )
    logger.info(
        "[DECRYPT] Manifest parsed: %d modalities, "
        "binding_hash=%s...",
        manifest.modality_count,
        manifest.binding_hash.hex()[:16],
    )

    # Display uncertainty profile if present in the manifest
    if manifest.uncertainty_profile is not None:
        up = manifest.uncertainty_profile
        comparison = up.get("comparison", {})  # type: ignore[union-attr]
        logger.info(
            "[DECRYPT] Uncertainty profile present — "
            "completeness: %s, theories agree: %s",
            up.get("completeness", "N/A"),  # type: ignore[union-attr]
            comparison.get("reliability_agreement", "N/A"),
        )
        narrative = comparison.get("narrative", "")
        if narrative:
            logger.info("[DECRYPT] Uncertainty summary: %s", narrative)

    # --- Extract encrypted blobs ---
    blob_section_start = manifest_end
    encrypted_blobs: list[EncryptedBlob] = []

    for entry in manifest.modalities:
        blob_start = blob_section_start + entry.offset
        blob_end = blob_start + entry.encrypted_size
        ciphertext = bundle_data[blob_start:blob_end]

        if len(ciphertext) != entry.encrypted_size:
            raise InvalidBundleError(
                f"Truncated blob for {entry.modality_type.value}: "
                f"expected {entry.encrypted_size} bytes, "
                f"got {len(ciphertext)}"
            )

        enc_blob = EncryptedBlob(
            ciphertext=ciphertext,
            auth_tag=entry.auth_tag,
            iv=entry.iv,
            modality_type=entry.modality_type,
            original_size=entry.original_size,
        )
        encrypted_blobs.append(enc_blob)

    # --- Verify binding hash ---
    logger.info("[DECRYPT] Verifying cross-modal binding hash...")
    if not verify_binding_hash(
        keyring.binding_key, encrypted_blobs, manifest.binding_hash
    ):
        raise BindingMismatchError(
            "Binding hash verification FAILED -- "
            "one or more files may have been swapped, "
            "injected, or deleted since encryption"
        )
    logger.info("[DECRYPT] Binding verification PASSED")

    # --- Decrypt each blob ---
    key_map: dict[ModalityType, EncryptionKey] = {
        k.modality_type: k for k in keyring.keys
    }

    output_paths: list[Path] = []

    for enc_blob in encrypted_blobs:
        enc_key = key_map.get(enc_blob.modality_type)
        if enc_key is None:
            raise KeyMismatchError(
                f"No key for modality {enc_blob.modality_type.value}"
            )

        # GCM decryption auto-verifies the auth tag
        plaintext = aes_gcm_decrypt(
            enc_key.key, enc_key.iv,
            enc_blob.ciphertext, enc_blob.auth_tag,
        )

        # Strip the 64-byte typed header to recover original bytes
        if len(plaintext) < HEADER_SIZE:
            raise InvalidBundleError(
                f"Decrypted blob too small for "
                f"{enc_blob.modality_type.value}: "
                f"{len(plaintext)} bytes"
            )

        header = plaintext[:HEADER_SIZE]
        original_bytes = plaintext[HEADER_SIZE:]

        # Extract filename from header
        filename = _extract_filename_from_header(header)
        if not filename:
            filename = f"{enc_blob.modality_type.value}.bin"

        out_path = output_dir / filename
        write_file(out_path, original_bytes)
        output_paths.append(out_path)

        logger.info(
            "[DECRYPT] %s: decrypted %s -> %s (%s)",
            enc_blob.modality_type.value,
            format_size(len(enc_blob.ciphertext)),
            filename,
            format_size(len(original_bytes)),
        )

    dt = time.perf_counter() - t_start
    logger.info(
        "[DECRYPT] Decryption complete in %.3fs: "
        "%d files restored to %s",
        dt, len(output_paths), output_dir,
    )
    return output_paths
