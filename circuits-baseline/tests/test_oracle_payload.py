"""Tests for EZKL oracle payload helpers."""

from __future__ import annotations

import json
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from zyocra_ezkl.oracle_payload import (  # noqa: E402
    _parse_field_element,
    load_public_inputs_uint256,
    score_bps_from_float,
)


def test_parse_field_element_hex_without_prefix() -> None:
    raw = "0c00000000000000000000000000000000000000000000000000000000000000"
    assert _parse_field_element(raw) == int(raw, 16)


def test_score_bps_from_float() -> None:
    assert score_bps_from_float(0.1796875) == 1797


def test_load_public_inputs_from_proof(tmp_path: Path) -> None:
    proof = tmp_path / "proof.json"
    proof.write_text(
        json.dumps({"instances": [["2200000000000000000000000000000000000000000000000000000000000000"]]})
    )
    values = load_public_inputs_uint256(proof)
    assert len(values) == 1
    assert values[0] > 0
