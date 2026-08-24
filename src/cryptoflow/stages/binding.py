"""Stage 4 -- Cross-modal binding via HMAC-SHA-256.

Computes a single cryptographic hash over ALL encrypted blobs,
welding them into an atomic unit.  Swapping, injecting, or
deleting any single file changes this hash, making the tampering
detectable.
"""

from __future__ import annotations

import logging

from cryptoflow.models.bundle import EncryptedBlob
from cryptoflow.utils.crypto import compute_binding_hash, verify_binding_hash

logger = logging.getLogger(__name__)


def bind(
    encrypted_blobs: list[EncryptedBlob],
    binding_key: bytes,
) -> tuple[bytes, dict]:
    """Compute the cross-modal HMAC-SHA-256 binding hash and details."""
    binding_hash = compute_binding_hash(binding_key, encrypted_blobs)

    details = {
        "modalities": [blob.modality_type.value for blob in encrypted_blobs],
        "count": len(encrypted_blobs)
    }

    logger.info(
        "[BIND] Binding hash computed over %d blobs: %s...",
        len(encrypted_blobs),
        binding_hash.hex()[:16],
    )
    return binding_hash, details


def verify_binding(
    encrypted_blobs: list[EncryptedBlob],
    binding_key: bytes,
    expected_hash: bytes,
) -> bool:
    """Verify the cross-modal binding hash.

    Args:
        encrypted_blobs: The encrypted blobs to verify.
        binding_key: 32-byte HMAC key from the KeyRing.
        expected_hash: The hash stored in the bundle manifest.

    Returns:
        ``True`` if the binding is intact; ``False`` if any blob
        has been swapped, tampered, injected, or deleted.
    """
    is_valid = verify_binding_hash(
        binding_key, encrypted_blobs, expected_hash
    )

    if is_valid:
        logger.info("[BIND] Binding verification PASSED")
    else:
        logger.error(
            "[BIND] Binding verification FAILED -- "
            "files may have been swapped or tampered"
        )
    return is_valid
