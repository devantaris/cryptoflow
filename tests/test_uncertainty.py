"""Tests for the uncertainty quantification stage (DST + DEL).

Covers feature extraction, individual DST and DEL engines,
Dempster's Rule of Combination, Dirichlet evidence fusion,
head-to-head theory comparison, pipeline integration, and
manifest embedding.
"""

from __future__ import annotations

import json
import math
from pathlib import Path

import pytest

from cryptoflow.decrypt.pipeline import decrypt_bundle
from cryptoflow.models.modality import (
    HEADER_MAGIC,
    HEADER_SIZE,
    ModalityType,
    NormalizedBlob,
)
from cryptoflow.models.uncertainty import (
    DELResult,
    DSTResult,
    FeatureVector,
    ModalityAssessment,
    UncertaintyReport,
)
from cryptoflow.pipeline import encrypt_pipeline
from cryptoflow.stages.uncertainty import (
    _del_assess,
    _del_fuse_modalities,
    _dst_assess,
    _dst_combine,
    _dst_fuse_modalities,
    _dst_mass_from_feature,
    _shannon_entropy,
    assess_uncertainty,
    extract_features,
)
from cryptoflow.synthetic import generate_patient_bundle


# ── Helpers ──────────────────────────────────────────────────────────────

def _make_blob(
    modality: ModalityType,
    payload: bytes,
    filename: str = "test_file",
) -> NormalizedBlob:
    """Create a minimal NormalizedBlob for testing."""
    # Build a simplified 64-byte header
    header = HEADER_MAGIC + b"\x00" * (HEADER_SIZE - len(HEADER_MAGIC))
    return NormalizedBlob(
        modality_type=modality,
        header=header,
        payload=payload,
        original_filename=filename,
        original_size=len(payload),
    )


# =========================================================================
# Feature extraction tests
# =========================================================================

class TestShannonEntropy:
    """Verify Shannon entropy calculation on known distributions."""

    def test_single_byte_value(self) -> None:
        """A repeated single byte has zero entropy."""
        data = b"\x41" * 1000
        assert _shannon_entropy(data) == pytest.approx(0.0)

    def test_two_equal_bytes(self) -> None:
        """Two byte values in equal proportion → 1.0 bit."""
        data = b"\x00" * 500 + b"\xFF" * 500
        assert _shannon_entropy(data) == pytest.approx(1.0, abs=0.01)

    def test_empty_data(self) -> None:
        assert _shannon_entropy(b"") == 0.0

    def test_high_entropy(self) -> None:
        """Random-ish data should have high entropy (close to 8)."""
        import os
        data = os.urandom(10000)
        entropy = _shannon_entropy(data)
        assert entropy > 7.0
        assert entropy <= 8.0

    def test_text_entropy(self) -> None:
        """English text should have moderate entropy."""
        text = (b"The quick brown fox jumps over the lazy dog. " * 50)
        entropy = _shannon_entropy(text)
        assert 3.0 < entropy < 5.5


class TestFeatureExtraction:
    """Verify feature extraction from blobs."""

    def test_image_blob_features(self) -> None:
        """A well-formed DICOM-like image blob gets high scores."""
        # Create payload with DICOM preamble
        preamble = b"\x00" * 128 + b"DICM"
        import os
        payload = preamble + os.urandom(4096)
        blob = _make_blob(ModalityType.IMAGE, payload, "scan.dcm")
        features = extract_features(blob)

        assert features.format_score == 1.0
        assert features.size_score == 1.0
        assert features.entropy > 0.0

    def test_text_blob_features(self) -> None:
        """A printable text blob gets high format score."""
        payload = b"RADIOLOGY REPORT\nPatient: John Doe\nFindings: Normal.\n" * 10
        blob = _make_blob(ModalityType.TEXT, payload, "report.txt")
        features = extract_features(blob)

        assert features.format_score > 0.9
        assert features.size_score == 1.0

    def test_json_blob_features(self) -> None:
        """A valid JSON blob gets high format score."""
        payload = b'{"patient_id": "P-12345", "name": "Jane Doe"}'
        blob = _make_blob(ModalityType.METADATA, payload, "meta.json")
        features = extract_features(blob)

        assert features.format_score == 1.0
        assert features.size_score == 1.0

    def test_invalid_format_low_score(self) -> None:
        """Non-JSON data for metadata modality gets low format score."""
        payload = b"\x00\x01\x02\x03\x04\x05" * 100
        blob = _make_blob(ModalityType.METADATA, payload, "corrupt.json")
        features = extract_features(blob)

        assert features.format_score < 0.5

    def test_empty_payload(self) -> None:
        """Empty payload gets zero scores."""
        blob = _make_blob(ModalityType.IMAGE, b"", "empty.dcm")
        features = extract_features(blob)

        assert features.format_score == 0.0
        assert features.entropy == 0.0

    def test_feature_serialisation(self) -> None:
        """FeatureVector.to_json() produces expected keys."""
        fv = FeatureVector(
            entropy=5.5, entropy_score=1.0,
            size_score=0.8, format_score=0.9,
        )
        d = fv.to_json()
        assert set(d.keys()) == {
            "entropy_bits", "entropy_score", "size_score", "format_score",
        }
        assert d["entropy_bits"] == 5.5


