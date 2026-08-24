"""Command Line Interface for CryptoFlow.

Provides commands to encrypt multimodal patient records, decrypt bundles with
cross-modal verification, execute attack simulation batteries, generate synthetic
datasets, run empirical performance benchmarks, and generate RSA hybrid keypairs.
"""

from __future__ import annotations

import logging
import sys
from pathlib import Path
from typing import List, Optional

import typer
from rich.console import Console
from rich.panel import Panel
from rich.table import Table

from cryptoflow.attacks.simulator import AttackSimulator
from cryptoflow.benchmark.plotter import generate_all_plots
from cryptoflow.benchmark.runner import BenchmarkRunner
from cryptoflow.decrypt.pipeline import decrypt_bundle
from cryptoflow.exceptions import CryptoFlowError
from cryptoflow.models.modality import ModalityType
from cryptoflow.pipeline import encrypt_pipeline
from cryptoflow.synthetic import generate_dataset, generate_patient_bundle
from cryptoflow.utils.crypto import generate_rsa_keypair
from cryptoflow.utils.io import ensure_dir, format_size, write_file

app = typer.Typer(
    name="cryptoflow",
    help="CryptoFlow: Multimodal Medical Data Encryption & Integrity Verification Pipeline",
    add_completion=False,
)
console = Console()


def _parse_size_str(size_str: str) -> int:
    """Parse strings like '10MB', '500KB', '1GB' into integer byte counts."""
    s = size_str.strip().upper()
    if s.endswith("GB") or s.endswith("G"):
        return int(float(s.rstrip("GB").rstrip("G")) * 1024 * 1024 * 1024)
    if s.endswith("MB") or s.endswith("M"):
        return int(float(s.rstrip("MB").rstrip("M")) * 1024 * 1024)
    if s.endswith("KB") or s.endswith("K"):
        return int(float(s.rstrip("KB").rstrip("K")) * 1024)
    return int(s.rstrip("B"))


def _auto_discover_modality_files(dir_path: Path) -> dict[ModalityType, Path]:
    """Auto-discover image, text report, and JSON metadata files inside a directory."""
    files: dict[ModalityType, Path] = {}
    
    # Image discovery
    for ext in ("*.dcm", "*.png", "*.tiff", "*.tif", "*.jpg", "*.jpeg"):
        matches = list(dir_path.glob(ext))
        if matches:
            files[ModalityType.IMAGE] = matches[0]
            break

    # Text report discovery
    for ext in ("*.txt", "*.pdf", "*.report"):
        matches = [m for m in dir_path.glob(ext) if "meta" not in m.name.lower()]
        if matches:
            files[ModalityType.TEXT] = matches[0]
            break

    # Metadata discovery
    for ext in ("*.json", "*.meta"):
        matches = [m for m in dir_path.glob(ext) if not m.name.endswith(".keyring")]
        if matches:
            files[ModalityType.METADATA] = matches[0]
            break

    return files


