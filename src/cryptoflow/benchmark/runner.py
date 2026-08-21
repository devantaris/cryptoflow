"""Benchmarking suite for CryptoFlow.

Measures throughput (MB/s), latency, stage breakdown times, and storage
overhead across various file sizes and bundle configurations for inclusion
in research paper evaluations and performance analysis.
"""

from __future__ import annotations

import csv
import json
import logging
import statistics
import tempfile
import time
from dataclasses import asdict, dataclass
from pathlib import Path

from cryptoflow.decrypt.pipeline import decrypt_bundle
from cryptoflow.models.modality import ModalityType
from cryptoflow.pipeline import encrypt_pipeline
from cryptoflow.synthetic import generate_patient_bundle
from cryptoflow.utils.io import ensure_dir, format_size

logger = logging.getLogger(__name__)


@dataclass(slots=True)
class BenchmarkIterationResult:
    """Detailed timing of a single encryption/decryption run."""

    size_label: str
    raw_size_bytes: int
    bundle_size_bytes: int
    overhead_ratio: float
    enc_time_s: float
    dec_time_s: float
    enc_throughput_mb_s: float
    dec_throughput_mb_s: float


@dataclass(slots=True)
class AggregatedBenchmark:
    """Aggregated benchmark statistics across multiple runs."""

    size_label: str
    raw_size_bytes: int
    bundle_size_bytes: int
    overhead_ratio: float
    iterations: int
    mean_enc_time_s: float
    std_enc_time_s: float
    mean_dec_time_s: float
    std_dec_time_s: float
    mean_enc_throughput_mb_s: float
    mean_dec_throughput_mb_s: float


