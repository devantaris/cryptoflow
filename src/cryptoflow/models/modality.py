"""Modality definitions and normalization types for CryptoFlow.

Provides the foundational types that represent medical data files
before and after the normalisation stage. Each file entering the
pipeline is tagged with a :class:`ModalityType`, wrapped in a
:class:`RawModality`, and later converted to a :class:`NormalizedBlob`
with a fixed-size typed header.
"""

from __future__ import annotations

import enum
from dataclasses import dataclass

# ---------------------------------------------------------------------------
# Header / size constants
# ---------------------------------------------------------------------------

HEADER_SIZE: int = 64
"""Fixed byte-length of every :class:`NormalizedBlob` header."""

HEADER_MAGIC: bytes = b"CFBLB\x00"  # 6 bytes
"""Magic bytes that open every normalised blob header."""

MAX_FILE_SIZE: int = 500 * 1024 * 1024  # 500 MB
"""Hard cap on individual input files to prevent OOM."""


# ---------------------------------------------------------------------------
# Extension → modality / MIME maps
# ---------------------------------------------------------------------------

class ModalityType(enum.Enum):
    """Supported medical-data modality categories.

    Each variant maps to a family of file formats that share
    encryption and normalisation semantics.
    """

    IMAGE = "image"        # DICOM, PNG, JPEG, TIFF
    TEXT = "text"          # TXT, PDF
    METADATA = "metadata"  # JSON


MIME_MAP: dict[str, ModalityType] = {
    ".dcm": ModalityType.IMAGE,
    ".dicom": ModalityType.IMAGE,
    ".png": ModalityType.IMAGE,
    ".jpg": ModalityType.IMAGE,
    ".jpeg": ModalityType.IMAGE,
    ".tiff": ModalityType.IMAGE,
    ".tif": ModalityType.IMAGE,
    ".txt": ModalityType.TEXT,
    ".pdf": ModalityType.TEXT,
    ".json": ModalityType.METADATA,
}
"""Map lower-case file extensions to their :class:`ModalityType`."""

MIME_TYPES: dict[str, str] = {
    ".dcm": "application/dicom",
    ".dicom": "application/dicom",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".tiff": "image/tiff",
    ".tif": "image/tiff",
    ".txt": "text/plain",
    ".pdf": "application/pdf",
    ".json": "application/json",
}
"""Map lower-case file extensions to their IANA MIME type string."""


# ---------------------------------------------------------------------------
# Pre-processing data model
# ---------------------------------------------------------------------------

@dataclass(frozen=True, slots=True)
class RawModality:
    """A single input file before any pipeline processing.

    Attributes:
        modality_type: The category this file belongs to.
        filename: Original filename (basename only).
        raw_bytes: Unmodified file content.
        mime_type: IANA MIME type string, e.g. ``"image/png"``.
    """

    modality_type: ModalityType
    filename: str
    raw_bytes: bytes
    mime_type: str

    @property
    def size_bytes(self) -> int:
        """Return the length of the raw file content in bytes."""
        return len(self.raw_bytes)


# ---------------------------------------------------------------------------
# Stage-1 output data model
# ---------------------------------------------------------------------------

@dataclass(frozen=True, slots=True)
class NormalizedBlob:
    """Stage-1 output: uniform binary blob with a typed header.

    The header is a fixed ``HEADER_SIZE``-byte block that carries
    modality metadata so downstream stages can identify the blob
    without parsing the payload.

    Attributes:
        modality_type: The category this blob belongs to.
        header: Fixed 64-byte typed header prepended to payload.
        payload: The raw file bytes (unchanged from input).
        original_filename: Basename of the source file.
        original_size: Byte-length of the source file.
    """

    modality_type: ModalityType
    header: bytes
    payload: bytes
    original_filename: str
    original_size: int

    @property
    def total_bytes(self) -> bytes:
        """Return the complete blob (header ∥ payload) as bytes."""
        return self.header + self.payload

    @property
    def total_size(self) -> int:
        """Return the combined byte-length of header + payload."""
        return len(self.header) + len(self.payload)
