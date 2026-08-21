"""Benchmarking and evaluation subpackage for CryptoFlow."""

from __future__ import annotations

from cryptoflow.benchmark.plotter import (
    generate_all_plots,
    plot_latency,
    plot_overhead,
    plot_throughput,
)
from cryptoflow.benchmark.runner import (
    AggregatedBenchmark,
    BenchmarkIterationResult,
    BenchmarkRunner,
)

__all__ = [
    "AggregatedBenchmark",
    "BenchmarkIterationResult",
    "BenchmarkRunner",
    "generate_all_plots",
    "plot_latency",
    "plot_overhead",
    "plot_throughput",
]
