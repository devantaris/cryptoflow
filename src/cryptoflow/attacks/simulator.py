"""Attack simulation suite for CryptoFlow.

Provides functions to simulate real-world cyberattacks and system failures
against .cryptoflow bundles to verify that tamper detection, cross-modal
integrity binding, and authentication tag enforcement work as specified.
"""

from __future__ import annotations

import json
import logging
import os
import struct
import tempfile
from dataclasses import dataclass
from enum import Enum
from pathlib import Path

from cryptoflow.decrypt.pipeline import (
    _parse_bundle_header,
    decrypt_bundle,
)
from cryptoflow.exceptions import (
    AuthTagMismatchError,
    BindingMismatchError,
    CryptoFlowError,
    InvalidBundleError,
    KeyMismatchError,
)
from cryptoflow.models.bundle import (
    BUNDLE_HEADER_SIZE,
    BundleManifest,
    KeyRing,
    ModalityEntry,
)
from cryptoflow.models.modality import ModalityType
from cryptoflow.pipeline import encrypt_pipeline
from cryptoflow.synthetic import generate_patient_bundle
from cryptoflow.utils.io import read_file, write_file

logger = logging.getLogger(__name__)


class AttackType(str, Enum):
    """Supported attack simulation vectors."""

    BIT_FLIP = "bit_flip"
    SWAP_MODALITIES = "swap_modalities"
    CROSS_BUNDLE_SWAP = "cross_bundle_swap"
    TRUNCATE_BLOB = "truncate_blob"
    INJECT_BLOB = "inject_blob"
    MANIFEST_TAMPER = "manifest_tamper"
    KEY_MISMATCH = "key_mismatch"


@dataclass(slots=True)
class AttackResult:
    """Result of an attack simulation attempt."""

    attack_type: AttackType
    description: str
    detected: bool
    exception_raised: str | None
    expected_exception: str
    success: bool  # True if the security control functioned correctly (i.e. attack was detected)
    details: str


def _unpack_bundle_parts(
    bundle_data: bytes,
) -> tuple[bytes, BundleManifest, bytes, list[bytes]]:
    """Helper to dissect a .cryptoflow bundle into header, manifest, manifest_bytes, and raw blobs."""
    version, bundle_id, manifest_len, modality_count = _parse_bundle_header(bundle_data)
    header_bytes = bundle_data[:BUNDLE_HEADER_SIZE]
    manifest_start = BUNDLE_HEADER_SIZE
    manifest_end = manifest_start + manifest_len
    manifest_bytes = bundle_data[manifest_start:manifest_end]
    manifest = BundleManifest.from_json(json.loads(manifest_bytes.decode("utf-8")))

    blob_section = bundle_data[manifest_end:]
    raw_blobs: list[bytes] = []
    for entry in manifest.modalities:
        b_slice = blob_section[entry.offset : entry.offset + entry.encrypted_size]
        raw_blobs.append(b_slice)

    return header_bytes, manifest, manifest_bytes, raw_blobs


def _repack_bundle(
    manifest: BundleManifest,
    raw_blobs: list[bytes],
) -> bytes:
    """Helper to reassemble a bundle from manifest and blob byte slices."""
    current_offset = 0
    updated_entries = []
    for entry, blob_bytes in zip(manifest.modalities, raw_blobs):
        new_entry = ModalityEntry(
            modality_type=entry.modality_type,
            original_filename=entry.original_filename,
            original_size=entry.original_size,
            encrypted_size=len(blob_bytes),
            offset=current_offset,
            auth_tag=entry.auth_tag,
            iv=entry.iv,
        )
        updated_entries.append(new_entry)
        current_offset += len(blob_bytes)

    manifest.modalities = updated_entries
    manifest.modality_count = len(updated_entries)

    manifest_json = json.dumps(
        manifest.to_json(), separators=(",", ":")
    ).encode("utf-8")

    import uuid as _uuid

    uuid_bytes = _uuid.UUID(manifest.bundle_id).bytes
    bundle_header = (
        b"CFLOW\x00"
        + struct.pack("<H", manifest.version)
        + uuid_bytes
        + struct.pack("<I", len(manifest_json))
        + struct.pack("<B", manifest.modality_count)
        + b"\x00" * 35
    )

    blob_section = b"".join(raw_blobs)
    return bundle_header + manifest_json + blob_section


