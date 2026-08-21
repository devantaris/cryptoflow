"""File I/O and modality-detection utilities for CryptoFlow.

Provides safe file reading/writing, directory creation, extension-based
modality detection, MIME type lookup, and human-readable size formatting.
All file operations raise :class:`IngestError` on failure so that the
pipeline never leaks raw ``OSError`` / ``FileNotFoundError`` instances.
"""

from __future__ import annotations

import logging
from pathlib import Path

from cryptoflow.exceptions import IngestError
from cryptoflow.models.modality import (
    MIME_MAP,
    MIME_TYPES,
    ModalityType,
)

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Size-formatting constants
# ---------------------------------------------------------------------------
_SIZE_UNITS: list[str] = ["B", "KB", "MB", "GB", "TB"]
_KILO: float = 1024.0

# Default MIME type when the extension is unknown
_FALLBACK_MIME: str = "application/octet-stream"


# ---------------------------------------------------------------------------
# File I/O
# ---------------------------------------------------------------------------

def read_file(path: Path) -> bytes:
    """Read the entire contents of *path* as raw bytes.

    Args:
        path: Filesystem path to read.

    Returns:
        The complete file content as a ``bytes`` object.

    Raises:
        IngestError: If the file does not exist, is a directory,
            or cannot be read due to permission / OS errors.
    """
    try:
        return path.read_bytes()
    except FileNotFoundError as exc:
        raise IngestError(
            f"File not found: {path}"
        ) from exc
    except IsADirectoryError as exc:
        raise IngestError(
            f"Path is a directory, not a file: {path}"
        ) from exc
    except PermissionError as exc:
        raise IngestError(
            f"Permission denied reading file: {path}"
        ) from exc
    except OSError as exc:
        raise IngestError(
            f"Cannot read file {path}: {exc}"
        ) from exc


def write_file(path: Path, data: bytes) -> None:
    """Write *data* to *path*, creating parent directories as needed.

    Args:
        path: Destination filesystem path.
        data: Raw bytes to write.

    Raises:
        IngestError: If the write fails due to permission / OS
            errors.
    """
    try:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)
    except PermissionError as exc:
        raise IngestError(
            f"Permission denied writing file: {path}"
        ) from exc
    except OSError as exc:
        raise IngestError(
            f"Cannot write file {path}: {exc}"
        ) from exc


def ensure_dir(path: Path) -> None:
    """Create *path* (and parents) if it does not already exist.

    Args:
        path: Directory path to ensure.

    Raises:
        IngestError: If directory creation fails.
    """
    try:
        path.mkdir(parents=True, exist_ok=True)
    except OSError as exc:
        raise IngestError(
            f"Cannot create directory {path}: {exc}"
        ) from exc


# ---------------------------------------------------------------------------
# Modality / MIME detection
# ---------------------------------------------------------------------------

def detect_modality(path: Path) -> ModalityType:
    """Detect the :class:`ModalityType` of *path* from its extension.

    The lookup is case-insensitive and uses the ``MIME_MAP`` table
    defined in :mod:`cryptoflow.models.modality`.

    Args:
        path: File path whose extension to inspect.

    Returns:
        The matching :class:`ModalityType`.

    Raises:
        IngestError: If the file extension is not in ``MIME_MAP``.
    """
    suffix = path.suffix.lower()
    try:
        return MIME_MAP[suffix]
    except KeyError as exc:
        supported = ", ".join(sorted(MIME_MAP))
        raise IngestError(
            f"Unsupported file extension '{suffix}' for "
            f"{path.name}. Supported: {supported}"
        ) from exc


def detect_mime_type(path: Path) -> str:
    """Detect the IANA MIME type of *path* from its extension.

    Falls back to ``"application/octet-stream"`` for unknown
    extensions rather than raising, since MIME type is informational.

    Args:
        path: File path whose extension to inspect.

    Returns:
        A MIME type string such as ``"image/png"`` or
        ``"application/json"``.
    """
    suffix = path.suffix.lower()
    return MIME_TYPES.get(suffix, _FALLBACK_MIME)


# ---------------------------------------------------------------------------
# Formatting helpers
# ---------------------------------------------------------------------------

def format_size(size_bytes: int) -> str:
    """Format *size_bytes* as a human-readable string.

    Uses binary (1024-based) units and rounds to one decimal place.

    Args:
        size_bytes: Non-negative byte count.

    Returns:
        A string such as ``"24.5 MB"`` or ``"128 B"``.

    Examples:
        >>> format_size(0)
        '0 B'
        >>> format_size(1024)
        '1.0 KB'
        >>> format_size(25_690_112)
        '24.5 MB'
    """
    if size_bytes == 0:
        return "0 B"

    value = float(size_bytes)
    for unit in _SIZE_UNITS[:-1]:
        if abs(value) < _KILO:
            # Whole-number bytes don't need a decimal
            if unit == "B":
                return f"{int(value)} {unit}"
            return f"{value:.1f} {unit}"
        value /= _KILO

    # Reached TB (or beyond)
    return f"{value:.1f} {_SIZE_UNITS[-1]}"
