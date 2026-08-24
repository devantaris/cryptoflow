"""Unit tests for cryptographic primitives and tamper detection."""

from __future__ import annotations

import pytest

from cryptoflow.exceptions import AuthTagMismatchError
from cryptoflow.models.bundle import EncryptedBlob
from cryptoflow.models.modality import ModalityType
from cryptoflow.utils.crypto import (
    aes_gcm_decrypt,
    aes_gcm_encrypt,
    compute_binding_hash,
    generate_aes_key,
    generate_hmac_key,
    generate_iv,
    verify_binding_hash,
)


def test_aes_gcm_roundtrip() -> None:
    key = generate_aes_key()
    iv = generate_iv()
    plaintext = b"Patient diagnosis: Grade 2 Astrocytoma. Confidential."

    ct, tag = aes_gcm_encrypt(key, iv, plaintext)
    assert len(tag) == 16
    assert ct != plaintext

    recovered = aes_gcm_decrypt(key, iv, ct, tag)
    assert recovered == plaintext


def test_aes_gcm_tamper_detection() -> None:
    key = generate_aes_key()
    iv = generate_iv()
    plaintext = b"Dosage: 10mg IV daily."

    ct, tag = aes_gcm_encrypt(key, iv, plaintext)

    # Corrupt ciphertext byte
    tampered_ct = bytearray(ct)
    tampered_ct[0] ^= 0x01
    with pytest.raises(AuthTagMismatchError):
        aes_gcm_decrypt(key, iv, bytes(tampered_ct), tag)

    # Corrupt auth tag byte
    tampered_tag = bytearray(tag)
    tampered_tag[0] ^= 0x01
    with pytest.raises(AuthTagMismatchError):
        aes_gcm_decrypt(key, iv, ct, bytes(tampered_tag))

    # Corrupt IV byte
    tampered_iv = bytearray(iv)
    tampered_iv[0] ^= 0x01
    with pytest.raises(AuthTagMismatchError):
        aes_gcm_decrypt(key, bytes(tampered_iv), ct, tag)


def test_hmac_binding_hash() -> None:
    binding_key = generate_hmac_key()
    b1 = EncryptedBlob(
        ciphertext=b"CT_IMAGE_CIPHERTEXT",
        auth_tag=b"T" * 16,
        iv=b"I" * 12,
        modality_type=ModalityType.IMAGE,
        original_size=100,
    )
    b2 = EncryptedBlob(
        ciphertext=b"REPORT_CIPHERTEXT",
        auth_tag=b"T" * 16,
        iv=b"I" * 12,
        modality_type=ModalityType.TEXT,
        original_size=50,
    )

    h1 = compute_binding_hash(binding_key, [b1, b2])
    assert len(h1) == 32
    assert verify_binding_hash(binding_key, [b1, b2], h1) is True

    # Determinism: changing input list order produces identical binding hash
    h2 = compute_binding_hash(binding_key, [b2, b1])
    assert h1 == h2

    # Tampering with one blob invalidates binding hash
    b1_tampered = EncryptedBlob(
        ciphertext=b"CT_IMAGE_CIPHERTEXT_MODIFIED",
        auth_tag=b1.auth_tag,
        iv=b1.iv,
        modality_type=b1.modality_type,
        original_size=b1.original_size,
    )
    assert verify_binding_hash(binding_key, [b1_tampered, b2], h1) is False


def test_rsa_keypair_generation_and_wrapping() -> None:
    from cryptoflow.exceptions import KeyMismatchError
    from cryptoflow.utils.crypto import (
        generate_rsa_keypair,
        unwrap_keyring_payload,
        wrap_keyring_payload,
    )

    priv_pem, pub_pem = generate_rsa_keypair(key_size=2048)
    assert b"BEGIN PRIVATE KEY" in priv_pem
    assert b"BEGIN PUBLIC KEY" in pub_pem

    secret_keyring_json = b'{"bundle_id": "123", "binding_key": "aabbcc"}'

    # Wrap with recipient public key
    envelope = wrap_keyring_payload(secret_keyring_json, pub_pem)
    assert envelope["algorithm"] == "RSA-OAEP-SHA256+AES-256-GCM"
    assert "encrypted_dek" in envelope
    assert "ciphertext" in envelope

    # Unwrap with recipient private key
    recovered = unwrap_keyring_payload(envelope, priv_pem)
    assert recovered == secret_keyring_json

    # Attempt unwrap with wrong/mismatched private key
    wrong_priv_pem, _ = generate_rsa_keypair(key_size=2048)
    with pytest.raises(KeyMismatchError):
        unwrap_keyring_payload(envelope, wrong_priv_pem)

    # Corrupt envelope ciphertext
    tampered_envelope = dict(envelope)
    tampered_envelope["ciphertext"] = envelope["ciphertext"][:-2] + "ff"
    with pytest.raises(AuthTagMismatchError):
        unwrap_keyring_payload(tampered_envelope, priv_pem)
