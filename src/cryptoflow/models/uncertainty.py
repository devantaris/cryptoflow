"""Uncertainty quantification models for CryptoFlow.

Defines the data structures for representing uncertainty assessments
produced by the Dempster-Shafer Theory (DST) and Deep Evidential
Learning (DEL) frameworks applied to multi-modal medical data.

Two uncertainty types are modelled:

1. **Multi-modal Fusion Uncertainty** — when combining heterogeneous
   modalities (image + text + metadata), how consistent and reliable
   is each source?  Should they all be trusted equally?

2. **Missing Information Uncertainty** — when a patient record is
   incomplete and one or more modalities are absent, how do we
   quantify and communicate that incompleteness?
"""

from __future__ import annotations

from dataclasses import dataclass


# ---------------------------------------------------------------------------
# Feature extraction output
# ---------------------------------------------------------------------------

@dataclass(frozen=True, slots=True)
class FeatureVector:
    """Extracted quality features from a single modality's payload.

    These features are derived purely from the raw byte content and
    file metadata — no external models or databases are needed.

    Attributes:
        entropy: Shannon entropy of byte distribution (0–8 bits).
        entropy_score: Normalised quality score for entropy (0–1).
        size_score: How well the file size fits expected range (0–1).
        format_score: Format / header validity indicator (0–1).
    """

    entropy: float
    entropy_score: float
    size_score: float
    format_score: float

    def to_json(self) -> dict[str, float]:
        """Serialise to a JSON-safe dictionary."""
        return {
            "entropy_bits": round(self.entropy, 4),
            "entropy_score": round(self.entropy_score, 4),
            "size_score": round(self.size_score, 4),
            "format_score": round(self.format_score, 4),
        }


# ---------------------------------------------------------------------------
# Dempster-Shafer Theory (DST) output
# ---------------------------------------------------------------------------

@dataclass(frozen=True, slots=True)
class DSTResult:
    """Dempster-Shafer Theory mass function and derived metrics.

    The frame of discernment is Θ = {reliable, unreliable}.
    Three focal elements carry mass: {reliable}, {unreliable}, and
    the full frame Θ (representing ignorance / uncommitted belief).

    Attributes:
        mass_reliable: m({reliable}) — mass assigned to reliability.
        mass_unreliable: m({unreliable}) — mass for unreliability.
        mass_uncertain: m(Θ) — mass assigned to the full frame
            (explicit ignorance).
        belief_reliable: Bel({reliable}) — lower bound of confidence
            in reliability.
        plausibility_reliable: Pl({reliable}) — upper bound of
            confidence in reliability.
        uncertainty_interval: Width of [Bel, Pl] interval.
    """

    mass_reliable: float
    mass_unreliable: float
    mass_uncertain: float
    belief_reliable: float
    plausibility_reliable: float
    uncertainty_interval: float

    def to_json(self) -> dict[str, float]:
        """Serialise to a JSON-safe dictionary."""
        return {
            "mass_reliable": round(self.mass_reliable, 6),
            "mass_unreliable": round(self.mass_unreliable, 6),
            "mass_uncertain": round(self.mass_uncertain, 6),
            "belief_reliable": round(self.belief_reliable, 6),
            "plausibility_reliable": round(self.plausibility_reliable, 6),
            "uncertainty_interval": round(self.uncertainty_interval, 6),
        }


# ---------------------------------------------------------------------------
# Deep Evidential Learning (DEL) output
# ---------------------------------------------------------------------------

@dataclass(frozen=True, slots=True)
class DELResult:
    """Deep Evidential Learning Dirichlet-based uncertainty metrics.

    Models uncertainty via a Dirichlet distribution Dir(α_r, α_u)
    over the binary reliability simplex.  The concentration
    parameters encode accumulated evidence; epistemic uncertainty
    is inversely proportional to the Dirichlet strength S = Σα.

    Attributes:
        alpha_reliable: Dirichlet concentration for *reliable*.
        alpha_unreliable: Dirichlet concentration for *unreliable*.
        expected_reliable: E[p_reliable] = α_r / S.
        expected_unreliable: E[p_unreliable] = α_u / S.
        epistemic_uncertainty: u = K / S  (K = 2 classes).
        dirichlet_strength: S = α_r + α_u.
    """

    alpha_reliable: float
    alpha_unreliable: float
    expected_reliable: float
    expected_unreliable: float
    epistemic_uncertainty: float
    dirichlet_strength: float

    def to_json(self) -> dict[str, float]:
        """Serialise to a JSON-safe dictionary."""
        return {
            "alpha_reliable": round(self.alpha_reliable, 6),
            "alpha_unreliable": round(self.alpha_unreliable, 6),
            "expected_reliable": round(self.expected_reliable, 6),
            "expected_unreliable": round(self.expected_unreliable, 6),
            "epistemic_uncertainty": round(self.epistemic_uncertainty, 6),
            "dirichlet_strength": round(self.dirichlet_strength, 6),
        }


