"""Build Circom oracle submission payload from Groth16 artifacts."""

from __future__ import annotations

import json
import subprocess
from pathlib import Path
from typing import Any

from zyocra_circom.config import (
    ACTIVATION_SCALE,
    PROOF_JSON,
    PUBLIC_SIGNALS_JSON,
    WEIGHT_SCALE,
)

DEMO_EPOCH = 202_604_1
DEMO_BORROWER_HEX = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
ORACLE_PAYLOAD_JSON = PROOF_JSON.parent / "oracle-payload.json"
SNARK_SCALAR_FIELD = 21888242871839275222246405745257275088548364400416034343698204186575808495617
LOGIT_DENOMINATOR = ACTIVATION_SCALE * WEIGHT_SCALE


def keccak256_hex(label: str) -> str:
    out = subprocess.check_output(["cast", "keccak", label], text=True).strip()
    return out if out.startswith("0x") else f"0x{out}"


CIRCOM_MODEL_HASH_HEX = keccak256_hex("zyocra-circom-head-model-v1")
CIRCOM_ADAPTER_HASH_HEX = keccak256_hex("zyocra-circom-head-adapter-v1")


def load_public_signals(public_path: Path = PUBLIC_SIGNALS_JSON) -> list[int]:
    data = json.loads(public_path.read_text(encoding="utf-8"))
    return [int(x) for x in data]


def signed_logit_acc(logit_acc: int) -> int:
    """Decode Circom field element to signed integer (matches CircomScoreEncoding)."""
    if logit_acc > SNARK_SCALAR_FIELD // 2:
        return -(SNARK_SCALAR_FIELD - logit_acc)
    return logit_acc


def score_bps_from_logit_acc(logit_acc: int, bias: float = 0.0) -> int:
    """Cubic Taylor σ(x)≈1/2+x/4−x³/48 on |x|≤5 — must match CircomScoreEncoding.sol."""
    x = signed_logit_acc(logit_acc) / float(LOGIT_DENOMINATOR) + bias
    if x >= 5:
        return 10_000
    if x <= -5:
        return 0
    sigmoid = 0.5 + x / 4.0 - (x**3) / 48.0
    return int(round(max(0.0, min(1.0, sigmoid)) * 10_000))


def borrower_uint256(borrower_hex: str = DEMO_BORROWER_HEX) -> int:
    text = borrower_hex.strip().lower()
    if text.startswith("0x"):
        text = text[2:]
    return int(text, 16)


def build_oracle_payload(
    *,
    epoch: int = DEMO_EPOCH,
    model_hash_hex: str = CIRCOM_MODEL_HASH_HEX,
    adapter_hash_hex: str = CIRCOM_ADAPTER_HASH_HEX,
    borrower_hex: str = DEMO_BORROWER_HEX,
    public_path: Path = PUBLIC_SIGNALS_JSON,
    proof_path: Path = PROOF_JSON,
    bias: float = 0.0,
) -> dict[str, Any]:
    public_inputs = load_public_signals(public_path)
    if len(public_inputs) != 10:
        raise ValueError(f"expected 10 in-circuit public signals, got {len(public_inputs)}")

    # Layout (snarkjs): logit_acc, hidden[8], borrower
    logit_acc = public_inputs[0]
    proved_borrower = public_inputs[9]
    expected = borrower_uint256(borrower_hex)
    if proved_borrower != expected:
        raise ValueError(
            f"public.json borrower {proved_borrower} != requested {expected} — regenerate proof"
        )

    score_bps = score_bps_from_logit_acc(logit_acc, bias=bias)

    return {
        "epoch": epoch,
        "modelHash": model_hash_hex,
        "adapterHash": adapter_hash_hex,
        "borrower": borrower_hex,
        "scoreBps": score_bps,
        "logitAcc": logit_acc,
        "bias": bias,
        "publicInputs": public_inputs,
        "publicInputCount": len(public_inputs),
        "proofPath": str(proof_path),
        "publicPath": str(public_path),
        "notes": {
            "verifier": "CircomRiskScoreVerifier + LoraHeadVerifier (e2e_circom.sh)",
            "public_layout": "logit_acc + hidden[8] + borrower (in-circuit; snarkjs order)",
            "sigmoid": "cubic Taylor 1/2 + x/4 - x^3/48 on |x|<=5 (matches CircomScoreEncoding.sol)",
        },
    }


def write_oracle_payload(path: Path = ORACLE_PAYLOAD_JSON, **kwargs: Any) -> Path:
    payload = build_oracle_payload(**kwargs)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    return path


if __name__ == "__main__":
    write_oracle_payload()
    print(f"wrote {ORACLE_PAYLOAD_JSON}")
