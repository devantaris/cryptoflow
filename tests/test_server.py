"""Unit tests for FastAPI web server endpoints."""

from __future__ import annotations

import io
import json
import pytest
from fastapi.testclient import TestClient

from cryptoflow.server import app

client = TestClient(app)


def test_health_endpoint() -> None:
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert "CryptoFlow" in data["service"]


def test_synthetic_data_endpoint() -> None:
    response = client.post("/api/v1/generate-synthetic", json={"count": 1, "image_size_kb": 10})
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["image"]["filename"].endswith(".dcm")
    assert "RADIOLOGY REPORT" in data["report"]["content"]
    assert "patient_id" in data["metadata"]["content"]


def test_encrypt_and_decrypt_endpoint() -> None:
    # 1. Encrypt via API
    fake_img = io.BytesIO(b"DICM" + b"\x00" * 1024)
    response = client.post(
        "/api/v1/encrypt",
        files={"image": ("test_scan.dcm", fake_img, "application/dicom")},
        data={
            "report": "IMPRESSION: Normal scan.",
            "metadata": json.dumps({"patient_id": "P-TEST", "name": "Jane Doe"}),
            "anonymize": False,
        },
    )
    assert response.status_code == 200
    enc_data = response.json()
    assert enc_data["success"] is True
    assert "bundle_filename" in enc_data
    assert "keyring_filename" in enc_data

    bundle_fn = enc_data["bundle_filename"]
    keyring_fn = enc_data["keyring_filename"]

    # 2. Download bundle and keyring
    b_resp = client.get(f"/api/v1/download/{bundle_fn}")
    k_resp = client.get(f"/api/v1/download/{keyring_fn}")
    assert b_resp.status_code == 200
    assert k_resp.status_code == 200

    # 3. Decrypt via API
    dec_resp = client.post(
        "/api/v1/decrypt",
        files={
            "bundle_file": (bundle_fn, io.BytesIO(b_resp.content), "application/octet-stream"),
            "keyring_file": (keyring_fn, io.BytesIO(k_resp.content), "application/json"),
        },
    )
    assert dec_resp.status_code == 200
    dec_data = dec_resp.json()
    assert dec_data["verified"] is True
    assert dec_data["integrity_status"] == "PASSED_AUTHENTIC"
    assert len(dec_data["files_restored"]) == 3


def test_bundle_info_and_stats_endpoints() -> None:
    # Bundle info
    resp = client.get("/api/v1/bundle-info")
    assert resp.status_code == 200
    data = resp.json()
    assert "bundles" in data
    assert "total_count" in data

    # Stats endpoint
    s_resp = client.get("/api/v1/stats")
    assert s_resp.status_code == 200
    s_data = s_resp.json()
    assert "stats" in s_data
    assert "total_bundles_encrypted" in s_data["stats"]
    assert "total_attacks_blocked" in s_data["stats"]


def test_simulate_attack_endpoint() -> None:
    response = client.post("/api/v1/attack/simulate", json={"attack_type": "bit_flip"})
    assert response.status_code == 200
    data = response.json()
    assert data["detected"] is True
    assert data["security_control_passed"] is True


def test_metrics_endpoint() -> None:
    response = client.get("/api/v1/metrics")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert len(data["benchmarks"]) > 0


def test_download_not_found() -> None:
    resp = client.get("/api/v1/download/nonexistent_file_999.bin")
    assert resp.status_code == 404
    err = resp.json()
    assert err["error"] is True


def test_root_frontend_endpoint() -> None:
    resp = client.get("/")
    assert resp.status_code == 200
    assert "html" in resp.headers.get("content-type", "").lower()


def test_generate_rsa_keys_endpoint() -> None:
    resp = client.post("/api/v1/keys/generate-rsa?bits=2048")
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert "BEGIN PUBLIC KEY" in data["public_key_pem"]
    assert "BEGIN PRIVATE KEY" in data["private_key_pem"]
