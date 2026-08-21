"""Cryptographic utility wrappers for the CryptoFlow pipeline.

Provides thin, auditable wrappers around the ``cryptography`` library's
AES-GCM and HMAC-SHA-256 primitives, plus key/IV/HMAC-key generation
helpers.  Every function in this module is deterministic (except the
``generate_*`` family) and raises only CryptoFlow-domain exceptions.
"""

from __future__ import annotations

import hmac as _hmac_mod
import logging
import os
from typing import TYPE_CHECKING

from cryptography.exceptions import InvalidTag
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.hmac import HMAC

from cryptoflow.exceptions import AuthTagMismatchError

if TYPE_CHECKING:
    from cryptoflow.models.bundle import EncryptedBlob

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Key / IV size constants (duplicated here for self-contained docs)
# ---------------------------------------------------------------------------
AES_KEY_BYTES: int = 32   # AES-256
GCM_IV_BYTES: int = 12    # 96-bit nonce
GCM_TAG_BYTES: int = 16   # 128-bit auth tag
HMAC_KEY_BYTES: int = 32  # HMAC-SHA-256


# ---------------------------------------------------------------------------
# AES-GCM encryption / decryption
# ---------------------------------------------------------------------------

def aes_gcm_encrypt(
    key: bytes,
    iv: bytes,
    plaintext: bytes,
) -> tuple[bytes, bytes]:
    """Encrypt *plaintext* with AES-256-GCM.

    Args:
        key: 32-byte AES-256 secret key.
        iv: 12-byte GCM nonce.  **Must never be reused** with the
            same *key*.
        plaintext: Arbitrary-length data to encrypt.

    Returns:
        A ``(ciphertext, auth_tag)`` tuple where *ciphertext* is the
        encrypted payload and *auth_tag* is the 16-byte GCM
        authentication tag.

    Note:
        The ``cryptography`` library returns ``ciphertext || tag`` as
        a single buffer.  This function splits the last 16 bytes off
        so callers can store the tag separately.
    """
    aes = AESGCM(key)
    # cryptography returns ciphertext || 16-byte tag
    combined: bytes = aes.encrypt(iv, plaintext, None)
    ciphertext = combined[:-GCM_TAG_BYTES]
    auth_tag = combined[-GCM_TAG_BYTES:]
    return ciphertext, auth_tag


def aes_gcm_decrypt(
    key: bytes,
    iv: bytes,
    ciphertext: bytes,
    auth_tag: bytes,
) -> bytes:
    """Decrypt *ciphertext* with AES-256-GCM and verify the tag.

    Args:
        key: 32-byte AES-256 secret key (same key used to encrypt).
        iv: 12-byte GCM nonce (same nonce used to encrypt).
        ciphertext: Encrypted payload (without the appended tag).
        auth_tag: 16-byte GCM authentication tag produced during
            encryption.

    Returns:
        The original plaintext bytes.

    Raises:
        AuthTagMismatchError: If the authentication tag does not
            verify, indicating that the ciphertext, IV, or tag has
            been tampered with since encryption.
    """
    aes = AESGCM(key)
    # Reconstruct the combined format the library expects
    combined = ciphertext + auth_tag
    try:
        return aes.decrypt(iv, combined, None)
    except InvalidTag as exc:
        raise AuthTagMismatchError(
            "GCM authentication tag verification failed — "
            "ciphertext may have been tampered with"
        ) from exc


# ---------------------------------------------------------------------------
# HMAC-SHA-256 binding hash
# ---------------------------------------------------------------------------

def compute_binding_hash(
    binding_key: bytes,
    encrypted_blobs: list[EncryptedBlob],
) -> bytes:
    """Compute the cross-modal HMAC-SHA-256 binding hash.

    The hash covers every encrypted blob in a deterministic order
    (sorted by ``modality_type.value``) so that the receiver can
    recompute and compare regardless of the order the blobs were
    originally produced.

    For each blob the function feeds::

        ciphertext || auth_tag || iv

    into a single HMAC context keyed by *binding_key*.

    Args:
        binding_key: 32-byte HMAC key shared between sender and
            receiver.
        encrypted_blobs: Encrypted blobs to bind together.

    Returns:
        32-byte HMAC-SHA-256 digest.
    """
    # Deterministic ordering by modality enum value
    sorted_blobs = sorted(
        encrypted_blobs,
        key=lambda b: b.modality_type.value,
    )
    h = HMAC(binding_key, hashes.SHA256())
    for blob in sorted_blobs:
        h.update(blob.ciphertext)
        h.update(blob.auth_tag)
        h.update(blob.iv)
    return h.finalize()


def verify_binding_hash(
    binding_key: bytes,
    encrypted_blobs: list[EncryptedBlob],
    expected_hash: bytes,
) -> bool:
    """Recompute the binding hash and compare in constant time.

    Args:
        binding_key: 32-byte HMAC key.
        encrypted_blobs: The set of encrypted blobs to verify.
        expected_hash: The 32-byte digest originally stored in the
            bundle manifest.

    Returns:
        ``True`` if the recomputed hash matches *expected_hash*;
        ``False`` otherwise.  The comparison uses
        :func:`hmac.compare_digest` to prevent timing side-channels.
    """
    actual = compute_binding_hash(binding_key, encrypted_blobs)
    return _hmac_mod.compare_digest(actual, expected_hash)


# ---------------------------------------------------------------------------
# Key / IV / HMAC-key generation
# ---------------------------------------------------------------------------

def generate_aes_key() -> bytes:
    """Generate a cryptographically random 32-byte AES-256 key.

    Uses :func:`os.urandom` which draws from the operating system's
    CSPRNG (e.g. ``/dev/urandom`` on Linux, ``CryptGenRandom`` on
    Windows).

    Returns:
        32 random bytes suitable for use as an AES-256 key.
    """
    return os.urandom(AES_KEY_BYTES)


def generate_iv() -> bytes:
    """Generate a cryptographically random 12-byte GCM nonce.

    Each nonce **must** be unique for a given key.  With 96-bit
    random nonces the birthday-bound collision probability stays
    negligible for realistic workloads (< 2³² encryptions per key).

    Returns:
        12 random bytes suitable for use as a GCM initialisation
        vector.
    """
    return os.urandom(GCM_IV_BYTES)


def generate_hmac_key() -> bytes:
    """Generate a cryptographically random 32-byte HMAC-SHA-256 key.

    Returns:
        32 random bytes suitable for use as an HMAC-SHA-256 binding
        key.
    """
    return os.urandom(HMAC_KEY_BYTES)
