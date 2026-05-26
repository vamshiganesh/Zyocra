"""Paths, pinned EZKL version, and RunArgs defaults for the baseline path."""

from __future__ import annotations

from pathlib import Path

EZKL_VERSION = "23.0.5"

CB_ROOT = Path(__file__).resolve().parents[1]
REPO_ROOT = CB_ROOT.parent
ML_ROOT = REPO_ROOT / "ml-base"

ONNX_SRC = ML_ROOT / "artifacts" / "onnx" / "zyocra-risk-mlp-v1.onnx"
FEATURES_DIR = ML_ROOT / "artifacts" / "features"

# Organized artifact tree under circuits-baseline/
ONNX_DIR = CB_ROOT / "onnx"
SETTINGS_DIR = CB_ROOT / "settings"
KEYS_DIR = CB_ROOT / "keys"
WITNESSES_DIR = CB_ROOT / "witnesses"
PROOFS_DIR = CB_ROOT / "proofs"
VERIFIERS_DIR = CB_ROOT / "verifiers"
LOGS_DIR = CB_ROOT / "logs"

NETWORK_ONNX = ONNX_DIR / "zyocra-risk-mlp-v1.onnx"
SETTINGS_JSON = SETTINGS_DIR / "settings.json"
COMPILED_EZKL = SETTINGS_DIR / "network.ezkl"
SRS_FILE = KEYS_DIR / "kzg.srs"
VK_FILE = KEYS_DIR / "vk.key"
PK_FILE = KEYS_DIR / "pk.key"
SAMPLE_INPUT = SETTINGS_DIR / "sample-input.json"
WITNESS_JSON = WITNESSES_DIR / "witness.json"
PROOF_JSON = PROOFS_DIR / "proof.json"
ORACLE_PAYLOAD_JSON = PROOFS_DIR / "oracle-payload.json"
VERIFIER_SOL = VERIFIERS_DIR / "RiskScoreVerifier.sol"
VERIFIER_ABI = VERIFIERS_DIR / "RiskScoreVerifier.abi"
DEMO_MANIFEST = LOGS_DIR / "demo-latest.json"

# Demo metadata (aligned with frontend epoch-2026-041)
DEMO_EPOCH = 202_604_1
DEMO_BORROWER_HEX = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
MODEL_HASH_HEX = "0x2fe8f38e2a8992e0546762c67f073e737f12419ac3f13004598e08c7d978f627"
ADAPTER_HASH_HEX = "0x5c840159cf800e89cc2fc5ff33164ec8aee75b5a20c7e15cbdc612c31d47993c"

# input_scale 7 => multiply by 2^7 = 128 (matches ml-base activation_scale)
EZKL_INPUT_SCALE = 7
EZKL_PARAM_SCALE = 7
EZKL_LOGROWS = 17
