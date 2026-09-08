"""Stage 2 — Uncertainty Quantification for Multi-Modal Medical Data.

Implements two uncertainty quantification frameworks for head-to-head
comparison on the same ingested medical data:

1. **Dempster-Shafer Theory (DST)** — a classical evidence theory
   introduced by Shafer (1976).  Models belief, disbelief, and
   explicit *ignorance* via mass functions over a frame of
   discernment Θ = {reliable, unreliable}.  Multiple evidence
   sources are fused with Dempster's Rule of Combination, which
   also produces a conflict coefficient *K* indicating inter-source
   disagreement.

2. **Deep Evidential Learning (DEL)** — a modern neural/statistical
   approach proposed by Sensoy et al. (2018).  Models uncertainty
   through Dirichlet distributions Dir(α_r, α_u) whose
   concentration parameters encode accumulated evidence.  Epistemic
   uncertainty (lack of evidence) is u = K/S where K is the number
   of classes and S = Σα is the Dirichlet strength.

Both theories address two clinically relevant uncertainty types:

* **Multi-modal Fusion Uncertainty** — when heterogeneous modalities
  (image, text, metadata) are combined, how consistent and reliable
  is each source?  Should they be trusted equally?

* **Missing Information Uncertainty** — when a patient record is
  incomplete, how do we quantify and communicate that
  incompleteness?  DST assigns mass to the full frame (explicit
  ignorance); DEL produces the vacuous Dirichlet Dir(1,1) with
  maximum epistemic uncertainty u = 1.

References
----------
Shafer, G. (1976). *A Mathematical Theory of Evidence*. Princeton
    University Press.
Sensoy, M., Kaplan, L., & Kandemir, M. (2018). Evidential Deep
    Learning to Quantify Classification Uncertainty. *NeurIPS 2018*.
"""

from __future__ import annotations

import logging
import math
from collections import Counter

from cryptoflow.models.modality import ModalityType, NormalizedBlob
from cryptoflow.models.uncertainty import (
    DELResult,
    DSTResult,
    FeatureVector,
    FusionResult,
    ModalityAssessment,
    TheoryComparison,
    UncertaintyReport,
)

logger = logging.getLogger(__name__)

# All possible modality types in a complete patient record
ALL_MODALITIES: list[ModalityType] = [
    ModalityType.IMAGE,
    ModalityType.TEXT,
    ModalityType.METADATA,
]

# ── Expected feature ranges per modality ────────────────────────────────

# Shannon entropy in bits — expected [low, high] for well-formed files
_ENTROPY_RANGES: dict[ModalityType, tuple[float, float]] = {
    ModalityType.IMAGE: (4.0, 7.95),       # binary image data
    ModalityType.TEXT: (3.0, 5.5),          # natural-language text
    ModalityType.METADATA: (2.5, 5.5),      # structured JSON
}

# File size in bytes — expected [min, max]
_SIZE_RANGES: dict[ModalityType, tuple[int, int]] = {
    ModalityType.IMAGE: (256, 200 * 1024 * 1024),
    ModalityType.TEXT: (50, 10 * 1024 * 1024),
    ModalityType.METADATA: (20, 1 * 1024 * 1024),
}

# ── DST hyper-parameters ────────────────────────────────────────────────

_DST_EVIDENCE_WEIGHT: float = 0.6
"""Maximum mass a single feature source can contribute."""

_DST_DECAY_FACTOR: float = 0.5
"""Fraction of counter-evidence mass relative to direct evidence.
Prevents a single weak feature from dominating the unreliable class."""

# ── DEL hyper-parameters ────────────────────────────────────────────────

_DEL_EVIDENCE_SCALE: float = 10.0
"""Scales normalised feature scores into Dirichlet evidence counts.
Higher values produce sharper (more confident) Dirichlet distributions."""


# =========================================================================
# Feature extraction
# =========================================================================

