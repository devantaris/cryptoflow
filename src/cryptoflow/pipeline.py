"""CryptoFlow encryption pipeline orchestrator.

Chains the five encryption stages (ingest -> keygen -> encrypt ->
bind -> package) into a single high-level call that takes raw
file paths and produces a ``.cryptoflow`` bundle plus a separate
``.keyring`` file.
"""

from __future__ import annotations

import logging
import time
from pathlib import Path

from cryptoflow.models.modality import ModalityType
from cryptoflow.stages.binding import bind
from cryptoflow.stages.encrypt import encrypt_blobs
from cryptoflow.stages.ingest import ingest
from cryptoflow.stages.keygen import generate_keys
from cryptoflow.stages.package import package_bundle
from cryptoflow.utils.io import format_size

logger = logging.getLogger(__name__)


from typing import Optional, Callable

def encrypt_pipeline(
    file_paths: dict[ModalityType, Path],
    output_dir: Path,
    progress_callback: Optional[Callable[[int, str, dict], None]] = None,
    recipient_pubkey_path: Optional[Path] = None,
    recipient_pubkey_pem: Optional[bytes] = None,
) -> tuple[Path, Path, dict]:
    """Run the full 5-stage encryption pipeline."""
    t_start = time.perf_counter()

    pub_pem = recipient_pubkey_pem
    if pub_pem is None and recipient_pubkey_path is not None and recipient_pubkey_path.exists():
        pub_pem = recipient_pubkey_path.read_bytes()

    total_input = sum(
        Path(p).stat().st_size for p in file_paths.values()
    )
    logger.info(
        "[PIPELINE] Starting encryption: %d files, %s total",
        len(file_paths),
        format_size(total_input),
    )
    
    if progress_callback:
        progress_callback(0, "Started", {"files": len(file_paths), "size": total_input})

    # Stage 1: Ingest
    t1 = time.perf_counter()
    blobs = ingest(file_paths)
    dt1 = time.perf_counter() - t1
    if progress_callback:
        progress_callback(1, "Ingest & Normalization", {"blobs": len(blobs), "time_s": dt1})

    # Stage 2: Key Generation
    t2 = time.perf_counter()
    keyring = generate_keys(blobs)
    dt2 = time.perf_counter() - t2
    if progress_callback:
        progress_callback(2, "CSPRNG Key Generation", {"keys": len(blobs) + 1, "time_s": dt2})

    # Stage 3: Encrypt
    t3 = time.perf_counter()
    encrypted = encrypt_blobs(blobs, keyring)
    dt3 = time.perf_counter() - t3
    if progress_callback:
        progress_callback(3, "AES-256-GCM Encryption", {"encrypted_blobs": len(encrypted), "time_s": dt3})

    # Stage 4: Binding
    t4 = time.perf_counter()
    binding_hash, binding_details = bind(encrypted, keyring.binding_key)
    dt4 = time.perf_counter() - t4
    if progress_callback:
        progress_callback(4, "Cross-Modal Binding Hash", {"hash": binding_hash.hex(), "details": binding_details, "time_s": dt4})

    # Build original filenames map for packaging
    original_filenames: dict[ModalityType, str] = {
        blob.modality_type: blob.original_filename for blob in blobs
    }

    # Stage 5: Package
    t5 = time.perf_counter()
    bundle_path, keyring_path, package_stats = package_bundle(
        encrypted, keyring, binding_hash, original_filenames, output_dir, recipient_pubkey_pem=pub_pem
    )
    dt5 = time.perf_counter() - t5
    if progress_callback:
        progress_callback(5, "Binary Packaging & Split Courier", {"bundle": bundle_path.name, "stats": package_stats, "time_s": dt5})

    dt_total = time.perf_counter() - t_start

    logger.info(
        "[PIPELINE] Encryption complete in %.3fs "
        "(ingest=%.3fs, keygen=%.3fs, encrypt=%.3fs, "
        "bind=%.3fs, package=%.3fs)",
        dt_total, dt1, dt2, dt3, dt4, dt5,
    )
    
    metadata = {
        "total_input_size_bytes": total_input,
        "file_count": len(file_paths),
        "package_stats": package_stats,
        "binding_details": binding_details
    }
    
    from cryptoflow.utils.stats import record_encryption
    record_encryption(package_stats["bundle_size_bytes"])

    return bundle_path, keyring_path, metadata