@app.command("encrypt")
def encrypt_cmd(
    input_path: Optional[Path] = typer.Argument(None, help="Optional directory or file path to encrypt"),
    image: Optional[Path] = typer.Option(None, "--image", "-i", help="Path to medical image file (DICOM, PNG, TIFF, JPG)"),
    text: Optional[Path] = typer.Option(None, "--text", "-t", help="Path to radiology report (TXT, PDF)"),
    metadata: Optional[Path] = typer.Option(None, "--metadata", "-m", help="Path to patient metadata (JSON)"),
    output: Path = typer.Option(Path("./encrypted"), "--output", "-o", "--output-dir", help="Output directory for bundle and keyring"),
    pubkey: Optional[Path] = typer.Option(None, "--pubkey", "-p", "--recipient-pubkey", help="Optional recipient RSA public key PEM to wrap keyring"),
    verbose: bool = typer.Option(False, "--verbose", "-v", help="Enable verbose debug logging"),
) -> None:
    """Encrypt multiple medical modalities into an atomic .cryptoflow bundle."""
    log_level = logging.DEBUG if verbose else logging.INFO
    logging.basicConfig(level=log_level, format="%(message)s")

    file_paths: dict[ModalityType, Path] = {}

    # If input_path is a directory, auto-discover files
    if input_path is not None and input_path.is_dir():
        discovered = _auto_discover_modality_files(input_path)
        file_paths.update(discovered)

    if image is not None:
        file_paths[ModalityType.IMAGE] = image
    if text is not None:
        file_paths[ModalityType.TEXT] = text
    if metadata is not None:
        file_paths[ModalityType.METADATA] = metadata

    if not file_paths:
        console.print("[bold red]Error:[/bold red] At least one input file (--image, --text, --metadata or folder path) must be provided.")
        raise typer.Exit(code=1)

    console.print(Panel.fit("[bold cyan]CryptoFlow Encryption Pipeline[/bold cyan]\n[dim]Atomic Multimodal Packaging & Invariant Binding[/dim]"))

    try:
        bundle_path, keyring_path, stats = encrypt_pipeline(
            file_paths,
            output,
            recipient_pubkey_path=pubkey,
        )

        table = Table(title="Bundle Details", show_header=True, header_style="bold magenta")
        table.add_column("Artifact", style="cyan")
        table.add_column("Path", style="green")
        table.add_column("Size", justify="right")

        table.add_row("Encrypted Bundle (.cryptoflow)", str(bundle_path), format_size(bundle_path.stat().st_size))
        key_label = "Wrapped Keyring (.keyring [RSA-OAEP])" if pubkey else "Key Material (.keyring)"
        table.add_row(key_label, str(keyring_path), format_size(keyring_path.stat().st_size))

        console.print(table)
        console.print("[bold green]Success:[/bold green] Encryption & cross-modal binding complete!")

    except CryptoFlowError as e:
        console.print(f"[bold red]Pipeline Error:[/bold red] {e}")
        raise typer.Exit(code=1)


@app.command("decrypt")
def decrypt_cmd(
    bundle_arg: Optional[Path] = typer.Argument(None, help="Optional bundle path"),
    bundle: Optional[Path] = typer.Option(None, "--bundle", "-b", help="Path to .cryptoflow bundle file"),
    keyring: Optional[Path] = typer.Option(None, "--keyring", "-k", help="Path to .keyring JSON file"),
    output: Path = typer.Option(Path("./decrypted"), "--output", "-o", "--output-dir", help="Output directory for restored files"),
    privkey: Optional[Path] = typer.Option(None, "--privkey", "-p", "--private-key", help="Optional recipient RSA private key PEM for wrapped keyrings"),
    verbose: bool = typer.Option(False, "--verbose", "-v", help="Enable verbose debug logging"),
) -> None:
    """Verify integrity and decrypt a .cryptoflow bundle into original files."""
    log_level = logging.DEBUG if verbose else logging.INFO
    logging.basicConfig(level=log_level, format="%(message)s")

    bundle_path = bundle or bundle_arg
    if bundle_path is None:
        console.print("[bold red]Error:[/bold red] Bundle path must be provided via --bundle or positional argument.")
        raise typer.Exit(code=1)

    keyring_path = keyring
    if keyring_path is None:
        # Try finding matching .keyring in same directory
        candidate = bundle_path.with_suffix(".keyring")
        if candidate.exists():
            keyring_path = candidate
        else:
            console.print("[bold red]Error:[/bold red] Keyring path must be provided via --keyring.")
            raise typer.Exit(code=1)

    console.print(Panel.fit("[bold green]CryptoFlow Decryption & Verification Pipeline[/bold green]"))

    try:
        restored = decrypt_bundle(
            bundle_path,
            keyring_path,
            output,
            private_key_path=privkey,
        )

        table = Table(title="Restored Files", show_header=True, header_style="bold green")
        table.add_column("Filename", style="cyan")
        table.add_column("Restored Path", style="green")
        table.add_column("Size", justify="right")

        for p in restored:
            table.add_row(p.name, str(p), format_size(p.stat().st_size))

        console.print(table)
        console.print("[bold green]Integrity Verified:[/bold green] All cross-modal binding hashes and GCM auth tags verified successfully.")

    except CryptoFlowError as e:
        console.print(f"[bold red]Decryption Blocked / Tamper Detected:[/bold red] {e}")
        raise typer.Exit(code=1)
    except Exception as e:
        console.print(f"[bold red]Error:[/bold red] {e}")
        raise typer.Exit(code=1)