def _shannon_entropy(data: bytes) -> float:
    """Compute Shannon entropy of the byte-value distribution.

    Returns entropy in bits, range [0, 8].  A value of 0 means a
    single byte value repeated; 8.0 means all 256 byte values are
    equally likely (maximally random).
    """
    if len(data) == 0:
        return 0.0

    counts = Counter(data)
    total = len(data)
    entropy = 0.0

    for count in counts.values():
        if count > 0:
            p = count / total
            entropy -= p * math.log2(p)

    return entropy


def _entropy_score(entropy: float, modality_type: ModalityType) -> float:
    """Score how well entropy fits the expected range for *modality_type*.

    Returns 1.0 when entropy is within the expected range, decaying
    smoothly (Gaussian, σ = 1.5) outside it.
    """
    low, high = _ENTROPY_RANGES[modality_type]

    if low <= entropy <= high:
        return 1.0

    distance = (low - entropy) if entropy < low else (entropy - high)
    sigma = 1.5
    return math.exp(-(distance ** 2) / (2 * sigma ** 2))


def _size_score(size: int, modality_type: ModalityType) -> float:
    """Score how well *size* fits the expected range for *modality_type*.

    Returns 1.0 when within range; decays as a ratio outside.
    """
    min_size, max_size = _SIZE_RANGES[modality_type]

    if min_size <= size <= max_size:
        return 1.0

    if size < min_size:
        return max(0.0, size / min_size) if size > 0 else 0.0

    return max(0.0, max_size / size)


def _format_score(payload: bytes, modality_type: ModalityType) -> float:
    """Score format validity from expected magic bytes / structure.

    Returns 1.0 for a recognised format header, 0.0 for completely
    invalid, and intermediate values for partial matches.
    """
    if len(payload) == 0:
        return 0.0

    if modality_type == ModalityType.IMAGE:
        # DICOM preamble: 128 zero-ish bytes then "DICM"
        if len(payload) >= 132 and payload[128:132] == b"DICM":
            return 1.0
        # PNG signature
        if payload[:8] == b"\x89PNG\r\n\x1a\n":
            return 1.0
        # JPEG SOI marker
        if payload[:2] == b"\xff\xd8":
            return 1.0
        # TIFF (little-endian or big-endian)
        if payload[:4] in (b"II\x2a\x00", b"MM\x00\x2a"):
            return 1.0
        # Unrecognised binary — partial credit
        return 0.3

    if modality_type == ModalityType.TEXT:
        # Printable-character ratio over first 4 KiB
        sample = payload[:4096]
        printable = sum(
            1 for b in sample
            if 32 <= b <= 126 or b in (9, 10, 13)
        )
        return min(1.0, printable / len(sample))

    if modality_type == ModalityType.METADATA:
        # JSON files should open with '{' or '['
        stripped = payload[:64].lstrip()
        if stripped[:1] in (b"{", b"["):
            return 1.0
        return 0.1

    return 0.5  # unknown modality type — neutral


def extract_features(blob: NormalizedBlob) -> FeatureVector:
    """Extract quality features from a normalised blob's payload.

    Args:
        blob: A normalised blob from the ingest stage.

    Returns:
        Feature vector with entropy and quality scores.
    """
    payload = blob.payload
    modality = blob.modality_type

    entropy = _shannon_entropy(payload)
    e_score = _entropy_score(entropy, modality)
    s_score = _size_score(blob.original_size, modality)
    f_score = _format_score(payload, modality)

    return FeatureVector(
        entropy=entropy,
        entropy_score=e_score,
        size_score=s_score,
        format_score=f_score,
    )


# =========================================================================
# Dempster-Shafer Theory (DST) engine
# =========================================================================

def _dst_mass_from_feature(score: float) -> tuple[float, float, float]:
    """Compute a DST basic probability assignment from one feature score.

    Maps a quality score s ∈ [0, 1] to a mass function over the
    frame Θ = {reliable, unreliable}:

        m({reliable})   = w · s
        m({unreliable}) = w · (1 − s) · d
        m(Θ)            = 1 − m({r}) − m({u})

    where *w* = ``_DST_EVIDENCE_WEIGHT`` and *d* = ``_DST_DECAY_FACTOR``.

    Returns:
        Tuple ``(m_reliable, m_unreliable, m_theta)``.
    """
    w = _DST_EVIDENCE_WEIGHT
    d = _DST_DECAY_FACTOR

    m_r = w * score
    m_u = w * (1.0 - score) * d
    m_t = 1.0 - m_r - m_u

    return m_r, m_u, m_t