# ---------------------------------------------------------------------------
# Per-modality combined assessment
# ---------------------------------------------------------------------------

@dataclass(frozen=True, slots=True)
class ModalityAssessment:
    """Combined uncertainty assessment for a single modality.

    Holds the results from *both* theories side-by-side, together
    with the raw features and a presence flag.

    Attributes:
        modality: Modality type string (e.g. ``"image"``).
        present: Whether this modality was provided in the bundle.
        features: Extracted feature vector (``None`` if absent).
        dst: Dempster-Shafer result for this modality.
        del_result: Deep Evidential Learning result for this modality.
    """

    modality: str
    present: bool
    features: FeatureVector | None
    dst: DSTResult
    del_result: DELResult

    def to_json(self) -> dict[str, object]:
        """Serialise to a JSON-safe dictionary."""
        result: dict[str, object] = {
            "modality": self.modality,
            "present": self.present,
            "dst": self.dst.to_json(),
            "del": self.del_result.to_json(),
        }
        if self.features is not None:
            result["features"] = self.features.to_json()
        return result


# ---------------------------------------------------------------------------
# Multi-modal fusion result
# ---------------------------------------------------------------------------

@dataclass(frozen=True, slots=True)
class FusionResult:
    """Combined multi-modal fusion uncertainty from both theories.

    Attributes:
        dst: Fused DST result across all modalities (via
            Dempster's Rule of Combination).
        del_result: Fused DEL result across all modalities (via
            Dirichlet evidence accumulation).
        dst_conflict: Dempster's conflict coefficient *K*
            (0 = full agreement, 1 = total conflict).
    """

    dst: DSTResult
    del_result: DELResult
    dst_conflict: float

    def to_json(self) -> dict[str, object]:
        """Serialise to a JSON-safe dictionary."""
        return {
            "dst": self.dst.to_json(),
            "del": self.del_result.to_json(),
            "dst_conflict_K": round(self.dst_conflict, 6),
        }


# ---------------------------------------------------------------------------
# Head-to-head theory comparison
# ---------------------------------------------------------------------------

@dataclass(frozen=True, slots=True)
class TheoryComparison:
    """Head-to-head comparison between DST and DEL assessments.

    This is the academic novelty of the uncertainty stage: a direct
    comparison of a classical evidence theory (DST, 1976) with a
    modern neural/statistical approach (DEL, 2018) on identical
    multi-modal medical data.

    Attributes:
        reliability_agreement: Whether both theories agree on the
            dominant conclusion (reliable vs unreliable).
        dst_reliable_belief: DST's belief in reliability.
        del_reliable_probability: DEL's expected probability of
            reliability.
        belief_difference: Absolute difference between the two.
        uncertainty_comparison: Which theory reports higher
            uncertainty.
        narrative: Human-readable summary of the comparison.
    """

    reliability_agreement: bool
    dst_reliable_belief: float
    del_reliable_probability: float
    belief_difference: float
    uncertainty_comparison: str
    narrative: str

    def to_json(self) -> dict[str, object]:
        """Serialise to a JSON-safe dictionary."""
        return {
            "reliability_agreement": self.reliability_agreement,
            "dst_reliable_belief": round(self.dst_reliable_belief, 6),
            "del_reliable_probability": round(self.del_reliable_probability, 6),
            "belief_difference": round(self.belief_difference, 6),
            "uncertainty_comparison": self.uncertainty_comparison,
            "narrative": self.narrative,
        }


# ---------------------------------------------------------------------------
# Explainability report (SHAP for DST + LIME for DEL)
# ---------------------------------------------------------------------------