# =========================================================================
# DST engine tests
# =========================================================================

class TestDSTEngine:
    """Verify Dempster-Shafer Theory implementation."""

    def test_mass_function_sums_to_one(self) -> None:
        """BPA from any feature score must sum to 1.0."""
        for score in [0.0, 0.25, 0.5, 0.75, 1.0]:
            m_r, m_u, m_t = _dst_mass_from_feature(score)
            assert m_r + m_u + m_t == pytest.approx(1.0)
            assert m_r >= 0.0
            assert m_u >= 0.0
            assert m_t >= 0.0

    def test_high_score_favours_reliable(self) -> None:
        """A high feature score should assign more mass to reliable."""
        m_r, m_u, _ = _dst_mass_from_feature(1.0)
        assert m_r > m_u

    def test_low_score_favours_unreliable(self) -> None:
        """A low feature score should assign more mass to unreliable."""
        m_r, m_u, _ = _dst_mass_from_feature(0.0)
        assert m_u > m_r

    def test_combine_preserves_normalisation(self) -> None:
        """Dempster combination must produce masses summing to 1."""
        m1 = _dst_mass_from_feature(0.8)
        m2 = _dst_mass_from_feature(0.6)
        r, u, t, k = _dst_combine(m1, m2)
        assert r + u + t == pytest.approx(1.0)
        assert 0.0 <= k < 1.0

    def test_combine_with_vacuous(self) -> None:
        """Combining with vacuous mass (0,0,1) returns the other."""
        m1 = _dst_mass_from_feature(0.9)
        vacuous = (0.0, 0.0, 1.0)
        r, u, t, k = _dst_combine(m1, vacuous)
        assert r == pytest.approx(m1[0])
        assert u == pytest.approx(m1[1])
        assert k == pytest.approx(0.0)

    def test_assess_present_modality(self) -> None:
        """DST assess on present modality produces valid result."""
        fv = FeatureVector(entropy=6.0, entropy_score=1.0,
                           size_score=1.0, format_score=1.0)
        result = _dst_assess(fv)

        assert result.belief_reliable > 0.5
        assert result.plausibility_reliable >= result.belief_reliable
        assert result.uncertainty_interval >= 0.0
        total = result.mass_reliable + result.mass_unreliable + result.mass_uncertain
        assert total == pytest.approx(1.0)

    def test_assess_missing_modality(self) -> None:
        """DST assess on missing modality returns vacuous BPA."""
        result = _dst_assess(None)
        assert result.mass_reliable == 0.0
        assert result.mass_unreliable == 0.0
        assert result.mass_uncertain == 1.0
        assert result.belief_reliable == 0.0
        assert result.plausibility_reliable == 1.0
        assert result.uncertainty_interval == 1.0

    def test_fusion_multiple(self) -> None:
        """Fusing multiple mass functions produces valid output."""
        masses = [
            _dst_mass_from_feature(0.9),
            _dst_mass_from_feature(0.8),
            _dst_mass_from_feature(0.7),
        ]
        result, conflict = _dst_fuse_modalities(masses)
        assert result.mass_reliable + result.mass_unreliable + result.mass_uncertain == pytest.approx(1.0)
        assert 0.0 <= conflict < 1.0

    def test_serialisation(self) -> None:
        """DSTResult.to_json() round-trips key values."""
        r = DSTResult(
            mass_reliable=0.6, mass_unreliable=0.1,
            mass_uncertain=0.3, belief_reliable=0.6,
            plausibility_reliable=0.9, uncertainty_interval=0.3,
        )
        d = r.to_json()
        assert d["mass_reliable"] == pytest.approx(0.6)
        assert d["belief_reliable"] == pytest.approx(0.6)


