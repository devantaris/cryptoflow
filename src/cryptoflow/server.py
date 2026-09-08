"""FastAPI Web Server for CryptoFlow Platform.

Provides REST and WebSocket endpoints for the full CryptoFlow web platform:
- Encryption Studio: Multimodal packaging & cross-modal binding
- Pipeline Visualizer: Real-time stage transitions, keygen, and HMAC sealing
- Decryption & Integrity Inspector: Constant-time hash verification & restoration
- Cyberattack Sandbox: 7-vector threat execution and forensic reporting
- Benchmark Dashboard: Empirical latency, throughput, and overhead streaming
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
import shutil
import tempfile
import time
import uuid
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import (
    FastAPI,
    File,
    Form,
    HTTPException,
    UploadFile,
    WebSocket,
    WebSocketDisconnect,
    Request,
)
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from cryptoflow.attacks.simulator import AttackSimulator, AttackType
from cryptoflow.benchmark.runner import BenchmarkRunner
from cryptoflow.decrypt.pipeline import decrypt_bundle
from cryptoflow.exceptions import (
    AuthTagMismatchError,
    BindingMismatchError,
    CryptoFlowError,
    InvalidBundleError,
    KeyMismatchError,
)
from cryptoflow.models.modality import ModalityType
from cryptoflow.pipeline import encrypt_pipeline
from cryptoflow.synthetic import (
    generate_image,
    generate_metadata,
    generate_patient_bundle,
    generate_report,
)
from cryptoflow.utils.io import ensure_dir, format_size, read_file, write_file

logger = logging.getLogger("cryptoflow.server")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

app = FastAPI(
    title="CryptoFlow API",
    description="Multimodal Medical Data Encryption & Cross-Modal Integrity Binding Engine",
    version="0.1.0",
)

# Enable CORS for local Vite development and production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def request_logging_middleware(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    duration = time.time() - start_time
    logger.info(f"{request.method} {request.url.path} - {response.status_code} - {duration:.4f}s")
    return response

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": True, "error_code": "HTTP_ERROR", "message": exc.detail, "suggestion": "Check request parameters and try again."}
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = exc.errors()
    msg = ", ".join([f"{e['loc'][-1]}: {e['msg']}" for e in errors])
    return JSONResponse(
        status_code=422,
        content={"error": True, "error_code": "VALIDATION_ERROR", "message": msg, "suggestion": "Fix the fields mentioned in the message."}
    )

# Persistent storage directories
STORAGE_DIR = Path("./web_storage").resolve()
VAULT_DIR = STORAGE_DIR / "vault"
RESTORED_DIR = STORAGE_DIR / "restored"
ensure_dir(VAULT_DIR)
ensure_dir(RESTORED_DIR)

# Active WebSocket connections per operation_id
active_websockets: Dict[str, List[WebSocket]] = {}


async def broadcast_ws(op_id: str, message: dict) -> None:
    """Broadcast an event to all connected WebSocket subscribers for an operation."""
    if op_id in active_websockets:
        dead_sockets = []
        for ws in active_websockets[op_id]:
            try:
                await ws.send_json(message)
            except Exception:
                dead_sockets.append(ws)
        for dead in dead_sockets:
            active_websockets[op_id].remove(dead)


# ---------------------------------------------------------------------------
# Pydantic Schemas
# ---------------------------------------------------------------------------

class AttackRequest(BaseModel):
    attack_type: str
    patient_id: Optional[str] = "P-001"


class SyntheticRequest(BaseModel):
    count: int = 1
    image_size_kb: int = 100


# ---------------------------------------------------------------------------
# REST Endpoints
# ---------------------------------------------------------------------------

@app.get("/api/v1/health")
async def health_check() -> dict:
    """Health check endpoint."""
    return {
        "status": "online",
        "service": "CryptoFlow Cryptographic Engine",
        "version": "0.1.0",
        "timestamp": time.time(),
    }


@app.get("/api/v1/bundle-info")
async def get_bundle_info() -> dict:
    """List all bundles in vault with sizes and creation times."""
    bundles = []
    if VAULT_DIR.exists():
        for file in VAULT_DIR.glob("*.cryptoflow"):
            stat = file.stat()
            bundles.append({
                "filename": file.name,
                "size_bytes": stat.st_size,
                "creation_time": stat.st_ctime
            })
    return {"success": True, "total_count": len(bundles), "bundles": bundles}


@app.get("/api/v1/stats")
async def get_stats_endpoint() -> dict:
    """Return platform usage stats."""
    from cryptoflow.utils.stats import get_stats
    return {"success": True, "stats": get_stats()}


@app.post("/api/v1/keys/generate-rsa")
async def generate_rsa_keys(bits: int = 2048) -> dict:
    """Generate an RSA public/private keypair for hybrid keyring wrapping."""
    from cryptoflow.utils.crypto import generate_rsa_keypair
    priv_pem, pub_pem = generate_rsa_keypair(key_size=bits)
    return {
        "success": True,
        "private_key_pem": priv_pem.decode("utf-8"),
        "public_key_pem": pub_pem.decode("utf-8"),
        "key_size_bits": bits,
    }


@app.post("/api/v1/generate-synthetic")
async def generate_synthetic_data(req: SyntheticRequest) -> dict:
    """Generate realistic synthetic medical records for testing and demo mode."""
    try:
        temp_dir = Path(tempfile.mkdtemp(prefix="cflow_synth_"))
        bundle_files = generate_patient_bundle(
            temp_dir,
            image_size_bytes=req.image_size_kb * 1024,
            patient_index=0,
        )

        image_bytes = read_file(bundle_files["image"])
        report_text = read_file(bundle_files["text"]).decode("utf-8", errors="replace")
        metadata_json = read_file(bundle_files["metadata"]).decode("utf-8", errors="replace")

        shutil.rmtree(temp_dir, ignore_errors=True)

        return {
            "success": True,
            "patient_id": "P-001",
            "image": {
                "filename": bundle_files["image"].name,
                "size_bytes": len(image_bytes),
                "size_formatted": format_size(len(image_bytes)),
                "preview_base64": None,  # Can be rendered in frontend
            },
            "report": {
                "filename": bundle_files["text"].name,
                "content": report_text,
                "size_bytes": len(report_text.encode()),
            },
            "metadata": {
                "filename": bundle_files["metadata"].name,
                "content": json.loads(metadata_json),
                "raw_json": metadata_json,
                "size_bytes": len(metadata_json.encode()),
            },
        }
    except Exception as e:
        logger.error(f"Error generating synthetic data: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/v1/encrypt")
async def encrypt_endpoint(
    image: Optional[UploadFile] = File(None),
    report: Optional[str] = Form(None),
    metadata: Optional[str] = Form(None),
    bundle_name: Optional[str] = Form(None),
    anonymize: Optional[bool] = Form(False),
    operation_id: Optional[str] = Form(None),
) -> dict:
    """Execute the 5-stage encryption pipeline on uploaded medical modalities."""
    op_id = operation_id or str(uuid.uuid4())
    temp_dir = Path(tempfile.mkdtemp(prefix=f"cflow_enc_{op_id[:8]}_"))

    try:
        await broadcast_ws(op_id, {"type": "stage_start", "stage": 1, "name": "Ingest & Normalization"})
        file_paths: Dict[ModalityType, Path] = {}

        # 1. Image Modality
        if image and image.filename:
            img_path = temp_dir / image.filename
            content = await image.read()
            if len(content) == 0:
                content = generate_image(100 * 1024)
            write_file(img_path, content)
            file_paths[ModalityType.IMAGE] = img_path
        else:
            img_path = temp_dir / "ct_chest_scan.dcm"
            write_file(img_path, generate_image(100 * 1024))
            file_paths[ModalityType.IMAGE] = img_path

        # 2. Text Modality
        txt_content = report or (
            "RADIOLOGY REPORT\nStudy: CT Chest with contrast\n"
            "IMPRESSION: Suspicious mass measuring 2.3cm in lower right lobe.\n"
            "RECOMMENDATION: Immediate biopsy required.\nSigned: Dr. Chen, MD"
        )
        txt_path = temp_dir / "radiology_report.txt"
        write_file(txt_path, txt_content.encode("utf-8"))
        file_paths[ModalityType.TEXT] = txt_path

        # 3. Metadata Modality
        meta_content = metadata or json.dumps({
            "patient_id": "P-8842",
            "name": "Alex Rivera" if not anonymize else "ANONYMOUS",
            "dob": "1985-03-12",
            "blood_type": "O+",
            "allergies": ["penicillin"],
            "dosage_mg": 10,
        }, indent=2)
        meta_path = temp_dir / "patient_metadata.json"
        write_file(meta_path, meta_content.encode("utf-8"))
        file_paths[ModalityType.METADATA] = meta_path

        await broadcast_ws(op_id, {
            "type": "stage_complete",
            "stage": 1,
            "modalities": [
                {"type": "image", "filename": img_path.name, "size": img_path.stat().st_size},
                {"type": "text", "filename": txt_path.name, "size": txt_path.stat().st_size},
                {"type": "metadata", "filename": meta_path.name, "size": meta_path.stat().st_size},
            ]
        })

        # Run Core Pipeline
        t0 = time.perf_counter()
        bundle_path, keyring_path, metadata_dict = encrypt_pipeline(file_paths, VAULT_DIR)
        duration = time.perf_counter() - t0

        # Read keyring to extract metadata for visualizer
        keyring_json = json.loads(read_file(keyring_path).decode("utf-8"))
        bundle_id = keyring_json["bundle_id"]

        # Parse manifest from bundle for stage inspection
        bundle_bytes = read_file(bundle_path)
        manifest_len = int.from_bytes(bundle_bytes[24:28], "little")
        manifest_json = json.loads(bundle_bytes[64 : 64 + manifest_len].decode("utf-8"))

        await broadcast_ws(op_id, {
            "type": "pipeline_complete",
            "bundle_id": bundle_id,
            "bundle_size": bundle_path.stat().st_size,
            "binding_hash": manifest_json["binding_hash"],
            "duration_s": duration,
        })

        return {
            "success": True,
            "operation_id": op_id,
            "bundle_id": bundle_id,
            "bundle_filename": bundle_path.name,
            "keyring_filename": keyring_path.name,
            "bundle_download_url": f"/api/v1/download/{bundle_path.name}",
            "keyring_download_url": f"/api/v1/download/{keyring_path.name}",
            "metrics": {
                "total_raw_bytes": sum(p.stat().st_size for p in file_paths.values()),
                "bundle_size_bytes": bundle_path.stat().st_size,
                "overhead_percent": max(0.0, ((bundle_path.stat().st_size / sum(p.stat().st_size for p in file_paths.values())) - 1.0) * 100),
                "duration_seconds": duration,
            },
            "manifest": manifest_json,
            "keys_summary": [
                {
                    "modality": k["modality_type"],
                    "key_hex": k["key"][:8] + "..." + k["key"][-8:],
                    "iv_hex": k["iv"],
                }
                for k in keyring_json["keys"]
            ],
            "binding_hash": manifest_json["binding_hash"],
            "uncertainty": metadata_dict.get("uncertainty") or manifest_json.get("uncertainty_profile"),
        }

    except Exception as e:
        logger.error(f"Encryption error: {e}", exc_info=True)
        await broadcast_ws(op_id, {"type": "pipeline_error", "error": str(e)})
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)


@app.post("/api/v1/decrypt")
async def decrypt_endpoint(
    bundle_file: UploadFile = File(...),
    keyring_file: UploadFile = File(...),
    operation_id: Optional[str] = Form(None),
) -> dict:
    """Decrypt a .cryptoflow bundle and verify cross-modal integrity."""
    op_id = operation_id or str(uuid.uuid4())
    temp_dir = Path(tempfile.mkdtemp(prefix=f"cflow_dec_{op_id[:8]}_"))

    try:
        bundle_path = temp_dir / bundle_file.filename
        keyring_path = temp_dir / keyring_file.filename

        write_file(bundle_path, await bundle_file.read())
        write_file(keyring_path, await keyring_file.read())

        out_dir = RESTORED_DIR / f"restored_{op_id[:8]}"
        ensure_dir(out_dir)

        # Parse manifest from bundle to extract uncertainty profile if present
        bundle_bytes = read_file(bundle_path)
        manifest_len = int.from_bytes(bundle_bytes[24:28], "little")
        manifest_json = json.loads(bundle_bytes[64 : 64 + manifest_len].decode("utf-8"))
        uncertainty_profile = manifest_json.get("uncertainty_profile")

        t0 = time.perf_counter()
        restored_files = decrypt_bundle(bundle_path, keyring_path, out_dir)
        duration = time.perf_counter() - t0

        file_list = []
        for f in restored_files:
            content_sample = None
            if f.suffix in [".txt", ".json"]:
                content_sample = read_file(f).decode("utf-8", errors="replace")
            file_list.append({
                "filename": f.name,
                "size_bytes": f.stat().st_size,
                "size_formatted": format_size(f.stat().st_size),
                "download_url": f"/api/v1/download-restored/{out_dir.name}/{f.name}",
                "content_preview": content_sample,
            })

        return {
            "success": True,
            "verified": True,
            "integrity_status": "PASSED_AUTHENTIC",
            "duration_seconds": duration,
            "files_restored": file_list,
            "uncertainty_profile": uncertainty_profile,
        }

    except (BindingMismatchError, AuthTagMismatchError, KeyMismatchError, InvalidBundleError) as e:
        logger.warning(f"Tamper detected during decryption: {e}")
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "verified": False,
                "integrity_status": "TAMPER_DETECTED",
                "error_type": type(e).__name__,
                "detail": str(e),
            },
        )
    except Exception as e:
        logger.error(f"Unexpected decryption failure: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)


@app.post("/api/v1/attack/simulate")
async def simulate_attack_endpoint(req: AttackRequest) -> dict:
    """Run one of the 7 cyberattack vectors and return forensic scorecard."""
    simulator = AttackSimulator()
    try:
        bundle_a, key_a = simulator.create_sample_bundle(patient_idx=1)
        bundle_b, key_b = simulator.create_sample_bundle(patient_idx=2)

        attack_type = req.attack_type.lower()
        if attack_type == "bit_flip":
            res = simulator.run_bit_flip_attack(bundle_a, key_a)
        elif attack_type == "swap_modalities":
            res = simulator.run_swap_modalities_attack(bundle_a, key_a)
        elif attack_type == "cross_bundle_swap":
            res = simulator.run_cross_bundle_swap_attack(bundle_a, key_a, bundle_b)
        elif attack_type == "truncate_blob":
            res = simulator.run_truncate_blob_attack(bundle_a, key_a)
        elif attack_type == "inject_blob":
            res = simulator.run_inject_blob_attack(bundle_a, key_a)
        elif attack_type == "manifest_tamper":
            res = simulator.run_manifest_tamper_attack(bundle_a, key_a)
        elif attack_type == "key_mismatch":
            res = simulator.run_key_mismatch_attack(bundle_a, key_b)
        else:
            raise HTTPException(status_code=400, detail=f"Unknown attack type: {req.attack_type}")

        if res.success:
            from cryptoflow.utils.stats import record_attack_blocked
            record_attack_blocked()

        return {
            "success": True,
            "attack_type": res.attack_type.value,
            "description": res.description,
            "detected": res.detected,
            "exception_raised": res.exception_raised,
            "expected_exception": res.expected_exception,
            "security_control_passed": res.success,
            "forensic_details": res.details,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        }
    finally:
        simulator.cleanup()


@app.get("/api/v1/metrics")
async def get_metrics() -> dict:
    """Retrieve multi-tier empirical performance benchmark metrics."""
    try:
        csv_path = Path("./results/benchmarks.csv")
        json_path = Path("./results/benchmarks.json")

        if not json_path.exists():
            runner = BenchmarkRunner()
            results = runner.run_suite(iterations=2)
            runner.save_csv(results, csv_path)
            runner.save_json(results, json_path)
            runner.cleanup()

        with open(json_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        return {
            "success": True,
            "benchmarks": data,
            "summary": {
                "max_throughput_enc_mbps": max(b["mean_enc_throughput_mb_s"] for b in data),
                "max_throughput_dec_mbps": max(b["mean_dec_throughput_mb_s"] for b in data),
                "avg_overhead_percent": sum((b["overhead_ratio"] - 1.0) * 100 for b in data) / len(data),
            },
        }
    except Exception as e:
        logger.error(f"Error fetching metrics: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/v1/download/{filename}")
async def download_file(filename: str):
    """Download an encrypted bundle or keyring file."""
    file_path = VAULT_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path, filename=filename, media_type="application/octet-stream")


@app.get("/api/v1/download-restored/{folder}/{filename}")
async def download_restored_file(folder: str, filename: str):
    """Download a restored decrypted clinical file."""
    file_path = RESTORED_DIR / folder / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path, filename=filename, media_type="application/octet-stream")


# ---------------------------------------------------------------------------
# WebSocket Pipeline Channel
# ---------------------------------------------------------------------------

@app.websocket("/ws/pipeline/{operation_id}")
async def websocket_endpoint(websocket: WebSocket, operation_id: str):
    """Live WebSocket event stream for pipeline animation and verification."""
    await websocket.accept()
    if operation_id not in active_websockets:
        active_websockets[operation_id] = []
    active_websockets[operation_id].append(websocket)

    try:
        while True:
            # Echo or receive client control commands
            data = await websocket.receive_text()
            msg = json.loads(data)
            if msg.get("action") == "ping":
                await websocket.send_json({"type": "pong", "time": time.time()})
    except WebSocketDisconnect:
        if operation_id in active_websockets:
            active_websockets[operation_id].remove(websocket)


# ---------------------------------------------------------------------------
# Static Frontend Mounting (when built)
# ---------------------------------------------------------------------------

FRONTEND_DIST = Path("./frontend/dist").resolve()
if FRONTEND_DIST.exists():
    app.mount("/", StaticFiles(directory=str(FRONTEND_DIST), html=True), name="frontend")
