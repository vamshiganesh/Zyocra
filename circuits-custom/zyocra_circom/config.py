"""Zyocra custom Circom path — paths and constants."""

from __future__ import annotations

from pathlib import Path

CC_ROOT = Path(__file__).resolve().parents[1]
REPO_ROOT = CC_ROOT.parent
ML_ROOT = REPO_ROOT / "ml-base"

CIRCOM_DIR = CC_ROOT / "circom"
BUILD_DIR = CC_ROOT / "build"
KEYS_DIR = CC_ROOT / "keys"
INPUTS_DIR = CC_ROOT / "inputs"
WITNESSES_DIR = CC_ROOT / "witnesses"
PROOFS_DIR = CC_ROOT / "proofs"
VERIFIERS_DIR = CC_ROOT / "verifiers"
LOGS_DIR = CC_ROOT / "logs"
FIXTURES_DIR = CC_ROOT / "fixtures"

CIRCUIT_NAME = "lora_output_head"
R1CS = BUILD_DIR / f"{CIRCUIT_NAME}.r1cs"
WASM_DIR = BUILD_DIR / f"{CIRCUIT_NAME}_js"
WASM = WASM_DIR / f"{CIRCUIT_NAME}.wasm"
WITNESS_CALC = WASM_DIR / "generate_witness.js"
WITNESS_WTNS = WITNESSES_DIR / "witness.wtns"
INPUT_JSON = INPUTS_DIR / "input.json"
PUBLIC_JSON = INPUTS_DIR / "public.json"
PROOF_JSON = PROOFS_DIR / "proof.json"
PUBLIC_SIGNALS_JSON = PROOFS_DIR / "public.json"
VKEY_JSON = KEYS_DIR / "verification_key.json"
ZKEY_FINAL = KEYS_DIR / "circuit_final.zkey"
PTAU_FINAL = KEYS_DIR / "pot14_final.ptau"
VERIFIER_SOL = VERIFIERS_DIR / "LoraHeadVerifier.sol"

# Aligned with ml-base/zyocra_ml/config.py
HIDDEN_DIM = 8
LORA_RANK = 4
ACTIVATION_SCALE = 128
WEIGHT_SCALE = 256
ACCUMULATOR_BITS = 32

CHECKPOINT = ML_ROOT / "artifacts" / "models" / "checkpoint.pt"
FEATURES_TEST = ML_ROOT / "artifacts" / "features" / "test.npz"
FIXTURE_V1 = FIXTURES_DIR / "head-v1.json"
DEMO_MANIFEST = LOGS_DIR / "demo-latest.json"
