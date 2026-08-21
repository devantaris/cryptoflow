"""Custom exception hierarchy for the CryptoFlow pipeline.

Every CryptoFlow-specific error inherits from :class:`CryptoFlowError`
so callers can catch the entire family with a single ``except`` clause.
Leaf classes map to the concrete failure modes encountered during
ingestion, key generation, encryption, decryption, and verification.
"""

from __future__ import annotations


class CryptoFlowError(Exception):
    """Base exception for all CryptoFlow errors.

    All domain-specific exceptions inherit from this class, allowing
    callers to catch every CryptoFlow failure with a single handler
    while still being able to discriminate by subclass when finer
    control is needed.
    """


class IngestError(CryptoFlowError):
    """Raised when Stage-1 (Ingest) cannot consume an input file.

    Typical triggers:
    * File not found on disk.
    * File is not readable (permissions).
    * File exceeds ``MAX_FILE_SIZE`` (500 MB).
    * File extension is not in ``MIME_MAP`` (unsupported format).
    """


class KeyGenerationError(CryptoFlowError):
    """Raised when Stage-2 (Key Management) fails to produce keys.

    Typical triggers:
    * The OS CSPRNG (``os.urandom``) is unavailable or blocked.
    * A generated key or IV has an unexpected length (defensive
      check against platform bugs).
    """


class EncryptionError(CryptoFlowError):
    """Raised when Stage-3 (Encrypt) cannot complete AES-GCM encryption.

    Typical triggers:
    * Key or IV size rejected by the underlying ``AESGCM`` primitive.
    * Plaintext payload is empty or exceeds GCM length limits.
    * An unexpected low-level ``cryptography`` library error occurs
      during the ``encrypt`` call.
    """


class DecryptionError(CryptoFlowError):
    """Raised when decryption cannot complete successfully.

    Typical triggers:
    * Ciphertext or IV is truncated or missing.
    * The ``AESGCM.decrypt`` call fails for reasons other than an
      authentication-tag mismatch (e.g. wrong key length).
    * An unexpected low-level ``cryptography`` library error occurs.
    """


class AuthTagMismatchError(CryptoFlowError):
    """Raised when the GCM authentication tag does not verify.

    This indicates **single-file tampering**: the ciphertext, IV, or
    tag has been altered after encryption.  The integrity of the
    individual file is compromised — decryption must be refused.

    Maps to ``cryptography.exceptions.InvalidTag`` caught during
    ``AESGCM.decrypt``.
    """


class BindingMismatchError(CryptoFlowError):
    """Raised when the cross-modal HMAC binding hash does not match.

    This indicates a **multi-file integrity violation**: one or more
    encrypted blobs have been swapped, injected, deleted, or
    reordered since the bundle was sealed.  Even if every individual
    GCM auth-tag verifies, a binding mismatch means the *set* of
    files is no longer the original set.

    Examples of detected attacks:
    * File-swap (Patient A's scan with Patient B's report).
    * Silent injection of an extra modality.
    * Deletion of a modality from the bundle.
    """


class InvalidBundleError(CryptoFlowError):
    """Raised when a bundle file cannot be parsed or loaded.

    Typical triggers:
    * Missing or incorrect ``BUNDLE_MAGIC`` header bytes.
    * Unexpected bundle format version.
    * Manifest JSON is malformed, truncated, or missing fields.
    * Declared ``total_size`` does not match actual file size.
    """


class KeyMismatchError(CryptoFlowError):
    """Raised when the supplied keyring does not match the bundle.

    Typical triggers:
    * The ``bundle_id`` in the :class:`KeyRing` differs from the
      ``bundle_id`` in the :class:`BundleManifest`.
    * The keyring contains a different number of keys than the
      bundle has modality entries.
    * A key's ``modality_type`` does not match the corresponding
      bundle modality entry.
    """