def _dst_combine(
    m1: tuple[float, float, float],
    m2: tuple[float, float, float],
) -> tuple[float, float, float, float]:
    """Combine two DST mass functions via Dempster's Rule.

    For frame Θ = {r, u} the focal elements are {r}, {u}, Θ.

    Dempster's Rule normalises by the complement of the conflict::

        m₁₂(A) = (1 / (1−K)) · Σ_{B∩C=A} m₁(B) · m₂(C)
        K       = Σ_{B∩C=∅} m₁(B) · m₂(C)

    Args:
        m1: First mass function ``(m_r, m_u, m_theta)``.
        m2: Second mass function.

    Returns:
        ``(combined_r, combined_u, combined_theta, conflict_K)``.
    """
    m1_r, m1_u, m1_t = m1
    m2_r, m2_u, m2_t = m2

    # Conflict: intersections that yield the empty set
    K = m1_r * m2_u + m1_u * m2_r

    if K >= 1.0:
        # Total conflict — fall back to vacuous mass
        return 0.0, 0.0, 1.0, K

    norm = 1.0 / (1.0 - K)

    # {r} ∩ {r} = {r},  {r} ∩ Θ = {r},  Θ ∩ {r} = {r}
    combined_r = norm * (m1_r * m2_r + m1_r * m2_t + m1_t * m2_r)

    # {u} ∩ {u} = {u},  {u} ∩ Θ = {u},  Θ ∩ {u} = {u}
    combined_u = norm * (m1_u * m2_u + m1_u * m2_t + m1_t * m2_u)

    # Θ ∩ Θ = Θ
    combined_t = norm * (m1_t * m2_t)

    return combined_r, combined_u, combined_t, K


def _dst_assess(features: FeatureVector | None) -> DSTResult:
    """Apply Dempster-Shafer Theory to a single modality.

    For **present** modalities the three feature scores (entropy,
    size, format) each produce an independent mass function which
    are then combined via Dempster's Rule.

    For **missing** modalities the vacuous mass function
    ``m(Θ) = 1`` is returned — representing total ignorance.

    Args:
        features: Extracted feature vector, or ``None`` for an
            absent modality.

    Returns:
        :class:`DSTResult` with mass function and derived metrics.
    """
    if features is None:
        # Vacuous BPA — complete ignorance for missing modality
        return DSTResult(
            mass_reliable=0.0,
            mass_unreliable=0.0,
            mass_uncertain=1.0,
            belief_reliable=0.0,
            plausibility_reliable=1.0,
            uncertainty_interval=1.0,
        )

    # Independent mass functions from each feature
    m_entropy = _dst_mass_from_feature(features.entropy_score)
    m_size = _dst_mass_from_feature(features.size_score)
    m_format = _dst_mass_from_feature(features.format_score)

    # Pair-wise combination (Dempster's Rule is associative)
    r, u, t, _ = _dst_combine(m_entropy, m_size)
    r, u, t, _ = _dst_combine((r, u, t), m_format)

    # Belief / Plausibility for {reliable}
    bel_r = r                     # Bel({r}) = m({r})
    pl_r = r + t                  # Pl({r})  = 1 − m({u})
    uncertainty = pl_r - bel_r    # Width of [Bel, Pl] interval

    return DSTResult(
        mass_reliable=r,
        mass_unreliable=u,
        mass_uncertain=t,
        belief_reliable=bel_r,
        plausibility_reliable=pl_r,
        uncertainty_interval=uncertainty,
    )


