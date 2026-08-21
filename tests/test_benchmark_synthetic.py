"""Unit and integration tests for benchmark harness, plotter, and synthetic data."""

from __future__ import annotations

from pathlib import Path
import pytest

from cryptoflow.benchmark.plotter import generate_all_plots
from cryptoflow.benchmark.runner import BenchmarkRunner
from cryptoflow.synthetic import generate_dataset, generate_image, generate_metadata, generate_report
from cryptoflow.utils.io import detect_mime_type, detect_modality, format_size


def test_synthetic_data_generators() -> None:
    img = generate_image(512)
    assert len(img) == 512
    assert b"DICM" in img

    rep = generate_report()
    assert b"RADIOLOGY REPORT" in rep

    meta = generate_metadata()
    assert b"patient_id" in meta


def test_synthetic_dataset_creation(tmp_path: Path) -> None:
    bundles = generate_dataset(tmp_path / "dataset", count=2, image_size_bytes=1024)
    assert len(bundles) == 2
    assert bundles[0]["image"].exists()
    assert bundles[0]["text"].exists()
    assert bundles[0]["metadata"].exists()


def test_benchmark_runner_and_plots(tmp_path: Path) -> None:
    runner = BenchmarkRunner(work_dir=tmp_path / "bench")
    try:
        size_tiers = [
            ("5 KB", 5 * 1024),
            ("10 KB", 10 * 1024),
        ]
        results = runner.run_suite(size_tiers, iterations=2)
        assert len(results) == 2

        csv_p = tmp_path / "results" / "bench.csv"
        json_p = tmp_path / "results" / "bench.json"
        runner.save_csv(results, csv_p)
        runner.save_json(results, json_p)

        assert csv_p.exists()
        assert json_p.exists()

        plots = generate_all_plots(results, tmp_path / "plots")
        assert plots["throughput"].exists()
        assert plots["latency"].exists()
        assert plots["overhead"].exists()
    finally:
        runner.cleanup()


def test_io_utils(tmp_path: Path) -> None:
    assert format_size(1024) == "1.0 KB"
    assert format_size(1024 * 1024) == "1.0 MB"
    assert format_size(500) == "500 B"

    test_file = tmp_path / "test.dcm"
    test_file.write_bytes(b"123")
    assert detect_mime_type(test_file) == "application/dicom"
    assert detect_modality(test_file).value == "image"