# =========================================================================
# DEL engine tests
# =========================================================================

class TestDELEngine:
    """Verify Deep Evidential Learning implementation."""

    def test_assess_present_high_quality(self) -> None:
        """High-quality features → low epistemic uncertainty."""
        fv = FeatureVector(entropy=6.0, entropy_score=1.0,
                           size_score=1.0, format_score=1.0)
        result = _del_assess(fv)

        assert result.expected_reliable > 0.7
        assert result.epistemic_uncertainty < 0.3
        assert result.alpha_reliable > result.alpha_unreliable
        assert result.dirichlet_strength > 2.0

    def test_assess_present_low_quality(self) -> None:
        """Low-quality features → evidence for unreliable."""
        fv = FeatureVector(entropy=0.5, entropy_score=0.1,
                           size_score=0.1, format_score=0.1)
        result = _del_assess(fv)

        assert result.expected_unreliable > result.expected_reliable

    def test_assess_missing(self) -> None:
        """Missing modality → vacuous Dirichlet, max uncertainty."""
        result = _del_assess(None)
        assert result.alpha_reliable == 1.0
        assert result.alpha_unreliable == 1.0
        assert result.expected_reliable == 0.5
        assert result.epistemic_uncertainty == 1.0

    def test_expected_probabilities_sum_to_one(self) -> None:
        """Expected probabilities from Dirichlet must sum to 1."""
        for scores in [(1.0, 1.0, 1.0), (0.5, 0.5, 0.5), (0.0, 0.0, 0.0)]:
            fv = FeatureVector(entropy=5.0,
                               entropy_score=scores[0],
                               size_score=scores[1],
                               format_score=scores[2])
            result = _del_assess(fv)
            assert result.expected_reliable + result.expected_unreliable == pytest.approx(1.0)

    def test_fusion_accumulates_evidence(self) -> None:
        """Fusing multiple DEL results should increase Dirichlet strength."""
        fv = FeatureVector(entropy=6.0, entropy_score=0.9,
                           size_score=0.9, format_score=0.9)
        single = _del_assess(fv)
        fused = _del_fuse_modalities([_del_assess(fv)] * 3)

        assert fused.dirichlet_strength > single.dirichlet_strength
        assert fused.epistemic_uncertainty < single.epistemic_uncertainty

    def test_fusion_with_missing(self) -> None:
        """Fusing a present + missing modality: strength > vacuous."""
        present = _del_assess(
            FeatureVector(entropy=6.0, entropy_score=1.0,
                          size_score=1.0, format_score=1.0)
        )
        missing = _del_assess(None)
        fused = _del_fuse_modalities([present, missing])

        # Missing adds zero evidence, so fused should equal present
        assert fused.alpha_reliable == pytest.approx(present.alpha_reliable)

    def test_serialisation(self) -> None:
        """DELResult.to_json() includes all expected keys."""
        r = DELResult(
            alpha_reliable=5.0, alpha_unreliable=2.0,
            expected_reliable=5/7, expected_unreliable=2/7,
            epistemic_uncertainty=2/7, dirichlet_strength=7.0,
        )
        d = r.to_json()
        assert "alpha_reliable" in d
        assert "epistemic_uncertainty" in d


# =========================================================================
# Full stage integration tests
# =========================================================================

