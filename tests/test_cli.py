"""Unit tests for the CLI interface using Typer CliRunner."""

from __future__ import annotations

from pathlib import Path
from typer.testing import CliRunner

from cryptoflow.cli import app

runner = CliRunner()


def test_cli_help() -> None:
    result = runner.invoke(app, ["--help"])
    assert result.exit_code == 0
    assert "CryptoFlow" in result.stdout


def test_cli_generate_data(tmp_path: Path) -> None:
    out_dir = tmp_path / "synth_cli"
    result = runner.invoke(app, ["generate-data", "--count", "2", "--image-size", "5KB", "--output", str(out_dir)])
    assert result.exit_code == 0
    assert "Dataset created at" in result.stdout
    assert (out_dir / "patient_000_scan.dcm").exists()


def test_cli_encrypt_decrypt(tmp_path: Path) -> None:
    # 1. Generate data
    synth_dir = tmp_path / "synth"
    runner.invoke(app, ["generate-data", "--count", "1", "--image-size", "5KB", "--output", str(synth_dir)])

    img = synth_dir / "patient_000_scan.dcm"
    txt = synth_dir / "patient_000_report.txt"
    meta = synth_dir / "patient_000_meta.json"

    # 2. Encrypt
    enc_dir = tmp_path / "enc"
    enc_res = runner.invoke(app, ["encrypt", "-i", str(img), "-t", str(txt), "-m", str(meta), "-o", str(enc_dir)])
    assert enc_res.exit_code == 0
    assert "Success" in enc_res.stdout

    bundles = list(enc_dir.glob("*.cryptoflow"))
    keyrings = list(enc_dir.glob("*.keyring"))
    assert len(bundles) == 1
    assert len(keyrings) == 1

    # 3. Decrypt
    dec_dir = tmp_path / "dec"
    dec_res = runner.invoke(app, ["decrypt", "-b", str(bundles[0]), "-k", str(keyrings[0]), "-o", str(dec_dir)])
    assert dec_res.exit_code == 0
    assert "Integrity Verified" in dec_res.stdout
    assert (dec_dir / "patient_000_scan.dcm").exists()
    assert (dec_dir / "patient_000_report.txt").exists()
    assert (dec_dir / "patient_000_meta.json").exists()


def test_cli_attack_sim(tmp_path: Path) -> None:
    attack_dir = tmp_path / "attacks"
    res = runner.invoke(app, ["attack-sim", "--output", str(attack_dir)])
    assert res.exit_code == 0
    assert "Security Evaluation Result" in res.stdout
    assert "100% of attack attempts were successfully detected" in res.stdout
