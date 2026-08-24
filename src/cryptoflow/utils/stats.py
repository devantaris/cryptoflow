import json
from pathlib import Path

STATS_FILE = Path("./results/usage_stats.json")

def _init_stats():
    if not STATS_FILE.parent.exists():
        STATS_FILE.parent.mkdir(parents=True, exist_ok=True)
    if not STATS_FILE.exists():
        with open(STATS_FILE, "w", encoding="utf-8") as f:
            json.dump({
                "total_bundles_encrypted": 0,
                "total_bytes_encrypted": 0,
                "total_attacks_blocked": 0
            }, f)

def record_encryption(bundle_size_bytes: int) -> None:
    _init_stats()
    with open(STATS_FILE, "r+", encoding="utf-8") as f:
        data = json.load(f)
        data["total_bundles_encrypted"] += 1
        data["total_bytes_encrypted"] += bundle_size_bytes
        f.seek(0)
        f.truncate()
        json.dump(data, f)

def record_attack_blocked() -> None:
    _init_stats()
    with open(STATS_FILE, "r+", encoding="utf-8") as f:
        data = json.load(f)
        data["total_attacks_blocked"] += 1
        f.seek(0)
        f.truncate()
        json.dump(data, f)

def get_stats() -> dict:
    _init_stats()
    with open(STATS_FILE, "r", encoding="utf-8") as f:
        return json.load(f)
