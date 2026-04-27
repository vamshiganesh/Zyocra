"""Map EZKL proof artifacts to RiskOracle submission interface (Phase 2 wiring)."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from zyocra_ezkl.config import (
    ADAPTER_HASH_HEX,
    DEMO_EPOCH,
    MODEL_HASH_HEX,
    ORACLE_PAYLOAD_JSON,
    PROOF_JSON,
    WITNESS_JSON,
)


def score_bps_from_float(score: float) -> int:
    """Convert [0,1] risk score to basis points for RiskOracle (10_000 = 1.00)."""
    bps = int(round(max(0.0, min(1.0, score)) * 10_000))
    return bps


def load_proof_bytes(proof_path: Path = PROOF_JSON) -> bytes:
    data = json.loads(proof_path.read_text(encoding="utf-8"))
    if "hex_proof" in data and data["hex_proof"]:
        hex_proof = data["hex_proof"]
        if hex_proof.startswith("0x"):
            hex_proof = hex_proof[2:]
        return bytes.fromhex(hex_proof)
    if "proof" in data:
        return bytes(data["proof"])
    raise ValueError(f"no proof bytes in {proof_path}")


def _parse_field_element(value: str | int) -> int:
    if isinstance(value, int):
        return value
    text = value.strip()
    if text.startswith("0x"):
        return int(text, 16)
    # EZKL 23.0.5 instances are hex strings without 0x prefix
    if all(c in "0123456789abcdefABCDEF" for c in text):
        return int(text, 16)
    return int(text)


def load_public_inputs_uint256(proof_path: Path = PROOF_JSON) -> list[int]:
    """
    Public instances for Solidity verifier / oracle.

    EZKL packs all public inputs + outputs in field elements (7 for this model:
    6 features + 1 risk score).
    """
    data = json.loads(proof_path.read_text(encoding="utf-8"))
    instances = data.get("instances")
    if not instances or not instances[0]:
        raise ValueError(f"no instances in {proof_path}")
    return [_parse_field_element(x) for x in instances[0]]


def build_oracle_payload(
    *,
    epoch: int = DEMO_EPOCH,
    model_hash_hex: str = MODEL_HASH_HEX,
    adapter_hash_hex: str = ADAPTER_HASH_HEX,
    score_float: float,
    proof_path: Path = PROOF_JSON,
    witness_path: Path = WITNESS_JSON,
) -> dict[str, Any]:
    """RiskOracle.ScoreUpdatePayload-compatible dict for later Foundry integration."""
    public_inputs = load_public_inputs_uint256(proof_path)
    proof_bytes = load_proof_bytes(proof_path)
    score_bps = score_bps_from_float(score_float)

    return {
        "epoch": epoch,
        "modelHash": model_hash_hex,
        "adapterHash": adapter_hash_hex,
        "scoreBps": score_bps,
        "scoreFloat": score_float,
        "proofHex": "0x" + proof_bytes.hex(),
        "proofLengthBytes": len(proof_bytes),
        "publicInputs": [str(x) for x in public_inputs],
        "publicInputCount": len(public_inputs),
        "witnessPath": str(witness_path),
        "proofPath": str(proof_path),
        "notes": {
            "verifier": "Deploy verifiers/RiskScoreVerifier.sol or EZKL-generated Halo2Verifier",
            "stub_phase": "RiskOracle still uses StubRiskScoreVerifier until verifier is wired",
            "public_layout": "6 input features (public) + 1 output score (public)",
        },
    }


def write_oracle_payload(path: Path = ORACLE_PAYLOAD_JSON, **kwargs: Any) -> Path:
    payload = build_oracle_payload(**kwargs)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    return path
