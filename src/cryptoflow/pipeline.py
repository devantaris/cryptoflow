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


def encrypt_pipeline(
    file_paths: dict[ModalityType, Path],
    output_dir: Path,
) -> tuple[Path, Path]:
    """Run the full 5-stage encryption pipeline.

    Stages executed in order:

    1. **Ingest** — normalise files into binary blobs
    2. **KeyGen** — generate per-file AES-256 keys + HMAC key
    3. **Encrypt** — AES-256-GCM each blob
    4. **Bind** — HMAC-SHA-256 cross-modal binding
    5. **Package** — write .cryptoflow bundle + .keyring

    Args:
        file_paths: Mapping of modality type to input file path.
            Must contain at least one entry.
        output_dir: Directory to write output files.

    Returns:
        Tuple of ``(bundle_path, keyring_path)``.

    Raises:
        IngestError: If any input file is invalid.
        EncryptionError: If encryption fails.
    """
    t_start = time.perf_counter()

    total_input = sum(
        Path(p).stat().st_size for p in file_paths.values()
    )
    logger.info(
        "[PIPELINE] Starting encryption: %d files, %s total",
        len(file_paths),
        format_size(total_input),
    )

    # Stage 1: Ingest
    t1 = time.perf_counter()
    blobs = ingest(file_paths)
    dt1 = time.perf_counter() - t1

    # Stage 2: Key Generation
    t2 = time.perf_counter()
    keyring = generate_keys(blobs)
    dt2 = time.perf_counter() - t2

    # Stage 3: Encrypt
    t3 = time.perf_counter()
    encrypted = encrypt_blobs(blobs, keyring)
    dt3 = time.perf_counter() - t3

    # Stage 4: Binding
    t4 = time.perf_counter()
    binding_hash = bind(encrypted, keyring.binding_key)
    dt4 = time.perf_counter() - t4

    # Build original filenames map for packaging
    original_filenames: dict[ModalityType, str] = {
        blob.modality_type: blob.original_filename for blob in blobs
    }

    # Stage 5: Package
    t5 = time.perf_counter()
    bundle_path, keyring_path = package_bundle(
        encrypted, keyring, binding_hash, original_filenames, output_dir
    )
    dt5 = time.perf_counter() - t5

    dt_total = time.perf_counter() - t_start

    logger.info(
        "[PIPELINE] Encryption complete in %.3fs "
        "(ingest=%.3fs, keygen=%.3fs, encrypt=%.3fs, "
        "bind=%.3fs, package=%.3fs)",
        dt_total, dt1, dt2, dt3, dt4, dt5,
    )
    logger.info(
        "[PIPELINE] Output: %s | Keys: %s",
        bundle_path.name,
        keyring_path.name,
    )

    return bundle_path, keyring_path