def _dst_fuse_modalities(
    mass_functions: list[tuple[float, float, float]],
) -> tuple[DSTResult, float]:
    """Fuse per-modality DST mass functions into a single assessment.

    Iteratively applies Dempster's Rule across all modalities and
    tracks the maximum conflict coefficient observed.

    Returns:
        ``(fused_DSTResult, max_conflict_K)``.
    """
    if not mass_functions:
        return DSTResult(
            mass_reliable=0.0,
            mass_unreliable=0.0,
            mass_uncertain=1.0,
            belief_reliable=0.0,
            plausibility_reliable=1.0,
            uncertainty_interval=1.0,
        ), 0.0

    current = mass_functions[0]
    max_conflict = 0.0

    for i in range(1, len(mass_functions)):
        r, u, t, k = _dst_combine(current, mass_functions[i])
        current = (r, u, t)
        max_conflict = max(max_conflict, k)

    m_r, m_u, m_t = current
    bel_r = m_r
    pl_r = m_r + m_t

    return DSTResult(
        mass_reliable=m_r,
        mass_unreliable=m_u,
        mass_uncertain=m_t,
        belief_reliable=bel_r,
        plausibility_reliable=pl_r,
        uncertainty_interval=pl_r - bel_r,
    ), max_conflict


# =========================================================================
# Deep Evidential Learning (DEL) engine
# =========================================================================

def _del_assess(features: FeatureVector | None) -> DELResult:
    """Apply Deep Evidential Learning to a single modality.

    Maps extracted features to Dirichlet concentration parameters
    α = [α_r, α_u] where α_i = 1 + evidence_i.  The prior (α = 1
    per class) represents zero evidence.

    For **present** modalities, evidence is derived from the feature
    quality scores and a confidence factor (weakest-link principle).

    For **missing** modalities, the vacuous Dirichlet ``Dir(1, 1)``
    is returned — a uniform distribution with maximum epistemic
    uncertainty ``u = 1.0``.

    Args:
        features: Extracted feature vector, or ``None`` for an
            absent modality.

    Returns:
        :class:`DELResult` with Dirichlet parameters and metrics.
    """
    K = 2  # number of classes: {reliable, unreliable}

    if features is None:
        # Vacuous Dirichlet — uniform prior, maximum uncertainty
        return DELResult(
            alpha_reliable=1.0,
            alpha_unreliable=1.0,
            expected_reliable=0.5,
            expected_unreliable=0.5,
            epistemic_uncertainty=1.0,
            dirichlet_strength=2.0,
        )

    # Quality: mean of all feature scores → direction of evidence
    quality = (
        features.entropy_score
        + features.size_score
        + features.format_score
    ) / 3.0

    # Confidence: weakest-link principle → scales total evidence
    confidence = min(
        features.entropy_score,
        features.size_score,
        features.format_score,
    )

    W = _DEL_EVIDENCE_SCALE

    evidence_r = quality * confidence * W
    evidence_u = (1.0 - quality) * confidence * W

    alpha_r = 1.0 + evidence_r
    alpha_u = 1.0 + evidence_u
    S = alpha_r + alpha_u

    return DELResult(
        alpha_reliable=alpha_r,
        alpha_unreliable=alpha_u,
        expected_reliable=alpha_r / S,
        expected_unreliable=alpha_u / S,
        epistemic_uncertainty=K / S,
        dirichlet_strength=S,
    )


def _del_fuse_modalities(del_results: list[DELResult]) -> DELResult:
    """Fuse per-modality DEL results via cumulative evidence.

    Uses the Dirichlet evidence accumulation principle: evidence
    from independent sources is additive while the shared prior
    is counted only once::

        α_fused = 1 + Σ (α_i − 1)   for each class dimension

    Args:
        del_results: Per-modality DEL assessments.

    Returns:
        Fused :class:`DELResult` with accumulated evidence.
    """
    K = 2

    if not del_results:
        return DELResult(
            alpha_reliable=1.0,
            alpha_unreliable=1.0,
            expected_reliable=0.5,
            expected_unreliable=0.5,
            epistemic_uncertainty=1.0,
            dirichlet_strength=2.0,
        )

    # Sum evidence (α − 1) from all modalities
    total_ev_r = sum(d.alpha_reliable - 1.0 for d in del_results)
    total_ev_u = sum(d.alpha_unreliable - 1.0 for d in del_results)

    alpha_r = 1.0 + total_ev_r
    alpha_u = 1.0 + total_ev_u
    S = alpha_r + alpha_u

    return DELResult(
        alpha_reliable=alpha_r,
        alpha_unreliable=alpha_u,
        expected_reliable=alpha_r / S,
        expected_unreliable=alpha_u / S,
        epistemic_uncertainty=K / S,
        dirichlet_strength=S,
    )


