"""Paths and benchmark constants."""

from __future__ import annotations

from pathlib import Path

BENCH_ROOT = Path(__file__).resolve().parents[1]
REPO_ROOT = BENCH_ROOT.parent

ML_ROOT = REPO_ROOT / "ml-base"
EZKL_ROOT = REPO_ROOT / "circuits-baseline"
CIRCOM_ROOT = REPO_ROOT / "circuits-custom"
CONTRACTS_ROOT = REPO_ROOT / "contracts"

RAW_DIR = BENCH_ROOT / "raw-results"
PLOTS_DIR = BENCH_ROOT / "plots"

# EZKL artifacts
EZKL_SETTINGS = EZKL_ROOT / "settings" / "settings.json"
EZKL_COMPILED = EZKL_ROOT / "settings" / "network.ezkl"
EZKL_WITNESS = EZKL_ROOT / "witnesses" / "witness.json"
EZKL_PROOF = EZKL_ROOT / "proofs" / "proof.json"
EZKL_PK = EZKL_ROOT / "keys" / "pk.key"
EZKL_VK = EZKL_ROOT / "keys" / "vk.key"
EZKL_SRS = EZKL_ROOT / "keys" / "kzg.srs"
EZKL_DEMO = EZKL_ROOT / "logs" / "demo-latest.json"
EZKL_VALIDATION = ML_ROOT / "artifacts" / "validation" / "validation-latest.json"

# Circom artifacts
CIRCOM_R1CS = CIRCOM_ROOT / "build" / "lora_output_head.r1cs"
CIRCOM_ZKEY = CIRCOM_ROOT / "keys" / "circuit_final.zkey"
CIRCOM_WITNESS = CIRCOM_ROOT / "witnesses" / "witness.wtns"
CIRCOM_PROOF = CIRCOM_ROOT / "proofs" / "proof.json"
CIRCOM_PUBLIC = CIRCOM_ROOT / "proofs" / "public.json"
CIRCOM_VKEY = CIRCOM_ROOT / "keys" / "verification_key.json"
CIRCOM_FIXTURE = CIRCOM_ROOT / "fixtures" / "head-v1.json"
CIRCOM_DEMO = CIRCOM_ROOT / "logs" / "demo-latest.json"
CIRCOM_VERIFIER = CIRCOM_ROOT / "verifiers" / "LoraHeadVerifier.sol"

PYTHON = ML_ROOT / ".venv" / "bin" / "python"

# Benchmark protocol
SCHEMA_VERSION = "1.0"
PROVE_RUNS = 3
SAMPLE_INDEX = 0
EPOCH_LABEL = "epoch-2026-041"

LATEST_JSON = RAW_DIR / "bench-latest.json"
LATEST_CSV = RAW_DIR / "bench-latest.csv"
LATEST_MD = RAW_DIR / "bench-latest.md"
GAS_INPUT_JSON = RAW_DIR / "gas-input.json"