@dataclass(frozen=True, slots=True)
class ExplainabilityReport:
    """Explainability assessment attributing uncertainty drivers.

    Provides feature-level and modality-level attributions:
    - **SHAP for DST**: Exact Shapley values attributing contributions
      to Dempster-Shafer belief scores across non-linear combinations.
    - **LIME for DEL**: Local linear regression coefficients attributing
      evidence accumulation in Dirichlet Evidential Learning.

    Attributes:
        dst_shap_per_modality: Modality -> feature -> Shapley value.
        dst_shap_modality_level: Modality -> Shapley value.
        dst_dominant_feature: Feature with highest average |phi|.
        dst_dominant_modality: Modality with highest |phi|.
        del_lime_per_modality: Modality -> feature -> coefficient.
        del_lime_intercepts: Modality -> linear intercept.
        del_dominant_feature: Feature with highest average |beta|.
        del_dominant_modality: Modality with highest sum |beta|.
    """

    # SHAP for DST
    dst_shap_per_modality: dict[str, dict[str, float]]
    dst_shap_modality_level: dict[str, float]
    dst_dominant_feature: str
    dst_dominant_modality: str

    # LIME for DEL
    del_lime_per_modality: dict[str, dict[str, float]]
    del_lime_intercepts: dict[str, float]
    del_dominant_feature: str
    del_dominant_modality: str

    def to_json(self) -> dict[str, object]:
        """Serialise to a JSON-safe dictionary."""
        return {
            "dst_shap": {
                **{
                    mod: {k: round(v, 6) for k, v in feats.items()}
                    for mod, feats in self.dst_shap_per_modality.items()
                },
                "modality_shap": {
                    mod: round(v, 6)
                    for mod, v in self.dst_shap_modality_level.items()
                },
                "dominant_feature": self.dst_dominant_feature,
                "dominant_modality": self.dst_dominant_modality,
            },
            "del_lime": {
                **{
                    mod: {k: round(v, 6) for k, v in feats.items()}
                    for mod, feats in self.del_lime_per_modality.items()
                },
                "intercepts": {
                    mod: round(v, 6)
                    for mod, v in self.del_lime_intercepts.items()
                },
                "dominant_feature": self.del_dominant_feature,
                "dominant_modality": self.del_dominant_modality,
            },
            "dst_shap_per_modality": {
                mod: {k: round(v, 6) for k, v in feats.items()}
                for mod, feats in self.dst_shap_per_modality.items()
            },
            "dst_shap_modality_level": {
                mod: round(v, 6)
                for mod, v in self.dst_shap_modality_level.items()
            },
            "dst_dominant_feature": self.dst_dominant_feature,
            "dst_dominant_modality": self.dst_dominant_modality,
            "del_lime_per_modality": {
                mod: {k: round(v, 6) for k, v in feats.items()}
                for mod, feats in self.del_lime_per_modality.items()
            },
            "del_lime_intercepts": {
                mod: round(v, 6)
                for mod, v in self.del_lime_intercepts.items()
            },
            "del_dominant_feature": self.del_dominant_feature,
            "del_dominant_modality": self.del_dominant_modality,
        }


# ---------------------------------------------------------------------------
# Top-level uncertainty report
# ---------------------------------------------------------------------------

@dataclass(frozen=True, slots=True)
class UncertaintyReport:
    """Complete uncertainty quantification report for a patient bundle.

    This is the primary output of the uncertainty stage.  It
    contains per-modality assessments, fusion results, completeness
    metrics, a head-to-head comparison of DST vs DEL, and explainability.

    The JSON form of this report is embedded in the encrypted
    bundle's manifest so that the *receiver* also sees the
    uncertainty profile of the data they received.

    Attributes:
        modality_assessments: Per-modality uncertainty analysis.
        fusion: Combined multi-modal fusion uncertainty.
        comparison: Head-to-head DST vs DEL comparison.
        completeness: Fraction of expected modalities present (0–1).
        present_modalities: Modality type strings that were provided.
        missing_modalities: Modality type strings that were absent.
        explainability: SHAP and LIME explainability metrics.
    """

    modality_assessments: list[ModalityAssessment]
    fusion: FusionResult
    comparison: TheoryComparison
    completeness: float
    present_modalities: list[str]
    missing_modalities: list[str]
    explainability: ExplainabilityReport | None = None

    def to_json(self) -> dict[str, object]:
        """Serialise to a JSON-safe dictionary."""
        result: dict[str, object] = {
            "modality_assessments": [
                a.to_json() for a in self.modality_assessments
            ],
            "fusion": self.fusion.to_json(),
            "comparison": self.comparison.to_json(),
            "completeness": round(self.completeness, 4),
            "present_modalities": self.present_modalities,
            "missing_modalities": self.missing_modalities,
        }
        if self.explainability is not None:
            result["explainability"] = self.explainability.to_json()
        return result

