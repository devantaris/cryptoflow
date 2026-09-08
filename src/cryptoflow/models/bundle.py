"""Encrypted bundle types and manifest for CryptoFlow.

Defines the data models produced by Stage-2 (encryption) and
consumed by the bundle writer and decryption pipeline.  Every
model that needs to persist to disk exposes ``to_json`` /
``from_json`` round-trip helpers that use hex-encoding for all
``bytes`` fields and string values for :class:`ModalityType`.
"""

from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone

from cryptoflow.models.modality import ModalityType

# ---------------------------------------------------------------------------
# Bundle format constants
# ---------------------------------------------------------------------------

BUNDLE_MAGIC: bytes = b"CFLOW\x00"  # 6 bytes
"""Magic bytes that open every serialised bundle file."""

BUNDLE_VERSION: int = 1
"""Current on-disk bundle format version."""

BUNDLE_HEADER_SIZE: int = 64
"""Fixed byte-length of the binary bundle header."""

AES_KEY_SIZE: int = 32       # 256 bits
"""Required length of every AES-256 key."""

GCM_IV_SIZE: int = 12        # 96 bits
"""Required length of every GCM initialisation vector."""

GCM_TAG_SIZE: int = 16       # 128 bits
"""Length of the GCM authentication tag."""

HMAC_KEY_SIZE: int = 32      # 256 bits
"""Required length of the HMAC binding key."""

BINDING_HASH_SIZE: int = 32  # SHA-256 output
"""Length of the HMAC-SHA-256 binding hash."""


# ---------------------------------------------------------------------------
# Encryption primitives
# ---------------------------------------------------------------------------

@dataclass(frozen=True, slots=True)
class EncryptionKey:
    """A per-modality AES-256-GCM key + nonce pair.

    Attributes:
        key: 32-byte AES-256 secret key.
        iv: 12-byte GCM nonce (must never be reused with the
            same key).
        modality_type: The modality this key encrypts.

    Raises:
        ValueError: If *key* or *iv* lengths are invalid.
    """

    key: bytes
    iv: bytes
    modality_type: ModalityType

    def __post_init__(self) -> None:
        """Validate key and IV lengths at construction time."""
        if len(self.key) != AES_KEY_SIZE:
            raise ValueError(
                f"Key must be {AES_KEY_SIZE} bytes, "
                f"got {len(self.key)}"
            )
        if len(self.iv) != GCM_IV_SIZE:
            raise ValueError(
                f"IV must be {GCM_IV_SIZE} bytes, "
                f"got {len(self.iv)}"
            )

    # -- serialisation helpers ------------------------------------

    def to_json(self) -> dict[str, str]:
        """Serialise to a JSON-safe dictionary.

        Returns:
            Dictionary with hex-encoded ``key`` and ``iv``, plus
            the modality type value string.
        """
        return {
            "key": self.key.hex(),
            "iv": self.iv.hex(),
            "modality_type": self.modality_type.value,
        }

    @classmethod
    def from_json(cls, data: dict[str, str]) -> EncryptionKey:
        """Deserialise from a JSON-safe dictionary.

        Args:
            data: Dictionary previously produced by
                :meth:`to_json`.

        Returns:
            Reconstructed :class:`EncryptionKey`.
        """
        return cls(
            key=bytes.fromhex(data["key"]),
            iv=bytes.fromhex(data["iv"]),
            modality_type=ModalityType(data["modality_type"]),
        )


@dataclass(frozen=True, slots=True)
class EncryptedBlob:
    """Result of encrypting a single :class:`NormalizedBlob`.

    Attributes:
        ciphertext: The encrypted payload.
        auth_tag: 16-byte GCM authentication tag.
        iv: 12-byte GCM nonce used during encryption.
        modality_type: Category of the encrypted data.
        original_size: Byte-length of the plaintext payload.
    """

    ciphertext: bytes
    auth_tag: bytes
    iv: bytes
    modality_type: ModalityType
    original_size: int


# ---------------------------------------------------------------------------
# Key management
# ---------------------------------------------------------------------------

