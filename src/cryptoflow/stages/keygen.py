"""Stage 2 -- Generate unique cryptographic keys per modality.

Each file in the bundle receives its own AES-256 key and GCM nonce,
plus a shared HMAC-SHA-256 binding key is created for the cross-modal
integrity hash.
"""

from __future__ import annotations

import logging

from cryptoflow.models.bundle import EncryptionKey, KeyRing
from cryptoflow.models.modality import NormalizedBlob
from cryptoflow.utils.crypto import (
    generate_aes_key,
    generate_hmac_key,
    generate_iv,
)

logger = logging.getLogger(__name__)


def generate_keys(blobs: list[NormalizedBlob]) -> KeyRing:
    """Generate a fresh set of per-modality keys and a binding key.

    Args:
        blobs: Normalised blobs from the ingest stage.  One key
            is created per blob.

    Returns:
        A :class:`KeyRing` with a unique bundle ID, one
        :class:`EncryptionKey` per modality, and a 32-byte
        HMAC binding key.
    """
    keys: list[EncryptionKey] = []

    for blob in blobs:
        key = EncryptionKey(
            key=generate_aes_key(),
            iv=generate_iv(),
            modality_type=blob.modality_type,
        )
        keys.append(key)
        logger.info(
            "[KEYGEN] Generated AES-256 key for %s "
            "(key=%s... iv=%s...)",
            blob.modality_type.value,
            key.key.hex()[:8],
            key.iv.hex()[:8],
        )

    binding_key = generate_hmac_key()
    keyring = KeyRing.create(keys=keys, binding_key=binding_key)

    logger.info(
        "[KEYGEN] KeyRing ready: %d keys + 1 HMAC binding key "
        "(bundle=%s)",
        len(keys),
        keyring.bundle_id[:8],
    )
    return keyring