class BenchmarkRunner:
    """Harness to execute performance benchmarks on CryptoFlow."""

    def __init__(self, work_dir: Path | None = None) -> None:
        if work_dir is None:
            self._temp_dir = tempfile.TemporaryDirectory(prefix="cflow_bench_")
            self.work_dir = Path(self._temp_dir.name)
        else:
            self._temp_dir = None
            self.work_dir = Path(work_dir)
            self.work_dir.mkdir(parents=True, exist_ok=True)

    def cleanup(self) -> None:
        """Clean up working directory if temporary."""
        if self._temp_dir is not None:
            self._temp_dir.cleanup()

    def run_single(
        self,
        image_size_bytes: int,
        size_label: str,
    ) -> BenchmarkIterationResult:
        """Run one encryption + decryption benchmark trial."""
        test_dir = self.work_dir / f"test_{int(time.time()*1000)}"
        ensure_dir(test_dir)

        # 1. Generate synthetic bundle
        raw_files = generate_patient_bundle(
            test_dir / "input",
            image_size_bytes=image_size_bytes,
        )
        file_paths = {
            ModalityType.IMAGE: raw_files["image"],
            ModalityType.TEXT: raw_files["text"],
            ModalityType.METADATA: raw_files["metadata"],
        }
        total_raw_bytes = sum(p.stat().st_size for p in file_paths.values())

        # 2. Encrypt
        enc_dir = test_dir / "encrypted"
        t0 = time.perf_counter()
        bundle_path, keyring_path = encrypt_pipeline(file_paths, enc_dir)
        enc_time = time.perf_counter() - t0

        bundle_size = bundle_path.stat().st_size
        overhead = bundle_size / total_raw_bytes if total_raw_bytes > 0 else 1.0

        # 3. Decrypt
        dec_dir = test_dir / "decrypted"
        t1 = time.perf_counter()
        decrypt_bundle(bundle_path, keyring_path, dec_dir)
        dec_time = time.perf_counter() - t1

        # Throughput in MB/s (1 MB = 1,000,000 bytes)
        raw_mb = total_raw_bytes / (1024 * 1024)
        enc_throughput = (raw_mb / enc_time) if enc_time > 0 else 0.0
        dec_throughput = (raw_mb / dec_time) if dec_time > 0 else 0.0

        return BenchmarkIterationResult(
            size_label=size_label,
            raw_size_bytes=total_raw_bytes,
            bundle_size_bytes=bundle_size,
            overhead_ratio=overhead,
            enc_time_s=enc_time,
            dec_time_s=dec_time,
            enc_throughput_mb_s=enc_throughput,
            dec_throughput_mb_s=dec_throughput,
        )

    def run_suite(
        self,
        size_configs: list[tuple[str, int]] | None = None,
        iterations: int = 3,
    ) -> list[AggregatedBenchmark]:
        """Run benchmark suite across multiple file sizes with repeated trials."""
        if size_configs is None:
            size_configs = [
                ("100 KB", 100 * 1024),
                ("1 MB", 1 * 1024 * 1024),
                ("5 MB", 5 * 1024 * 1024),
                ("10 MB", 10 * 1024 * 1024),
                ("25 MB", 25 * 1024 * 1024),
            ]

        aggregated: list[AggregatedBenchmark] = []

        for label, size_bytes in size_configs:
            logger.info("[BENCH] Running benchmarks for %s (%d iterations)", label, iterations)
            trials: list[BenchmarkIterationResult] = []
            for it in range(iterations):
                logger.info("[BENCH]   Trial %d/%d for %s", it + 1, iterations, label)
                res = self.run_single(size_bytes, label)
                trials.append(res)

            enc_times = [t.enc_time_s for t in trials]
            dec_times = [t.dec_time_s for t in trials]
            enc_tps = [t.enc_throughput_mb_s for t in trials]
            dec_tps = [t.dec_throughput_mb_s for t in trials]

            agg = AggregatedBenchmark(
                size_label=label,
                raw_size_bytes=trials[0].raw_size_bytes,
                bundle_size_bytes=trials[0].bundle_size_bytes,
                overhead_ratio=statistics.mean(t.overhead_ratio for t in trials),
                iterations=iterations,
                mean_enc_time_s=statistics.mean(enc_times),
                std_enc_time_s=statistics.stdev(enc_times) if len(enc_times) > 1 else 0.0,
                mean_dec_time_s=statistics.mean(dec_times),
                std_dec_time_s=statistics.stdev(dec_times) if len(dec_times) > 1 else 0.0,
                mean_enc_throughput_mb_s=statistics.mean(enc_tps),
                mean_dec_throughput_mb_s=statistics.mean(dec_tps),
            )
            aggregated.append(agg)

        return aggregated

    @staticmethod
    def save_csv(results: list[AggregatedBenchmark], output_path: Path) -> None:
        """Export aggregated benchmark results to CSV format."""
        ensure_dir(output_path.parent)
        with open(output_path, "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow([
                "Size Label",
                "Raw Size (Bytes)",
                "Bundle Size (Bytes)",
                "Overhead Ratio",
                "Iterations",
                "Mean Enc Time (s)",
                "Std Enc Time (s)",
                "Mean Dec Time (s)",
                "Std Dec Time (s)",
                "Mean Enc Throughput (MB/s)",
                "Mean Dec Throughput (MB/s)",
            ])
            for r in results:
                writer.writerow([
                    r.size_label,
                    r.raw_size_bytes,
                    r.bundle_size_bytes,
                    f"{r.overhead_ratio:.4f}",
                    r.iterations,
                    f"{r.mean_enc_time_s:.5f}",
                    f"{r.std_enc_time_s:.5f}",
                    f"{r.mean_dec_time_s:.5f}",
                    f"{r.std_dec_time_s:.5f}",
                    f"{r.mean_enc_throughput_mb_s:.2f}",
                    f"{r.mean_dec_throughput_mb_s:.2f}",
                ])

    @staticmethod
    def save_json(results: list[AggregatedBenchmark], output_path: Path) -> None:
        """Export aggregated benchmark results to JSON format."""
        ensure_dir(output_path.parent)
        data = [asdict(r) for r in results]
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
