"""Normalized benchmark result schema and limitations."""

from __future__ import annotations

from typing import Any

from zyocra_bench.config import EPOCH_LABEL, PROVE_RUNS, SAMPLE_INDEX, SCHEMA_VERSION

LIMITATIONS = [
    "EZKL proves the full quantized ONNX graph; Circom proves only the LoRA output-head subgraph — constraint and prove-time comparisons are not end-to-end equivalent workloads.",
    "EZKL constraint metric uses settings.json num_rows (PLONK rows); Circom uses snarkjs R1CS constraint count — different proof systems (Halo2/KZG vs Groth16).",
    "Off-chain verify time for EZKL uses ezkl.verify(); Circom uses snarkjs groth16 verify — not EVM gas.",
    "Peak RSS requires /usr/bin/time on Linux; macOS/Windows runs may omit RAM metrics.",
    "Gas figures measure standalone verifier contracts on Foundry, excluding RiskOracle.submitScore overhead.",
    "Accuracy: full-model quantization error applies to EZKL; Circom head accuracy is integer recompute on a single fixture vector.",
    f"Prove times are medians of {PROVE_RUNS} runs on one machine; no statistical confidence intervals.",
    "Local pot12 ceremony for Circom is not production-grade trusted setup.",
]


METHODOLOGY = {
    "sample_index": SAMPLE_INDEX,
    "epoch_label": EPOCH_LABEL,
    "prove_runs": PROVE_RUNS,
    "prove_aggregation": "median wall time",
    "ram_measurement": "/usr/bin/time -v Maximum resident set size (Linux)",
    "gas_measurement": "Foundry gasleft() delta in BenchmarkGasTest",
    "public_input_policy": "EZKL: public inputs/outputs per settings; Circom: hidden[8] public, weights private",
    "quantization": "Q8.8 — activation_scale=128, weight_scale=256 (ml-base)",
}


def build_metric_rows(
    ezkl: dict[str, Any] | None,
    circom: dict[str, Any] | None,
    gas: dict[str, Any],
    accuracy: dict[str, Any],
) -> list[dict[str, Any]]:
    """Flat metric table for CSV / docs."""

    def cell(path: dict[str, Any] | None, key: str):
        return path.get(key) if path else None

    ezkl_acc = accuracy.get("ezkl_full_model") or {}
    rows = [
        {
            "metric": "constraint_count",
            "unit": "count",
            "ezkl": cell(ezkl, "constraint_count"),
            "circom": cell(circom, "constraint_count"),
            "notes": "EZKL: settings num_rows; Circom: R1CS total",
        },
        {
            "metric": "prove_time_ms",
            "unit": "ms",
            "ezkl": cell(ezkl, "prove_ms_median"),
            "circom": cell(circom, "prove_ms_median"),
            "notes": f"median of {PROVE_RUNS} runs",
        },
        {
            "metric": "verify_time_ms",
            "unit": "ms",
            "ezkl": cell(ezkl, "verify_ms"),
            "circom": cell(circom, "verify_ms"),
            "notes": "off-chain verifier",
        },
        {
            "metric": "proof_size_bytes",
            "unit": "bytes",
            "ezkl": cell(ezkl, "proof_size_bytes"),
            "circom": cell(circom, "proof_size_bytes"),
            "notes": "serialized proof file size",
        },
        {
            "metric": "peak_rss_kb",
            "unit": "KB",
            "ezkl": cell(ezkl, "peak_rss_kb"),
            "circom": cell(circom, "peak_rss_kb"),
            "notes": "prove step peak RSS (Linux time -v)",
        },
        {
            "metric": "verify_gas",
            "unit": "gas",
            "ezkl": gas.get("ezkl_verify_gas"),
            "circom": gas.get("circom_verify_gas"),
            "notes": "EVM verifier only (Foundry)",
        },
        {
            "metric": "accuracy_max_abs_error",
            "unit": "score",
            "ezkl": ezkl_acc.get("max_abs_error"),
            "circom": None,
            "notes": "EZKL: full model test split; Circom: see accuracy.circom_head_subgraph",
        },
    ]
    return rows


def assemble_report(
    environment: dict[str, Any],
    ezkl: dict[str, Any] | None,
    circom: dict[str, Any] | None,
    gas: dict[str, Any],
    accuracy: dict[str, Any],
    errors: list[str],
) -> dict[str, Any]:
    return {
        "schema_version": SCHEMA_VERSION,
        "kind": "zyocra_benchmark",
        "timestamp_utc": environment.get("timestamp_utc"),
        "methodology": METHODOLOGY,
        "environment": environment,
        "workloads": {
            "ezkl": ezkl,
            "circom": circom,
        },
        "gas": gas,
        "accuracy": accuracy,
        "metrics": build_metric_rows(ezkl, circom, gas, accuracy),
        "limitations": LIMITATIONS,
        "errors": errors,
    }
