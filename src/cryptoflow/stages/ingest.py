"""Stage 1 — Ingest and normalise raw medical files.

Reads each input file, validates constraints (size, format), and
wraps each one in a :class:`NormalizedBlob` with a fixed 64-byte
typed header so downstream stages can treat all modalities uniformly.
"""

from __future__ import annotations

import logging
import struct
from pathlib import Path

from cryptoflow.exceptions import IngestError
from cryptoflow.models.modality import (
    HEADER_MAGIC,
    HEADER_SIZE,
    MAX_FILE_SIZE,
    ModalityType,
    NormalizedBlob,
    RawModality,
)
from cryptoflow.utils.io import detect_mime_type, format_size, read_file

logger = logging.getLogger(__name__)

# Modality type -> uint8 index for the binary header
_MODALITY_INDEX: dict[ModalityType, int] = {
    ModalityType.IMAGE: 0,
    ModalityType.TEXT: 1,
    ModalityType.METADATA: 2,
}


def _build_header(
    modality_type: ModalityType,
    original_size: int,
    filename: str,
) -> bytes:
    """Build a 64-byte typed header for a normalised blob.

    Layout::

        [0:6]   HEADER_MAGIC ("CFBLB\\x00")
        [6:7]   Modality type index (uint8)
        [7:11]  Original file size (uint32 LE)
        [11:64] Filename (UTF-8, null-padded to 53 bytes)

    Args:
        modality_type: Category of the file.
        original_size: Byte-length of the raw file content.
        filename: Original basename (truncated to 53 bytes).

    Returns:
        Exactly 64 bytes.
    """
    mod_idx = _MODALITY_INDEX[modality_type]

    # Pack fixed fields: magic(6) + uint8(1) + uint32_LE(4) = 11 bytes
    fixed = HEADER_MAGIC + struct.pack("<BI", mod_idx, original_size)

    # Filename field: 53 bytes, UTF-8, null-padded
    fname_bytes = filename.encode("utf-8")[:53]
    fname_field = fname_bytes.ljust(53, b"\x00")

    header = fixed + fname_field
    assert len(header) == HEADER_SIZE
    return header


def ingest(
    file_paths: dict[ModalityType, Path],
) -> list[NormalizedBlob]:
    """Ingest and normalise input files into binary blobs.

    Args:
        file_paths: Mapping of modality type to filesystem path.
            Must contain at least one entry.

    Returns:
        List of :class:`NormalizedBlob` sorted by modality type
        value for deterministic pipeline ordering.

    Raises:
        IngestError: If any file is missing, empty, too large,
            or cannot be read.
    """
    if not file_paths:
        raise IngestError("No input files provided")

    blobs: list[NormalizedBlob] = []

    for modality_type, path in file_paths.items():
        path = Path(path)
        logger.info(
            "[INGEST] Reading %s: %s", modality_type.value, path.name
        )

        raw_bytes = read_file(path)

        if len(raw_bytes) == 0:
            raise IngestError(f"File is empty: {path}")
        if len(raw_bytes) > MAX_FILE_SIZE:
            raise IngestError(
                f"File too large: {path} "
                f"({format_size(len(raw_bytes))} > "
                f"{format_size(MAX_FILE_SIZE)})"
            )

        mime_type = detect_mime_type(path)
        filename = path.name

        raw = RawModality(
            modality_type=modality_type,
            filename=filename,
            raw_bytes=raw_bytes,
            mime_type=mime_type,
        )

        header = _build_header(modality_type, raw.size_bytes, filename)

        blob = NormalizedBlob(
            modality_type=modality_type,
            header=header,
            payload=raw_bytes,
            original_filename=filename,
            original_size=raw.size_bytes,
        )
        blobs.append(blob)

        logger.info(
            "[INGEST] %s: %s -> blob %s (header %d + payload %d)",
            modality_type.value,
            filename,
            format_size(blob.total_size),
            len(header),
            len(raw_bytes),
        )

    # Deterministic ordering
    blobs.sort(key=lambda b: b.modality_type.value)

    logger.info(
        "[INGEST] Ingested %d files, total %s",
        len(blobs),
        format_size(sum(b.total_size for b in blobs)),
    )
    return blobs
