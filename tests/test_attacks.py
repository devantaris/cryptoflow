"""Test suite verifying all 7 attack simulation security controls."""

from __future__ import annotations

from pathlib import Path
import pytest

from cryptoflow.attacks.simulator import AttackSimulator, AttackType


def test_all_7_attacks_detected(tmp_path: Path) -> None:
    simulator = AttackSimulator(working_dir=tmp_path / "attacks")
    try:
        results = simulator.run_all_attacks()
        assert len(results) == 7

        for r in results:
            assert r.detected is True, f"Attack '{r.attack_type.value}' failed detection!"
            assert r.success is True
            assert r.exception_raised is not None
    finally:
        simulator.cleanup()
