"""Publication-grade figure generator for CryptoFlow research evaluation.

Generates high-DPI matplotlib/seaborn charts illustrating throughput,
latency scaling, and storage overhead for inclusion in research papers.
"""

from __future__ import annotations

import logging
from pathlib import Path

import matplotlib.pyplot as plt
import seaborn as sns

from cryptoflow.benchmark.runner import AggregatedBenchmark
from cryptoflow.utils.io import ensure_dir

logger = logging.getLogger(__name__)

# Set publication style
sns.set_theme(style="whitegrid", font="sans-serif")
plt.rcParams.update({
    "font.size": 12,
    "axes.labelsize": 13,
    "axes.titlesize": 14,
    "xtick.labelsize": 11,
    "ytick.labelsize": 11,
    "legend.fontsize": 11,
    "figure.titlesize": 16,
})


def plot_throughput(
    benchmarks: list[AggregatedBenchmark],
    output_path: Path,
) -> None:
    """Plot Encryption vs Decryption throughput across file sizes."""
    ensure_dir(output_path.parent)

    labels = [b.size_label for b in benchmarks]
    enc_tp = [b.mean_enc_throughput_mb_s for b in benchmarks]
    dec_tp = [b.mean_dec_throughput_mb_s for b in benchmarks]

    fig, ax = plt.subplots(figsize=(8, 5), dpi=300)

    ax.plot(labels, enc_tp, marker="o", linewidth=2.5, color="#22d3ee", label="Encryption Throughput")
    ax.plot(labels, dec_tp, marker="s", linewidth=2.5, color="#34d399", label="Decryption Throughput")

    ax.set_title("CryptoFlow Throughput vs. Input Data Size", pad=15, fontweight="bold")
    ax.set_xlabel("Medical Bundle Size")
    ax.set_ylabel("Throughput (MB/s)")
    ax.legend(frameon=True, loc="best")
    ax.grid(True, linestyle="--", alpha=0.6)

    fig.tight_layout()
    fig.savefig(output_path, dpi=300)
    plt.close(fig)
    logger.info("[PLOT] Saved throughput plot to %s", output_path)


def plot_latency(
    benchmarks: list[AggregatedBenchmark],
    output_path: Path,
) -> None:
    """Plot Encryption vs Decryption execution latency."""
    ensure_dir(output_path.parent)

    import numpy as np

    labels = [b.size_label for b in benchmarks]
    enc_times = [b.mean_enc_time_s * 1000 for b in benchmarks]  # ms
    dec_times = [b.mean_dec_time_s * 1000 for b in benchmarks]  # ms

    x = np.arange(len(labels))
    width = 0.35

    fig, ax = plt.subplots(figsize=(8, 5), dpi=300)

    ax.bar(x - width / 2, enc_times, width, label="Encryption Latency", color="#38bdf8")
    ax.bar(x + width / 2, dec_times, width, label="Decryption Latency", color="#a78bfa")

    ax.set_title("CryptoFlow Latency by Data Size", pad=15, fontweight="bold")
    ax.set_xlabel("Medical Bundle Size")
    ax.set_ylabel("Latency (milliseconds)")
    ax.set_xticks(x)
    ax.set_xticklabels(labels)
    ax.legend(frameon=True)
    ax.grid(True, linestyle="--", alpha=0.6)

    fig.tight_layout()
    fig.savefig(output_path, dpi=300)
    plt.close(fig)
    logger.info("[PLOT] Saved latency plot to %s", output_path)


def plot_overhead(
    benchmarks: list[AggregatedBenchmark],
    output_path: Path,
) -> None:
    """Plot storage overhead percentage across bundle sizes."""
    ensure_dir(output_path.parent)

    labels = [b.size_label for b in benchmarks]
    # Overhead percentage = (overhead_ratio - 1.0) * 100
    overhead_pct = [(b.overhead_ratio - 1.0) * 100 for b in benchmarks]

    fig, ax = plt.subplots(figsize=(8, 5), dpi=300)

    bars = ax.bar(labels, overhead_pct, color="#f59e0b", width=0.5, edgecolor="#b45309")

    # Add text labels on top of bars
    for bar in bars:
        height = bar.get_height()
        ax.annotate(
            f"{height:.2f}%",
            xy=(bar.get_x() + bar.get_width() / 2, height),
            xytext=(0, 3),
            textcoords="offset points",
            ha="center",
            va="bottom",
            fontsize=10,
        )

    ax.set_title("Storage Overhead Percentage by Bundle Size", pad=15, fontweight="bold")
    ax.set_xlabel("Medical Bundle Size")
    ax.set_ylabel("Bundle Size Overhead (%)")
    ax.grid(True, linestyle="--", alpha=0.6)

    fig.tight_layout()
    fig.savefig(output_path, dpi=300)
    plt.close(fig)
    logger.info("[PLOT] Saved overhead plot to %s", output_path)


def generate_all_plots(
    benchmarks: list[AggregatedBenchmark],
    output_dir: Path,
) -> dict[str, Path]:
    """Generate all standard evaluation figures."""
    ensure_dir(output_dir)
    p1 = output_dir / "throughput_analysis.png"
    p2 = output_dir / "latency_analysis.png"
    p3 = output_dir / "overhead_analysis.png"

    plot_throughput(benchmarks, p1)
    plot_latency(benchmarks, p2)
    plot_overhead(benchmarks, p3)

    return {
        "throughput": p1,
        "latency": p2,
        "overhead": p3,
    }
