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


def test_cli_generate_keys(tmp_path: Path) -> None:
    key_dir = tmp_path / "keys"
    result = runner.invoke(app, ["generate-keys", "--output", str(key_dir), "--bits", "2048"])
    assert result.exit_code == 0
    assert "RSA Keypair Generated" in result.stdout
    assert (key_dir / "recipient_private.pem").exists()
    assert (key_dir / "recipient_public.pem").exists()


def test_cli_generate_data(tmp_path: Path) -> None:
    out_dir = tmp_path / "synth_cli"
    result = runner.invoke(app, ["generate-data", "--count", "2", "--image-size", "5KB", "--output-dir", str(out_dir)])
    assert result.exit_code == 0
    assert "Dataset created at" in result.stdout
    assert (out_dir / "patient_000_scan.dcm").exists()


def test_cli_encrypt_decrypt_standard(tmp_path: Path) -> None:
    # 1. Generate data
    synth_dir = tmp_path / "synth"
    runner.invoke(app, ["generate-data", "--count", "1", "--image-size", "5KB", "--output", str(synth_dir)])

    img = synth_dir / "patient_000_scan.dcm"
    txt = synth_dir / "patient_000_report.txt"
    meta = synth_dir / "patient_000_meta.json"

    # 2. Encrypt
    enc_dir = tmp_path / "enc"
    enc_res = runner.invoke(app, ["encrypt", "-i", str(img), "-t", str(txt), "-m", str(meta), "--output-dir", str(enc_dir)])
    assert enc_res.exit_code == 0
    assert "Success" in enc_res.stdout

    bundles = list(enc_dir.glob("*.cryptoflow"))
    keyrings = list(enc_dir.glob("*.keyring"))
    assert len(bundles) == 1
    assert len(keyrings) == 1

    # 3. Decrypt
    dec_dir = tmp_path / "dec"
    dec_res = runner.invoke(app, ["decrypt", "-b", str(bundles[0]), "-k", str(keyrings[0]), "--output-dir", str(dec_dir)])
    assert dec_res.exit_code == 0
    assert "Integrity Verified" in dec_res.stdout
    assert (dec_dir / "patient_000_scan.dcm").exists()
    assert (dec_dir / "patient_000_report.txt").exists()
    assert (dec_dir / "patient_000_meta.json").exists()


def test_cli_encrypt_folder_and_rsa_hybrid(tmp_path: Path) -> None:
    # 1. Generate patient folder & keys
    patient_dir = tmp_path / "patient_folder"
    runner.invoke(app, ["generate-data", "--count", "1", "--image-size", "5KB", "--output", str(patient_dir)])

    keys_dir = tmp_path / "keys"
    runner.invoke(app, ["generate-keys", "--output", str(keys_dir)])
    pub_key = keys_dir / "recipient_public.pem"
    priv_key = keys_dir / "recipient_private.pem"

    # 2. Encrypt directly from folder with RSA public key
    enc_dir = tmp_path / "enc_rsa"
    enc_res = runner.invoke(app, ["encrypt", str(patient_dir), "--output", str(enc_dir), "--pubkey", str(pub_key)])
    assert enc_res.exit_code == 0
    assert "Success" in enc_res.stdout

    bundle = list(enc_dir.glob("*.cryptoflow"))[0]
    keyring = list(enc_dir.glob("*.keyring"))[0]

    # 3. Decrypt with private key
    dec_dir = tmp_path / "dec_rsa"
    dec_res = runner.invoke(app, ["decrypt", str(bundle), "--keyring", str(keyring), "--privkey", str(priv_key), "--output", str(dec_dir)])
    assert dec_res.exit_code == 0
    assert "Integrity Verified" in dec_res.stdout


def test_cli_attack_sim(tmp_path: Path) -> None:
    attack_dir = tmp_path / "attacks"
    res = runner.invoke(app, ["attack-sim", "--output-dir", str(attack_dir)])
    assert res.exit_code == 0
    assert "Security Evaluation Result" in res.stdout
    assert "100% of attack attempts were successfully detected" in res.stdout


def test_cli_benchmark(tmp_path: Path) -> None:
    bench_dir = tmp_path / "bench"
    res = runner.invoke(app, ["benchmark", "--sizes", "10KB", "--iterations", "1", "--no-plots", "--output", str(bench_dir)])
    assert res.exit_code == 0
    assert (bench_dir / "benchmarks.csv").exists()
    assert (bench_dir / "benchmarks.json").exists()