@app.command("generate-data")
def generate_data_cmd(
    count: int = typer.Option(5, "--count", "-c", help="Number of synthetic patient bundles to create"),
    image_size: str = typer.Option("1MB", "--image-size", "-s", help="Target size for image modality (e.g. 500KB, 5MB)"),
    output: Path = typer.Option(Path("./data/synthetic"), "--output", "-o", "--output-dir", help="Destination folder"),
) -> None:
    """Generate realistic synthetic medical datasets (DICOM, reports, metadata)."""
    size_bytes = _parse_size_str(image_size)
    console.print(f"[cyan]Generating {count} synthetic patient records (image size ~{image_size})...[/cyan]")

    bundles = generate_dataset(output, count=count, image_size_bytes=size_bytes)

    table = Table(title="Generated Dataset", show_header=True, header_style="bold blue")
    table.add_column("Patient Index", justify="center")
    table.add_column("Image File", style="green")
    table.add_column("Report File", style="yellow")
    table.add_column("Metadata File", style="magenta")

    for i, b in enumerate(bundles):
        table.add_row(f"P-{i:03d}", b["image"].name, b["text"].name, b["metadata"].name)

    console.print(table)
    console.print(f"[bold green]Dataset created at:[/bold green] {output.resolve()}")


@app.command("generate-keys")
def generate_keys_cmd(
    output: Path = typer.Option(Path("./keys"), "--output", "-o", "--output-dir", help="Destination directory for RSA keypair"),
    bits: int = typer.Option(2048, "--bits", "-b", help="RSA modulus bit length (2048 or 4096)"),
) -> None:
    """Generate an RSA public/private keypair for hybrid keyring wrapping."""
    ensure_dir(output)
    priv_pem, pub_pem = generate_rsa_keypair(key_size=bits)

    priv_path = output / "recipient_private.pem"
    pub_path = output / "recipient_public.pem"

    write_file(priv_path, priv_pem)
    write_file(pub_path, pub_pem)

    console.print(Panel.fit("[bold cyan]RSA Keypair Generated[/bold cyan]"))
    console.print(f"Private Key: [green]{priv_path}[/green]")
    console.print(f"Public Key:  [cyan]{pub_path}[/cyan]")


@app.command("attack-sim")
def attack_sim_cmd(
    output: Path = typer.Option(Path("./results/attacks"), "--output", "-o", "--output-dir", help="Directory for attack reports"),
) -> None:
    """Simulate 7 real-world cyberattacks and evaluate security enforcement."""
    console.print(Panel.fit("[bold red]CryptoFlow Cyberattack Simulation & Threat Modeling Suite[/bold red]"))
    simulator = AttackSimulator(working_dir=output)

    try:
        results = simulator.run_all_attacks()

        table = Table(title="Security & Threat Verification Scorecard", show_header=True, header_style="bold red")
        table.add_column("Attack Vector", style="cyan")
        table.add_column("Description", style="white")
        table.add_column("Security Control Status", justify="center")
        table.add_column("Triggered Exception", style="yellow")

        all_passed = True
        for r in results:
            status = "[bold green]BLOCKED (PASS)[/bold green]" if r.detected else "[bold red]ACCEPTED (FAIL)[/bold red]"
            if not r.detected:
                all_passed = False
            table.add_row(
                r.attack_type.value,
                r.description,
                status,
                r.exception_raised or "None",
            )

        console.print(table)
        if all_passed:
            console.print("[bold green]Security Evaluation Result:[/bold green] 100% of attack attempts were successfully detected and rejected.")
        else:
            console.print("[bold red]Security Vulnerability Detected![/bold red] One or more attacks succeeded.")

    finally:
        pass