@dataclass(slots=True)
class KeyRing:
    """Collection of per-modality keys for a single bundle.

    Use the :meth:`create` factory rather than ``__init__`` to
    auto-generate ``bundle_id`` and ``created_at``.

    Attributes:
        bundle_id: UUID-4 string identifying the bundle.
        keys: One :class:`EncryptionKey` per encrypted modality.
        binding_key: 32-byte HMAC key for cross-modality binding.
        created_at: ISO-8601 UTC timestamp.
    """

    bundle_id: str
    keys: list[EncryptionKey]
    binding_key: bytes
    created_at: str

    @classmethod
    def create(
        cls,
        keys: list[EncryptionKey],
        binding_key: bytes,
    ) -> KeyRing:
        """Build a new :class:`KeyRing` with a fresh UUID and timestamp.

        Args:
            keys: Per-modality encryption keys.
            binding_key: 32-byte HMAC binding key.

        Returns:
            Fully initialised :class:`KeyRing`.
        """
        return cls(
            bundle_id=str(uuid.uuid4()),
            keys=keys,
            binding_key=binding_key,
            created_at=datetime.now(timezone.utc).isoformat(),
        )

    # -- serialisation helpers ------------------------------------

    def to_json(self) -> dict[str, object]:
        """Serialise to a JSON-safe dictionary.

        Returns:
            Dictionary with hex-encoded bytes fields and nested
            key entries.
        """
        return {
            "bundle_id": self.bundle_id,
            "keys": [k.to_json() for k in self.keys],
            "binding_key": self.binding_key.hex(),
            "created_at": self.created_at,
            "wrapped": False,
        }

    def to_wrapped_json(self, recipient_pubkey_pem: bytes) -> dict[str, object]:
        """Serialise and encrypt using RSA-OAEP hybrid digital envelope.

        Args:
            recipient_pubkey_pem: Recipient's RSA public key PEM bytes.

        Returns:
            JSON-safe dictionary containing the encrypted envelope.
        """
        import json as _json
        from cryptoflow.utils.crypto import wrap_keyring_payload

        raw_payload = _json.dumps(self.to_json()).encode("utf-8")
        envelope = wrap_keyring_payload(raw_payload, recipient_pubkey_pem)
        return {
            "bundle_id": self.bundle_id,
            "created_at": self.created_at,
            "wrapped": True,
            "envelope": envelope,
        }

    @classmethod
    def from_json(
        cls,
        data: dict[str, object],
        private_key_pem: bytes | None = None,
        passphrase: bytes | None = None,
    ) -> KeyRing:
        """Deserialise from a JSON-safe dictionary.

        If the keyring is RSA-wrapped, ``private_key_pem`` is required
        to decrypt the digital envelope.

        Args:
            data: Dictionary previously produced by :meth:`to_json` or :meth:`to_wrapped_json`.
            private_key_pem: Optional RSA private key in PEM format.
            passphrase: Optional passphrase for the private key.

        Returns:
            Reconstructed :class:`KeyRing`.
        """
        import json as _json

        if data.get("wrapped") is True:
            if private_key_pem is None:
                raise ValueError(
                    "This keyring is wrapped with an RSA public key. "
                    "Recipient private key is required to unlock it."
                )
            from cryptoflow.utils.crypto import unwrap_keyring_payload

            envelope = data["envelope"]  # type: ignore[assignment]
            raw_bytes = unwrap_keyring_payload(envelope, private_key_pem, passphrase)
            unwrapped_data = _json.loads(raw_bytes.decode("utf-8"))
            return cls.from_json(unwrapped_data)

        keys_data: list[dict[str, str]] = data["keys"]  # type: ignore[assignment]
        return cls(
            bundle_id=str(data["bundle_id"]),
            keys=[
                EncryptionKey.from_json(k) for k in keys_data
            ],
            binding_key=bytes.fromhex(str(data["binding_key"])),
            created_at=str(data["created_at"]),
        )


# ---------------------------------------------------------------------------
# Bundle manifest entries
# ---------------------------------------------------------------------------