class TestAssessUncertainty:
    """Integration tests for the complete uncertainty stage."""

    def test_full_3_modalities(self, tmp_path: Path) -> None:
        """Stage produces valid report with all 3 modalities."""
        raw = generate_patient_bundle(tmp_path / "raw", image_size_bytes=4096)

        from cryptoflow.stages.ingest import ingest
        blobs = ingest({
            ModalityType.IMAGE: raw["image"],
            ModalityType.TEXT: raw["text"],
            ModalityType.METADATA: raw["metadata"],
        })

        report = assess_uncertainty(blobs)

        assert report.completeness == 1.0
        assert len(report.present_modalities) == 3
        assert len(report.missing_modalities) == 0
        assert len(report.modality_assessments) == 3

        # All present modalities should have features
        for a in report.modality_assessments:
            assert a.present is True
            assert a.features is not None

        # Fusion should produce valid results
        fusion = report.fusion
        total_dst = (
            fusion.dst.mass_reliable
            + fusion.dst.mass_unreliable
            + fusion.dst.mass_uncertain
        )
        assert total_dst == pytest.approx(1.0)
        assert fusion.del_result.dirichlet_strength > 2.0

        # Comparison should be populated
        assert isinstance(report.comparison.narrative, str)
        assert len(report.comparison.narrative) > 0

    def test_partial_modalities(self, tmp_path: Path) -> None:
        """Stage handles missing modalities correctly."""
        raw = generate_patient_bundle(tmp_path / "raw", image_size_bytes=4096)

        from cryptoflow.stages.ingest import ingest
        blobs = ingest({
            ModalityType.IMAGE: raw["image"],
            ModalityType.TEXT: raw["text"],
            # No metadata
        })

        report = assess_uncertainty(blobs)

        assert report.completeness == pytest.approx(2 / 3)
        assert "metadata" in report.missing_modalities
        assert len(report.modality_assessments) == 3  # 2 present + 1 missing

        # Find the missing modality assessment
        missing = [a for a in report.modality_assessments if not a.present]
        assert len(missing) == 1
        assert missing[0].modality == "metadata"
        assert missing[0].features is None
        assert missing[0].dst.mass_uncertain == 1.0
        assert missing[0].del_result.epistemic_uncertainty == 1.0

    def test_single_modality(self, tmp_path: Path) -> None:
        """Stage works with only one modality."""
        raw = generate_patient_bundle(tmp_path / "raw", image_size_bytes=4096)

        from cryptoflow.stages.ingest import ingest
        blobs = ingest({ModalityType.IMAGE: raw["image"]})

        report = assess_uncertainty(blobs)

        assert report.completeness == pytest.approx(1 / 3)
        assert len(report.missing_modalities) == 2

    def test_report_serialisation(self, tmp_path: Path) -> None:
        """UncertaintyReport.to_json() produces valid JSON."""
        raw = generate_patient_bundle(tmp_path / "raw", image_size_bytes=4096)

        from cryptoflow.stages.ingest import ingest
        blobs = ingest({
            ModalityType.IMAGE: raw["image"],
            ModalityType.TEXT: raw["text"],
            ModalityType.METADATA: raw["metadata"],
        })

        report = assess_uncertainty(blobs)
        report_json = report.to_json()

        # Should be JSON-serialisable
        json_str = json.dumps(report_json)
        parsed = json.loads(json_str)

        assert "modality_assessments" in parsed
        assert "fusion" in parsed
        assert "comparison" in parsed
        assert "completeness" in parsed
        assert parsed["completeness"] == 1.0


# =========================================================================
# Pipeline integration tests
# =========================================================================