# =========================================================================
# Theory comparison engine
# =========================================================================

def _compare_theories(
    fusion_dst: DSTResult,
    fusion_del: DELResult,
    dst_conflict: float,
    completeness: float,
) -> TheoryComparison:
    """Generate a head-to-head comparison between DST and DEL.

    Determines whether the two theories agree on the dominant
    conclusion (reliable vs unreliable), computes the magnitude
    of disagreement, and produces a human-readable narrative.

    Args:
        fusion_dst: Fused DST result across modalities.
        fusion_del: Fused DEL result across modalities.
        dst_conflict: Dempster's conflict coefficient.
        completeness: Fraction of expected modalities present.

    Returns:
        :class:`TheoryComparison` with agreement analysis.
    """
    dst_says_reliable = fusion_dst.belief_reliable > fusion_dst.mass_unreliable
    del_says_reliable = fusion_del.expected_reliable > 0.5
    agreement = dst_says_reliable == del_says_reliable

    dst_unc = fusion_dst.uncertainty_interval
    del_unc = fusion_del.epistemic_uncertainty

    if dst_unc > del_unc + 0.05:
        unc_cmp = "DST reports higher uncertainty"
    elif del_unc > dst_unc + 0.05:
        unc_cmp = "DEL reports higher uncertainty"
    else:
        unc_cmp = "Both theories report similar uncertainty"

    # ── Build narrative ──────────────────────────────────────────
    parts: list[str] = []

    if agreement:
        word = "reliable" if dst_says_reliable else "potentially unreliable"
        parts.append(
            f"Both DST and DEL agree the multi-modal data is {word}."
        )
    else:
        parts.append(
            "DST and DEL DISAGREE on the data reliability assessment."
        )

    diff = abs(fusion_dst.belief_reliable - fusion_del.expected_reliable)
    parts.append(
        f"DST belief in reliability: {fusion_dst.belief_reliable:.1%}, "
        f"DEL expected reliability: {fusion_del.expected_reliable:.1%} "
        f"(difference: {diff:.1%})."
    )

    if dst_conflict > 0.3:
        parts.append(
            f"DST detected significant inter-modality conflict "
            f"(K={dst_conflict:.3f}), suggesting inconsistent "
            f"evidence across modalities."
        )

    if completeness < 1.0:
        parts.append(
            f"Data completeness is {completeness:.0%}. "
            f"Missing modalities increase uncertainty in both theories."
        )

    return TheoryComparison(
        reliability_agreement=agreement,
        dst_reliable_belief=fusion_dst.belief_reliable,
        del_reliable_probability=fusion_del.expected_reliable,
        belief_difference=diff,
        uncertainty_comparison=unc_cmp,
        narrative=" ".join(parts),
    )


# =========================================================================
# Public stage entry point
# =========================================================================