@app.command("benchmark")
def benchmark_cmd(
    iterations: int = typer.Option(3, "--iterations", "-n", help="Number of benchmark iterations per size tier"),
    sizes: Optional[str] = typer.Option(None, "--sizes", "-s", help="Custom size tiers separated by commas or spaces (e.g. '100KB,1MB,5MB')"),
    output: Path = typer.Option(Path("./results"), "--output", "-o", "--output-dir", help="Output directory for benchmark data & plots"),
    generate_plots_flag: bool = typer.Option(True, "--plots/--no-plots", help="Generate publication-grade plots"),
) -> None:
    """Run performance benchmarks and generate publication-quality figures."""
    console.print(Panel.fit("[bold magenta]CryptoFlow Research Benchmark & Evaluation Harness[/bold magenta]"))

    runner = BenchmarkRunner()
    
    if sizes:
        # Split on commas or whitespace
        import re
        tokens = [t.strip() for t in re.split(r"[,\s]+", sizes) if t.strip()]
        size_tiers = [(s, _parse_size_str(s)) for s in tokens]
    else:
        size_tiers = [
            ("100 KB", 100 * 1024),
            ("1 MB", 1 * 1024 * 1024),
            ("5 MB", 5 * 1024 * 1024),
            ("10 MB", 10 * 1024 * 1024),
            ("25 MB", 25 * 1024 * 1024),
        ]

    try:
        with console.status("[bold green]Executing benchmark runs..."):
            results = runner.run_suite(size_tiers, iterations=iterations)

        csv_path = output / "benchmarks.csv"
        json_path = output / "benchmarks.json"
        runner.save_csv(results, csv_path)
        runner.save_json(results, json_path)

        table = Table(title="Benchmark Results Summary", show_header=True, header_style="bold cyan")
        table.add_column("Data Size", style="cyan")
        table.add_column("Enc Latency (s)", justify="right")
        table.add_column("Dec Latency (s)", justify="right")
        table.add_column("Enc Throughput (MB/s)", justify="right", style="green")
        table.add_column("Dec Throughput (MB/s)", justify="right", style="green")
        table.add_column("Overhead", justify="right", style="yellow")

        for r in results:
            table.add_row(
                r.size_label,
                f"{r.mean_enc_time_s:.4f} ± {r.std_enc_time_s:.4f}",
                f"{r.mean_dec_time_s:.4f} ± {r.std_dec_time_s:.4f}",
                f"{r.mean_enc_throughput_mb_s:.2f}",
                f"{r.mean_dec_throughput_mb_s:.2f}",
                f"{(r.overhead_ratio - 1.0) * 100:.2f}%",
            )

        console.print(table)
        console.print(f"[green]Data saved to:[/green] {csv_path} and {json_path}")

        if generate_plots_flag:
            plot_paths = generate_all_plots(results, output / "plots")
            console.print("[bold green]Publication Figures Generated:[/bold green]")
            for k, p in plot_paths.items():
                console.print(f"  - {k.capitalize()} Plot: [cyan]{p}[/cyan]")

    finally:
        runner.cleanup()


@app.command("serve")
def serve_cmd(
    host: str = typer.Option("127.0.0.1", "--host", "-h", help="Bind network interface host"),
    port: int = typer.Option(8000, "--port", "-p", help="Server port"),
    reload: bool = typer.Option(False, "--reload", "-r", help="Auto-reload on code change"),
) -> None:
    """Launch the CryptoFlow Web Application & API Server."""
    import uvicorn
    console.print(Panel.fit(f"[bold cyan]Launching CryptoFlow Platform[/bold cyan]\n[green]http://{host}:{port}[/green]"))
    uvicorn.run("cryptoflow.server:app", host=host, port=port, reload=reload)


if __name__ == "__main__":
    app()