@dataclass(frozen=True, slots=True)
class ModalityEntry:
    """Manifest record for one encrypted modality inside a bundle.

    Attributes:
        modality_type: Category of the encrypted data.
        original_filename: Basename of the source file.
        original_size: Plaintext byte-length.
        encrypted_size: Ciphertext byte-length.
        offset: Byte offset of this entry inside the bundle file.
        auth_tag: 16-byte GCM authentication tag.
        iv: 12-byte GCM nonce.
    """

    modality_type: ModalityType
    original_filename: str
    original_size: int
    encrypted_size: int
    offset: int
    auth_tag: bytes
    iv: bytes

    # -- serialisation helpers ------------------------------------

    def to_json(self) -> dict[str, object]:
        """Serialise to a JSON-safe dictionary.

        Returns:
            Dictionary with hex-encoded bytes fields.
        """
        return {
            "modality_type": self.modality_type.value,
            "original_filename": self.original_filename,
            "original_size": self.original_size,
            "encrypted_size": self.encrypted_size,
            "offset": self.offset,
            "auth_tag": self.auth_tag.hex(),
            "iv": self.iv.hex(),
        }

    @classmethod
    def from_json(cls, data: dict[str, object]) -> ModalityEntry:
        """Deserialise from a JSON-safe dictionary.

        Args:
            data: Dictionary previously produced by
                :meth:`to_json`.

        Returns:
            Reconstructed :class:`ModalityEntry`.
        """
        return cls(
            modality_type=ModalityType(str(data["modality_type"])),
            original_filename=str(data["original_filename"]),
            original_size=int(data["original_size"]),  # type: ignore[arg-type]
            encrypted_size=int(data["encrypted_size"]),  # type: ignore[arg-type]
            offset=int(data["offset"]),  # type: ignore[arg-type]
            auth_tag=bytes.fromhex(str(data["auth_tag"])),
            iv=bytes.fromhex(str(data["iv"])),
        )


# ---------------------------------------------------------------------------
# Top-level bundle manifest
# ---------------------------------------------------------------------------

@dataclass(slots=True)
class BundleManifest:
    """Full manifest describing a serialised encrypted bundle.

    Attributes:
        version: Bundle format version (currently ``1``).
        bundle_id: UUID-4 string matching the :class:`KeyRing`.
        created_at: ISO-8601 UTC timestamp.
        modality_count: Number of modality entries.
        modalities: Per-modality metadata records.
        binding_hash: 32-byte HMAC-SHA-256 cross-modality hash.
        total_size: Total byte-length of the serialised bundle.
        uncertainty_profile: Optional uncertainty quantification
            report produced by the DST / DEL analysis stage.
            Embedded so the receiver can inspect the uncertainty
            profile of the data they received.
    """

    version: int
    bundle_id: str
    created_at: str
    modality_count: int
    modalities: list[ModalityEntry]
    binding_hash: bytes
    total_size: int
    uncertainty_profile: dict[str, object] | None = None

    # -- serialisation helpers ------------------------------------

    def to_json(self) -> dict[str, object]:
        """Serialise to a JSON-safe dictionary.

        Returns:
            Dictionary with hex-encoded bytes fields and nested
            modality entries.
        """
        result: dict[str, object] = {
            "version": self.version,
            "bundle_id": self.bundle_id,
            "created_at": self.created_at,
            "modality_count": self.modality_count,
            "modalities": [
                m.to_json() for m in self.modalities
            ],
            "binding_hash": self.binding_hash.hex(),
            "total_size": self.total_size,
        }
        if self.uncertainty_profile is not None:
            result["uncertainty_profile"] = self.uncertainty_profile
        return result

    @classmethod
    def from_json(cls, data: dict[str, object]) -> BundleManifest:
        """Deserialise from a JSON-safe dictionary.

        Args:
            data: Dictionary previously produced by
                :meth:`to_json`.

        Returns:
            Reconstructed :class:`BundleManifest`.
        """
        modalities_data: list[dict[str, object]] = data["modalities"]  # type: ignore[assignment]
        uncertainty = data.get("uncertainty_profile")  # type: ignore[arg-type]
        return cls(
            version=int(data["version"]),  # type: ignore[arg-type]
            bundle_id=str(data["bundle_id"]),
            created_at=str(data["created_at"]),
            modality_count=int(data["modality_count"]),  # type: ignore[arg-type]
            modalities=[
                ModalityEntry.from_json(m) for m in modalities_data
            ],
            binding_hash=bytes.fromhex(str(data["binding_hash"])),
            total_size=int(data["total_size"]),  # type: ignore[arg-type]
            uncertainty_profile=uncertainty,  # type: ignore[arg-type]
        )
