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
SCHEMA_VERSION = "1.1"
PROVE_RUNS = 3
SAMPLE_INDEX = 0
SAMPLE_INDICES = [0, 1, 2, 3]
EPOCH_LABEL = "epoch-2026-041"

# Workload op counts for normalized metrics
EZKL_FULL_MATMUL_COUNT = 3
CIRCOM_HEAD_LORA_RANK = 4
CIRCOM_HEAD_HIDDEN_DIM = 8

# EZKL head-only subgraph (comparable to Circom head)
EZKL_HEAD_ROOT = EZKL_ROOT / "head"
EZKL_HEAD_ONNX = EZKL_HEAD_ROOT / "onnx" / "zyocra-head-v1.onnx"
EZKL_HEAD_SETTINGS = EZKL_HEAD_ROOT / "settings" / "settings.json"
EZKL_HEAD_COMPILED = EZKL_HEAD_ROOT / "settings" / "network.ezkl"
EZKL_HEAD_WITNESS = EZKL_HEAD_ROOT / "witnesses" / "witness.json"
EZKL_HEAD_PROOF = EZKL_HEAD_ROOT / "proofs" / "proof.json"
EZKL_HEAD_PK = EZKL_HEAD_ROOT / "keys" / "pk.key"
EZKL_HEAD_VK = EZKL_HEAD_ROOT / "keys" / "vk.key"
# Same logrows (17) as full graph — prepare_head.py uses circuits-baseline/keys/kzg.srs
EZKL_HEAD_SRS = EZKL_SRS

LATEST_JSON = RAW_DIR / "bench-latest.json"
FE_PUBLIC_BENCH = REPO_ROOT / "frontend" / "public" / "data" / "bench-latest.json"
LATEST_CSV = RAW_DIR / "bench-latest.csv"
LATEST_MD = RAW_DIR / "bench-latest.md"
GAS_INPUT_JSON = RAW_DIR / "gas-input.json"
