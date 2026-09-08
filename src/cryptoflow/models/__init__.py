"""Data models, configuration schemas, and domain entities.

Re-exports every public name from :mod:`cryptoflow.models.modality`,
:mod:`cryptoflow.models.bundle`, and :mod:`cryptoflow.models.uncertainty`
so callers can write::

    from cryptoflow.models import ModalityType, BundleManifest, UncertaintyReport
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

# -- uncertainty types ---------------------------------------------
from cryptoflow.models.uncertainty import (
    DELResult,
    DSTResult,
    FeatureVector,
    FusionResult,
    ModalityAssessment,
    TheoryComparison,
    UncertaintyReport,
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
    # uncertainty.py
    "DELResult",
    "DSTResult",
    "FeatureVector",
    "FusionResult",
    "ModalityAssessment",
    "TheoryComparison",
    "UncertaintyReport",
]
