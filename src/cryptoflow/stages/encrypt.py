"""Stage 3 -- Encrypt each normalised blob with AES-256-GCM.

Each blob is encrypted with its own unique key from the KeyRing.
The GCM mode provides both confidentiality and a per-file
authentication tag for tamper detection.
"""

from __future__ import annotations

import logging

from cryptoflow.exceptions import EncryptionError
from cryptoflow.models.bundle import EncryptedBlob, EncryptionKey, KeyRing
from cryptoflow.models.modality import ModalityType, NormalizedBlob
from cryptoflow.utils.crypto import aes_gcm_encrypt
from cryptoflow.utils.io import format_size

logger = logging.getLogger(__name__)


def encrypt_blobs(
    blobs: list[NormalizedBlob],
    keyring: KeyRing,
) -> list[EncryptedBlob]:
    """Encrypt every normalised blob using AES-256-GCM.

    The plaintext for each blob is ``header || payload`` (the full
    normalised content).  This ensures the typed header is also
    covered by the GCM authentication tag.

    Args:
        blobs: Normalised blobs from the ingest stage, sorted by
            modality type.
        keyring: KeyRing containing one key per modality.

    Returns:
        List of :class:`EncryptedBlob` in the same modality order.

    Raises:
        EncryptionError: If a modality has no matching key in the
            keyring.
    """
    # Build lookup: modality_type -> EncryptionKey
    key_map: dict[ModalityType, EncryptionKey] = {
        k.modality_type: k for k in keyring.keys
    }

    encrypted: list[EncryptedBlob] = []

    for blob in sorted(blobs, key=lambda b: b.modality_type.value):
        enc_key = key_map.get(blob.modality_type)
        if enc_key is None:
            raise EncryptionError(
                f"No key found for modality {blob.modality_type.value}"
            )

        # Plaintext = header + payload (entire normalised blob)
        plaintext = blob.total_bytes

        ciphertext, auth_tag = aes_gcm_encrypt(
            enc_key.key, enc_key.iv, plaintext
        )

        enc_blob = EncryptedBlob(
            ciphertext=ciphertext,
            auth_tag=auth_tag,
            iv=enc_key.iv,
            modality_type=blob.modality_type,
            original_size=blob.original_size,
        )
        encrypted.append(enc_blob)

        logger.info(
            "[ENCRYPT] %s: %s plaintext -> %s ciphertext "
            "(tag=%s...)",
            blob.modality_type.value,
            format_size(len(plaintext)),
            format_size(len(ciphertext)),
            auth_tag.hex()[:8],
        )

    logger.info(
        "[ENCRYPT] Encrypted %d blobs, total ciphertext %s",
        len(encrypted),
        format_size(sum(len(e.ciphertext) for e in encrypted)),
    )
    return encrypted