class AttackSimulator:
    """Automated threat modeling and attack simulation runner."""

    def __init__(self, working_dir: Path | None = None) -> None:
        if working_dir is None:
            self._temp_dir = tempfile.TemporaryDirectory(prefix="cflow_attack_")
            self.work_dir = Path(self._temp_dir.name)
        else:
            self._temp_dir = None
            self.work_dir = Path(working_dir)
            self.work_dir.mkdir(parents=True, exist_ok=True)

    def cleanup(self) -> None:
        """Clean up temporary test artifacts if created."""
        if self._temp_dir is not None:
            self._temp_dir.cleanup()

    def create_sample_bundle(
        self, patient_idx: int = 0
    ) -> tuple[Path, Path]:
        """Create a valid baseline sample bundle and keyring."""
        raw_files = generate_patient_bundle(
            self.work_dir / f"patient_{patient_idx}",
            image_size_bytes=5 * 1024,
            patient_index=patient_idx,
        )
        file_paths = {
            ModalityType.IMAGE: raw_files["image"],
            ModalityType.TEXT: raw_files["text"],
            ModalityType.METADATA: raw_files["metadata"],
        }
        enc_dir = self.work_dir / f"enc_{patient_idx}"
        return encrypt_pipeline(file_paths, enc_dir)

    def run_bit_flip_attack(
        self, bundle_path: Path, keyring_path: Path
    ) -> AttackResult:
        """Simulate bit corruption in encrypted ciphertext."""
        bundle_data = bytearray(read_file(bundle_path))
        bundle_data[-10] ^= 0x01

        attack_bundle = self.work_dir / "attack_bit_flip.cryptoflow"
        write_file(attack_bundle, bytes(bundle_data))
        out_dir = self.work_dir / "dec_bit_flip"

        try:
            decrypt_bundle(attack_bundle, keyring_path, out_dir)
            return AttackResult(
                attack_type=AttackType.BIT_FLIP,
                description="Flipped single bit in ciphertext blob",
                detected=False,
                exception_raised=None,
                expected_exception="BindingMismatchError / AuthTagMismatchError",
                success=False,
                details="Attack NOT detected - system decrypted corrupted ciphertext!",
            )
        except (BindingMismatchError, AuthTagMismatchError, InvalidBundleError) as e:
            return AttackResult(
                attack_type=AttackType.BIT_FLIP,
                description="Flipped single bit in ciphertext blob",
                detected=True,
                exception_raised=type(e).__name__,
                expected_exception="BindingMismatchError / AuthTagMismatchError",
                success=True,
                details=f"Attack successfully detected and blocked: {e}",
            )

    def run_swap_modalities_attack(
        self, bundle_path: Path, keyring_path: Path
    ) -> AttackResult:
        """Simulate swapping two modality ciphertexts within the same bundle."""
        bundle_data = read_file(bundle_path)
        header, manifest, m_bytes, raw_blobs = _unpack_bundle_parts(bundle_data)

        if len(raw_blobs) >= 2:
            raw_blobs[0], raw_blobs[1] = raw_blobs[1], raw_blobs[0]

        tampered_data = _repack_bundle(manifest, raw_blobs)
        attack_bundle = self.work_dir / "attack_swap_modalities.cryptoflow"
        write_file(attack_bundle, tampered_data)
        out_dir = self.work_dir / "dec_swap_modalities"

        try:
            decrypt_bundle(attack_bundle, keyring_path, out_dir)
            return AttackResult(
                attack_type=AttackType.SWAP_MODALITIES,
                description="Swapped image and text ciphertext order within bundle",
                detected=False,
                exception_raised=None,
                expected_exception="BindingMismatchError / AuthTagMismatchError",
                success=False,
                details="Attack NOT detected - swapped modalities were decrypted without error!",
            )
        except (BindingMismatchError, AuthTagMismatchError, InvalidBundleError) as e:
            return AttackResult(
                attack_type=AttackType.SWAP_MODALITIES,
                description="Swapped image and text ciphertext order within bundle",
                detected=True,
                exception_raised=type(e).__name__,
                expected_exception="BindingMismatchError / AuthTagMismatchError",
                success=True,
                details=f"Attack successfully detected and blocked: {e}",
            )

    def run_cross_bundle_swap_attack(
        self, bundle_a_path: Path, keyring_a_path: Path, bundle_b_path: Path
    ) -> AttackResult:
        """Simulate replacing a modality in Bundle A with one from Bundle B."""
        bundle_a_data = read_file(bundle_a_path)
        bundle_b_data = read_file(bundle_b_path)

        _, manifest_a, _, blobs_a = _unpack_bundle_parts(bundle_a_data)
        _, manifest_b, _, blobs_b = _unpack_bundle_parts(bundle_b_data)

        blobs_a[1] = blobs_b[1]

        tampered_data = _repack_bundle(manifest_a, blobs_a)
        attack_bundle = self.work_dir / "attack_cross_swap.cryptoflow"
        write_file(attack_bundle, tampered_data)
        out_dir = self.work_dir / "dec_cross_swap"

        try:
            decrypt_bundle(attack_bundle, keyring_a_path, out_dir)
            return AttackResult(
                attack_type=AttackType.CROSS_BUNDLE_SWAP,
                description="Replaced Patient A report with Patient B report",
                detected=False,
                exception_raised=None,
                expected_exception="BindingMismatchError / AuthTagMismatchError",
                success=False,
                details="Attack NOT detected - mismatched patient record accepted!",
            )
        except (BindingMismatchError, AuthTagMismatchError, InvalidBundleError) as e:
            return AttackResult(
                attack_type=AttackType.CROSS_BUNDLE_SWAP,
                description="Replaced Patient A report with Patient B report",
                detected=True,
                exception_raised=type(e).__name__,
                expected_exception="BindingMismatchError / AuthTagMismatchError",
                success=True,
                details=f"Attack successfully detected and blocked: {e}",
            )

    def run_truncate_blob_attack(
        self, bundle_path: Path, keyring_path: Path
    ) -> AttackResult:
        """Simulate network truncation of a ciphertext payload."""
        bundle_data = read_file(bundle_path)
        tampered_data = bundle_data[:-50]

        attack_bundle = self.work_dir / "attack_truncate.cryptoflow"
        write_file(attack_bundle, tampered_data)
        out_dir = self.work_dir / "dec_truncate"

        try:
            decrypt_bundle(attack_bundle, keyring_path, out_dir)
            return AttackResult(
                attack_type=AttackType.TRUNCATE_BLOB,
                description="Truncated last 50 bytes of bundle file",
                detected=False,
                exception_raised=None,
                expected_exception="InvalidBundleError / AuthTagMismatchError / BindingMismatchError",
                success=False,
                details="Attack NOT detected - truncated payload accepted!",
            )
        except (InvalidBundleError, AuthTagMismatchError, BindingMismatchError) as e:
            return AttackResult(
                attack_type=AttackType.TRUNCATE_BLOB,
                description="Truncated last 50 bytes of bundle file",
                detected=True,
                exception_raised=type(e).__name__,
                expected_exception="InvalidBundleError / AuthTagMismatchError / BindingMismatchError",
                success=True,
                details=f"Attack successfully detected and blocked: {e}",
            )

    def run_inject_blob_attack(
        self, bundle_path: Path, keyring_path: Path
    ) -> AttackResult:
        """Simulate injecting an unauthorized additional payload into the bundle."""
        bundle_data = read_file(bundle_path)
        header, manifest, m_bytes, raw_blobs = _unpack_bundle_parts(bundle_data)

        rogue_blob = b"MALICIOUS_PAYLOAD_DATA" * 5
        raw_blobs.append(rogue_blob)
        fake_entry = ModalityEntry(
            modality_type=ModalityType.METADATA,
            original_filename="injected_payload.json",
            original_size=len(rogue_blob),
            encrypted_size=len(rogue_blob),
            offset=0,
            auth_tag=os.urandom(16),
            iv=os.urandom(12),
        )
        manifest.modalities.append(fake_entry)

        tampered_data = _repack_bundle(manifest, raw_blobs)
        attack_bundle = self.work_dir / "attack_inject.cryptoflow"
        write_file(attack_bundle, tampered_data)
        out_dir = self.work_dir / "dec_inject"

        try:
            decrypt_bundle(attack_bundle, keyring_path, out_dir)
            return AttackResult(
                attack_type=AttackType.INJECT_BLOB,
                description="Injected 4th rogue modality into 3-modality bundle",
                detected=False,
                exception_raised=None,
                expected_exception="BindingMismatchError / AuthTagMismatchError / KeyMismatchError",
                success=False,
                details="Attack NOT detected - injected modality accepted!",
            )
        except (BindingMismatchError, AuthTagMismatchError, KeyMismatchError, InvalidBundleError) as e:
            return AttackResult(
                attack_type=AttackType.INJECT_BLOB,
                description="Injected 4th rogue modality into 3-modality bundle",
                detected=True,
                exception_raised=type(e).__name__,
                expected_exception="BindingMismatchError / AuthTagMismatchError / KeyMismatchError",
                success=True,
                details=f"Attack successfully detected and blocked: {e}",
            )

    def run_manifest_tamper_attack(
        self, bundle_path: Path, keyring_path: Path
    ) -> AttackResult:
        """Simulate an attacker altering the binding hash in the manifest."""
        bundle_data = read_file(bundle_path)
        header, manifest, m_bytes, raw_blobs = _unpack_bundle_parts(bundle_data)

        fake_hash = bytearray(manifest.binding_hash)
        fake_hash[0] ^= 0xFF
        manifest.binding_hash = bytes(fake_hash)

        tampered_data = _repack_bundle(manifest, raw_blobs)
        attack_bundle = self.work_dir / "attack_manifest_tamper.cryptoflow"
        write_file(attack_bundle, tampered_data)
        out_dir = self.work_dir / "dec_manifest_tamper"

        try:
            decrypt_bundle(attack_bundle, keyring_path, out_dir)
            return AttackResult(
                attack_type=AttackType.MANIFEST_TAMPER,
                description="Forged binding hash in manifest",
                detected=False,
                exception_raised=None,
                expected_exception="BindingMismatchError",
                success=False,
                details="Attack NOT detected - forged manifest accepted!",
            )
        except BindingMismatchError as e:
            return AttackResult(
                attack_type=AttackType.MANIFEST_TAMPER,
                description="Forged binding hash in manifest",
                detected=True,
                exception_raised=type(e).__name__,
                expected_exception="BindingMismatchError",
                success=True,
                details=f"Attack successfully detected and blocked: {e}",
            )

    def run_key_mismatch_attack(
        self, bundle_path: Path, wrong_keyring_path: Path
    ) -> AttackResult:
        """Simulate attempting to unlock Bundle A with KeyRing B."""
        out_dir = self.work_dir / "dec_key_mismatch"
        try:
            decrypt_bundle(bundle_path, wrong_keyring_path, out_dir)
            return AttackResult(
                attack_type=AttackType.KEY_MISMATCH,
                description="Attempted decryption using unauthorized foreign keyring",
                detected=False,
                exception_raised=None,
                expected_exception="KeyMismatchError",
                success=False,
                details="Attack NOT detected - wrong keyring opened bundle!",
            )
        except (KeyMismatchError, AuthTagMismatchError) as e:
            return AttackResult(
                attack_type=AttackType.KEY_MISMATCH,
                description="Attempted decryption using unauthorized foreign keyring",
                detected=True,
                exception_raised=type(e).__name__,
                expected_exception="KeyMismatchError",
                success=True,
                details=f"Attack successfully detected and blocked: {e}",
            )

    def run_all_attacks(self) -> list[AttackResult]:
        """Execute the full battery of all 7 attack simulation tests."""
        bundle_a, key_a = self.create_sample_bundle(patient_idx=1)
        bundle_b, key_b = self.create_sample_bundle(patient_idx=2)

        results: list[AttackResult] = [
            self.run_bit_flip_attack(bundle_a, key_a),
            self.run_swap_modalities_attack(bundle_a, key_a),
            self.run_cross_bundle_swap_attack(bundle_a, key_a, bundle_b),
            self.run_truncate_blob_attack(bundle_a, key_a),
            self.run_inject_blob_attack(bundle_a, key_a),
            self.run_manifest_tamper_attack(bundle_a, key_a),
            self.run_key_mismatch_attack(bundle_a, key_b),
        ]
        return results
