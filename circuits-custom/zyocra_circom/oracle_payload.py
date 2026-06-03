"""Build Circom oracle submission payload from Groth16 artifacts."""

from __future__ import annotations

import json
import math
from pathlib import Path
from typing import Any

from zyocra_circom.config import (
    ACTIVATION_SCALE,
    DEMO_MANIFEST,
    PROOF_JSON,
    PUBLIC_SIGNALS_JSON,
    WEIGHT_SCALE,
)

DEMO_EPOCH = 202_604_1
DEMO_BORROWER_HEX = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
MODEL_HASH_HEX = "0x" + ("zyocra-circom-head-model-v1".encode().hex().ljust(64, "0"))[:64]
# keccak256 labels are computed in Solidity; use the same labels for JSON metadata only.
MODEL_HASH_HEX = "0xcircom_model_placeholder"
ADAPTER_HASH_HEX = "0xcircom_adapter_placeholder"
ORACLE_PAYLOAD_JSON = PROOF_JSON.parent / "oracle-payload.json"

# Match DemoCommitments.sol (keccak256 labels)
MODEL_HASH_HEX = "0x" + __import__("hashlib").sha3_256(b"zyocra-circom-head-model-v1".replace(b"sha3", b"")).hexdigest()
# Python doesn't have keccak built-in without eth_hash; compute via inline
try:
    from Crypto.Hash import keccak as _keccak  # type: ignore

    def _keccak256(text: str) -> str:
        k = _keccak.new(digest_bits=256)
        k.update(text.encode())
        return "0x" + k.hexdigest()
except ImportError:
    _keccak256 = None


def keccak256_hex(label: str) -> str:
    if _keccak256 is not None:
        return _keccak256(label)
    # Foundry / forge compatible preimages for tests when pycryptodome absent
    import subprocess

    out = subprocess.check_output(
        ["cast", "keccak", label],
        text=True,
    ).strip()
    return out if out.startswith("0x") else f"0x{out}"


CIRCOM_MODEL_HASH_HEX = keccak256_hex("zyocra-circom-head-model-v1")
CIRCOM_ADAPTER_HASH_HEX = keccak256_hex("zyocra-circom-head-adapter-v1")


def load_public_signals(public_path: Path = PUBLIC_SIGNALS_JSON) -> list[int]:
    data = json.loads(public_path.read_text(encoding="utf-8"))
    return [int(x) for x in data]


def score_bps_from_logit_acc(logit_acc: int, bias: float = 0.0) -> int:
    logit = logit_acc / float(ACTIVATION_SCALE * WEIGHT_SCALE) + bias
    if logit >= 20:
        score = 1.0
    elif logit <= -20:
        score = 0.0
    else:
        score = 1.0 / (1.0 + math.exp(-logit))
    return int(round(max(0.0, min(1.0, score)) * 10_000))


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
    logit_acc = public_inputs[-1]
    public_inputs.append(borrower_uint256(borrower_hex))
    score_bps = score_bps_from_logit_acc(logit_acc, bias=bias)

    proof_bytes = json.loads(proof_path.read_text(encoding="utf-8"))
    proof_encoding = "abi.encode(pA,pB,pC)"

    return {
        "epoch": epoch,
        "modelHash": model_hash_hex,
        "adapterHash": adapter_hash_hex,
        "borrower": borrower_hex,
        "scoreBps": score_bps,
        "logitAcc": logit_acc,
        "bias": bias,
        "proofEncoding": proof_encoding,
        "publicInputs": public_inputs,
        "publicInputCount": len(public_inputs),
        "proofPath": str(proof_path),
        "publicPath": str(public_path),
        "notes": {
            "verifier": "CircomRiskScoreVerifier + LoraHeadVerifier (e2e_circom.sh)",
            "public_layout": "hidden[8] + logit_acc + borrower binding limb",
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