class TestPipelineIntegration:
    """Verify uncertainty stage is correctly wired into the pipeline."""

    def test_uncertainty_in_metadata(self, tmp_path: Path) -> None:
        """Pipeline metadata includes uncertainty report."""
        raw = generate_patient_bundle(tmp_path / "raw", image_size_bytes=4096)
        file_paths = {
            ModalityType.IMAGE: raw["image"],
            ModalityType.TEXT: raw["text"],
            ModalityType.METADATA: raw["metadata"],
        }

        enc_dir = tmp_path / "encrypted"
        _, _, meta = encrypt_pipeline(file_paths, enc_dir)

        assert "uncertainty" in meta
        assert meta["uncertainty"]["completeness"] == 1.0
        assert "fusion" in meta["uncertainty"]
        assert "comparison" in meta["uncertainty"]

    def test_uncertainty_in_manifest(self, tmp_path: Path) -> None:
        """Uncertainty profile is embedded in the bundle manifest."""
        raw = generate_patient_bundle(tmp_path / "raw", image_size_bytes=4096)
        file_paths = {
            ModalityType.IMAGE: raw["image"],
            ModalityType.TEXT: raw["text"],
            ModalityType.METADATA: raw["metadata"],
        }

        enc_dir = tmp_path / "encrypted"
        bundle_path, _, _ = encrypt_pipeline(file_paths, enc_dir)

        # Parse the bundle to extract the manifest
        import struct
        bundle_data = bundle_path.read_bytes()
        manifest_len = struct.unpack_from("<I", bundle_data, 24)[0]
        manifest_bytes = bundle_data[64:64 + manifest_len]
        manifest = json.loads(manifest_bytes.decode("utf-8"))

        assert "uncertainty_profile" in manifest
        up = manifest["uncertainty_profile"]
        assert up["completeness"] == 1.0
        assert len(up["modality_assessments"]) == 3
        assert "fusion" in up
        assert "comparison" in up

    def test_roundtrip_with_uncertainty(self, tmp_path: Path) -> None:
        """Full encrypt-decrypt roundtrip still works with the new stage."""
        raw = generate_patient_bundle(tmp_path / "raw", image_size_bytes=4096)
        file_paths = {
            ModalityType.IMAGE: raw["image"],
            ModalityType.TEXT: raw["text"],
            ModalityType.METADATA: raw["metadata"],
        }

        orig_image = raw["image"].read_bytes()
        orig_text = raw["text"].read_bytes()
        orig_meta = raw["metadata"].read_bytes()

        enc_dir = tmp_path / "encrypted"
        bundle_path, keyring_path, _ = encrypt_pipeline(file_paths, enc_dir)

        dec_dir = tmp_path / "decrypted"
        restored = decrypt_bundle(bundle_path, keyring_path, dec_dir)

        assert len(restored) == 3
        restored_map = {p.name: p for p in restored}
        assert restored_map[raw["image"].name].read_bytes() == orig_image
        assert restored_map[raw["text"].name].read_bytes() == orig_text
        assert restored_map[raw["metadata"].name].read_bytes() == orig_meta

    def test_progress_callback_includes_uncertainty(self, tmp_path: Path) -> None:
        """Progress callback fires for the uncertainty stage."""
        raw = generate_patient_bundle(tmp_path / "raw", image_size_bytes=4096)
        file_paths = {
            ModalityType.IMAGE: raw["image"],
            ModalityType.TEXT: raw["text"],
            ModalityType.METADATA: raw["metadata"],
        }

        stages: list[tuple[int, str]] = []
        def on_progress(num: int, name: str, details: dict) -> None:
            stages.append((num, name))

        enc_dir = tmp_path / "encrypted"
        encrypt_pipeline(file_paths, enc_dir, progress_callback=on_progress)

        # 7 callbacks: Started(0) + 6 stages
        assert len(stages) == 7
        assert stages[2] == (2, "Uncertainty Quantification (DST + DEL)")


# =========================================================================
# Theory comparison tests
# =========================================================================

class TestTheoryComparison:
    """Verify DST vs DEL comparison logic."""

    def test_agreement_on_reliable_data(self, tmp_path: Path) -> None:
        """Both theories should agree on well-formed data."""
        raw = generate_patient_bundle(tmp_path / "raw", image_size_bytes=4096)

        from cryptoflow.stages.ingest import ingest
        blobs = ingest({
            ModalityType.IMAGE: raw["image"],
            ModalityType.TEXT: raw["text"],
            ModalityType.METADATA: raw["metadata"],
        })

        report = assess_uncertainty(blobs)

        # Well-formed synthetic data should be deemed reliable
        assert report.comparison.reliability_agreement is True
        assert report.fusion.dst.belief_reliable > 0.3
        assert report.fusion.del_result.expected_reliable > 0.5

    def test_missing_data_increases_uncertainty(self, tmp_path: Path) -> None:
        """Missing modalities should increase uncertainty in both theories."""
        raw = generate_patient_bundle(tmp_path / "raw", image_size_bytes=4096)

        from cryptoflow.stages.ingest import ingest

        full_blobs = ingest({
            ModalityType.IMAGE: raw["image"],
            ModalityType.TEXT: raw["text"],
            ModalityType.METADATA: raw["metadata"],
        })
        partial_blobs = ingest({
            ModalityType.IMAGE: raw["image"],
        })

        full_report = assess_uncertainty(full_blobs)
        partial_report = assess_uncertainty(partial_blobs)

        # DEL: more missing → higher epistemic uncertainty
        assert (partial_report.fusion.del_result.epistemic_uncertainty
                >= full_report.fusion.del_result.epistemic_uncertainty)

        # Completeness should reflect the difference
        assert full_report.completeness > partial_report.completeness
