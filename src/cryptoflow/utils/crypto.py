"""Cryptographic utility wrappers for the CryptoFlow pipeline.

Provides thin, auditable wrappers around the ``cryptography`` library's
AES-GCM, HMAC-SHA-256, and RSA-OAEP hybrid key encapsulation primitives,
plus key/IV/HMAC-key generation helpers.
"""

from __future__ import annotations

import hmac as _hmac_mod
import json
import logging
import os
from typing import TYPE_CHECKING

from cryptography.exceptions import InvalidTag
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding, rsa
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.hmac import HMAC

from cryptoflow.exceptions import AuthTagMismatchError, KeyMismatchError

if TYPE_CHECKING:
    from cryptoflow.models.bundle import EncryptedBlob

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Key / IV size constants
# ---------------------------------------------------------------------------
AES_KEY_BYTES: int = 32   # AES-256
GCM_IV_BYTES: int = 12    # 96-bit nonce
GCM_TAG_BYTES: int = 16   # 128-bit auth tag
HMAC_KEY_BYTES: int = 32  # HMAC-SHA-256
RSA_DEFAULT_BITS: int = 2048


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
        iv: 12-byte GCM nonce. Must never be reused with the same key.
        plaintext: Arbitrary-length data to encrypt.

    Returns:
        A ``(ciphertext, auth_tag)`` tuple where *ciphertext* is the
        encrypted payload and *auth_tag* is the 16-byte GCM authentication tag.
    """
    aes = AESGCM(key)
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
        key: 32-byte AES-256 secret key.
        iv: 12-byte GCM nonce.
        ciphertext: Encrypted payload.
        auth_tag: 16-byte GCM authentication tag.

    Returns:
        Original plaintext bytes.

    Raises:
        AuthTagMismatchError: If the tag verification fails.
    """
    aes = AESGCM(key)
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
    """Compute cross-modal HMAC-SHA-256 binding hash over sorted blobs."""
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
    """Recompute the binding hash and compare in constant time."""
    actual = compute_binding_hash(binding_key, encrypted_blobs)
    return _hmac_mod.compare_digest(actual, expected_hash)


# ---------------------------------------------------------------------------
# Key / IV generation
# ---------------------------------------------------------------------------

def generate_aes_key() -> bytes:
    """Generate a cryptographically random 32-byte AES-256 key."""
    return os.urandom(AES_KEY_BYTES)


def generate_iv() -> bytes:
    """Generate a cryptographically random 12-byte GCM nonce."""
    return os.urandom(GCM_IV_BYTES)


def generate_hmac_key() -> bytes:
    """Generate a cryptographically random 32-byte HMAC-SHA-256 key."""
    return os.urandom(HMAC_KEY_BYTES)


# ---------------------------------------------------------------------------
# RSA-OAEP Hybrid Key Encapsulation (Digital Envelope)
# ---------------------------------------------------------------------------

def generate_rsa_keypair(key_size: int = RSA_DEFAULT_BITS) -> tuple[bytes, bytes]:
    """Generate an RSA keypair for asymmetric recipient key wrapping.

    Args:
        key_size: RSA modulus bits (default: 2048).

    Returns:
        Tuple of (private_key_pem_bytes, public_key_pem_bytes).
    """
    private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=key_size,
    )
    private_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    )
    public_pem = private_key.public_key().public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo,
    )
    return private_pem, public_pem


def wrap_keyring_payload(
    keyring_json_bytes: bytes,
    recipient_pubkey_pem: bytes,
) -> dict[str, str]:
    """Encapsulate and encrypt a KeyRing JSON payload using RSA-OAEP hybrid envelope.

    Args:
        keyring_json_bytes: Raw plaintext KeyRing JSON bytes.
        recipient_pubkey_pem: Recipient's RSA public key in PEM format.

    Returns:
        Dictionary containing the wrapped digital envelope:
        - encrypted_dek (hex)
        - iv (hex)
        - auth_tag (hex)
        - ciphertext (hex)
        - algorithm: "RSA-OAEP-SHA256+AES-256-GCM"
    """
    pubkey = serialization.load_pem_public_key(recipient_pubkey_pem)
    if not isinstance(pubkey, rsa.RSAPublicKey):
        raise KeyMismatchError("Recipient public key must be an RSA public key.")

    # 1. Ephemeral symmetric Data Encapsulation Key (DEK)
    ephemeral_dek = generate_aes_key()
    ephemeral_iv = generate_iv()

    # 2. Encrypt KeyRing JSON payload with AES-256-GCM
    ciphertext, auth_tag = aes_gcm_encrypt(ephemeral_dek, ephemeral_iv, keyring_json_bytes)

    # 3. Encrypt the ephemeral DEK with recipient's RSA public key (RSA-OAEP with SHA-256)
    encrypted_dek = pubkey.encrypt(
        ephemeral_dek,
        padding.OAEP(
            mgf=padding.MGF1(algorithm=hashes.SHA256()),
            algorithm=hashes.SHA256(),
            label=None,
        ),
    )

    return {
        "algorithm": "RSA-OAEP-SHA256+AES-256-GCM",
        "encrypted_dek": encrypted_dek.hex(),
        "iv": ephemeral_iv.hex(),
        "auth_tag": auth_tag.hex(),
        "ciphertext": ciphertext.hex(),
    }


def unwrap_keyring_payload(
    envelope: dict[str, str],
    private_key_pem: bytes,
    passphrase: bytes | None = None,
) -> bytes:
    """Decapsulate an RSA-OAEP hybrid digital envelope into plaintext KeyRing bytes.

    Args:
        envelope: Dictionary produced by ``wrap_keyring_payload``.
        private_key_pem: Recipient's RSA private key in PEM format.
        passphrase: Optional passphrase for encrypted private keys.

    Returns:
        Original plaintext KeyRing JSON bytes.

    Raises:
        KeyMismatchError: If private key cannot decrypt the DEK.
        AuthTagMismatchError: If the envelope ciphertext has been tampered with.
    """
    try:
        privkey = serialization.load_pem_private_key(private_key_pem, password=passphrase)
    except Exception as exc:
        raise KeyMismatchError(f"Failed to load RSA private key: {exc}") from exc

    if not isinstance(privkey, rsa.RSAPrivateKey):
        raise KeyMismatchError("Provided private key is not an RSA private key.")

    try:
        encrypted_dek = bytes.fromhex(envelope["encrypted_dek"])
        iv = bytes.fromhex(envelope["iv"])
        auth_tag = bytes.fromhex(envelope["auth_tag"])
        ciphertext = bytes.fromhex(envelope["ciphertext"])
    except (KeyError, ValueError) as exc:
        raise KeyMismatchError(f"Malformed digital envelope format: {exc}") from exc

    # 1. Decrypt ephemeral DEK with RSA-OAEP
    try:
        dek = privkey.decrypt(
            encrypted_dek,
            padding.OAEP(
                mgf=padding.MGF1(algorithm=hashes.SHA256()),
                algorithm=hashes.SHA256(),
                label=None,
            ),
        )
    except Exception as exc:
        raise KeyMismatchError(
            "RSA-OAEP private key decryption failed — incorrect private key for this keyring"
        ) from exc

    # 2. Decrypt KeyRing payload with AES-256-GCM
    return aes_gcm_decrypt(dek, iv, ciphertext, auth_tag)