def assess_uncertainty(
    blobs: list[NormalizedBlob],
) -> UncertaintyReport:
    """Stage 2 — Assess uncertainty of ingested multi-modal data.

    Applies both Dempster-Shafer Theory and Deep Evidential
    Learning to the ingested blobs.  Produces per-modality
    assessments, a fused multi-modal result, and a direct
    head-to-head comparison.

    This stage sits between **Ingest** (Stage 1) and **KeyGen**
    (Stage 3) in the CryptoFlow pipeline.  It does *not* modify
    the blobs — it only reads them and produces an uncertainty
    report.

    Args:
        blobs: Normalised blobs from the ingest stage.

    Returns:
        :class:`UncertaintyReport` with the complete assessment.
    """
    logger.info(
        "[UNCERTAINTY] Starting uncertainty quantification "
        "on %d modalities",
        len(blobs),
    )

    # ── Determine completeness ──────────────────────────────────
    present_types = {blob.modality_type for blob in blobs}
    present_list = sorted(m.value for m in present_types)
    missing_list = sorted(
        m.value for m in ALL_MODALITIES if m not in present_types
    )
    completeness = len(present_types) / len(ALL_MODALITIES)

    logger.info(
        "[UNCERTAINTY] Present: %s | Missing: %s | Completeness: %.0f%%",
        present_list or "none",
        missing_list or "none",
        completeness * 100,
    )

    # ── Per-modality assessment ─────────────────────────────────
    assessments: list[ModalityAssessment] = []
    dst_masses: list[tuple[float, float, float]] = []
    del_results: list[DELResult] = []

    # Present modalities
    for blob in blobs:
        features = extract_features(blob)
        dst_res = _dst_assess(features)
        del_res = _del_assess(features)

        assessments.append(ModalityAssessment(
            modality=blob.modality_type.value,
            present=True,
            features=features,
            dst=dst_res,
            del_result=del_res,
        ))
        dst_masses.append((
            dst_res.mass_reliable,
            dst_res.mass_unreliable,
            dst_res.mass_uncertain,
        ))
        del_results.append(del_res)

        logger.info(
            "[UNCERTAINTY] %s: entropy=%.2f bits, "
            "DST Bel(reliable)=%.3f, "
            "DEL E[reliable]=%.3f, DEL u=%.3f",
            blob.modality_type.value,
            features.entropy,
            dst_res.belief_reliable,
            del_res.expected_reliable,
            del_res.epistemic_uncertainty,
        )

    # Missing modalities (vacuous evidence)
    for modality in ALL_MODALITIES:
        if modality not in present_types:
            dst_res = _dst_assess(None)
            del_res = _del_assess(None)

            assessments.append(ModalityAssessment(
                modality=modality.value,
                present=False,
                features=None,
                dst=dst_res,
                del_result=del_res,
            ))
            dst_masses.append((0.0, 0.0, 1.0))
            del_results.append(del_res)

            logger.info(
                "[UNCERTAINTY] %s: MISSING — "
                "DST m(Θ)=1.0, DEL u=1.0",
                modality.value,
            )

    # Deterministic ordering by modality name
    assessments.sort(key=lambda a: a.modality)

    # ── Multi-modal fusion ──────────────────────────────────────
    fused_dst, max_conflict = _dst_fuse_modalities(dst_masses)
    fused_del = _del_fuse_modalities(del_results)

    logger.info(
        "[UNCERTAINTY] Fusion — DST: Bel(reliable)=%.3f, "
        "Pl(reliable)=%.3f, conflict=%.3f",
        fused_dst.belief_reliable,
        fused_dst.plausibility_reliable,
        max_conflict,
    )
    logger.info(
        "[UNCERTAINTY] Fusion — DEL: E[reliable]=%.3f, "
        "u=%.3f, S=%.1f",
        fused_del.expected_reliable,
        fused_del.epistemic_uncertainty,
        fused_del.dirichlet_strength,
    )

    fusion = FusionResult(
        dst=fused_dst,
        del_result=fused_del,
        dst_conflict=max_conflict,
    )

    # ── Head-to-head comparison ─────────────────────────────────
    comparison = _compare_theories(
        fused_dst, fused_del, max_conflict, completeness,
    )
    logger.info("[UNCERTAINTY] Comparison: %s", comparison.narrative)
    logger.info("[UNCERTAINTY] Assessment complete")

    return UncertaintyReport(
        modality_assessments=assessments,
        fusion=fusion,
        comparison=comparison,
        completeness=completeness,
        present_modalities=present_list,
        missing_modalities=missing_list,
    )
