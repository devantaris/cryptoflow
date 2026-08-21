"""Data models, configuration schemas, and domain entities.

Re-exports every public name from :mod:`cryptoflow.models.modality`
and :mod:`cryptoflow.models.bundle` so callers can write::

    from cryptoflow.models import ModalityType, BundleManifest
"""

from __future__ import annotations

# -- modality types & constants ------------------------------------
from cryptoflow.models.modality import (
    HEADER_MAGIC,
    HEADER_SIZE,
    MAX_FILE_SIZE,
    MIME_MAP,
    MIME_TYPES,
    ModalityType,
    NormalizedBlob,
    RawModality,
)

# -- bundle types & constants --------------------------------------
from cryptoflow.models.bundle import (
    AES_KEY_SIZE,
    BINDING_HASH_SIZE,
    BUNDLE_HEADER_SIZE,
    BUNDLE_MAGIC,
    BUNDLE_VERSION,
    GCM_IV_SIZE,
    GCM_TAG_SIZE,
    HMAC_KEY_SIZE,
    BundleManifest,
    EncryptedBlob,
    EncryptionKey,
    KeyRing,
    ModalityEntry,
)

__all__: list[str] = [
    # modality.py
    "HEADER_MAGIC",
    "HEADER_SIZE",
    "MAX_FILE_SIZE",
    "MIME_MAP",
    "MIME_TYPES",
    "ModalityType",
    "NormalizedBlob",
    "RawModality",
    # bundle.py
    "AES_KEY_SIZE",
    "BINDING_HASH_SIZE",
    "BUNDLE_HEADER_SIZE",
    "BUNDLE_MAGIC",
    "BUNDLE_VERSION",
    "GCM_IV_SIZE",
    "GCM_TAG_SIZE",
    "HMAC_KEY_SIZE",
    "BundleManifest",
    "EncryptedBlob",
    "EncryptionKey",
    "KeyRing",
    "ModalityEntry",
]
