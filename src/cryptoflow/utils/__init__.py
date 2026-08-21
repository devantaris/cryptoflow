"""Utility functions, helpers, and common operational tools.

Re-exports the most commonly used helpers from :mod:`~.crypto` and
:mod:`~.io` so callers can write::

    from cryptoflow.utils import aes_gcm_encrypt, read_file
"""

from __future__ import annotations

from cryptoflow.utils.crypto import (
    aes_gcm_decrypt,
    aes_gcm_encrypt,
    compute_binding_hash,
    generate_aes_key,
    generate_hmac_key,
    generate_iv,
    verify_binding_hash,
)
from cryptoflow.utils.io import (
    detect_mime_type,
    detect_modality,
    ensure_dir,
    format_size,
    read_file,
    write_file,
)

__all__ = [
    # crypto
    "aes_gcm_decrypt",
    "aes_gcm_encrypt",
    "compute_binding_hash",
    "generate_aes_key",
    "generate_hmac_key",
    "generate_iv",
    "verify_binding_hash",
    # io
    "detect_mime_type",
    "detect_modality",
    "ensure_dir",
    "format_size",
    "read_file",
    "write_file",
]
