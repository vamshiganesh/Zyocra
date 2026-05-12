"""Normalized benchmark result schema and limitations."""

from __future__ import annotations

from typing import Any

from zyocra_bench.config import EPOCH_LABEL, PROVE_RUNS, SAMPLE_INDICES, SAMPLE_INDEX, SCHEMA_VERSION

LIMITATIONS = [
    "EZKL full graph proves 6→16→8→1 + sigmoid; Circom proves only the LoRA output-head subgraph — full-graph constraint and prove-time rows are not end-to-end equivalent.",
    "EZKL head-only row (when present) is comparable to Circom on the same hidden→logit statement; full-graph EZKL remains a separate workload.",
    "EZKL constraint metric uses settings.json num_rows (PLONK rows); Circom uses snarkjs R1CS constraint count — different proof systems (Halo2/KZG vs Groth16).",
    "Off-chain verify time for EZKL uses ezkl.verify(); Circom uses snarkjs groth16 verify — not EVM gas.",
    "Peak RSS requires /usr/bin/time on Linux; macOS/Windows runs may omit RAM metrics.",
    "Gas figures measure standalone verifier contracts on Foundry, excluding RiskOracle.submitScore overhead.",
    "Accuracy: full-model quantization error applies to EZKL; head_alignment compares ml-base vs Circom on one hidden vector.",
    f"Prove times are medians of {PROVE_RUNS} runs with stdev reported; sample_indices={SAMPLE_INDICES}.",
    "Local pot12 ceremony for Circom is not production-grade trusted setup.",
]


METHODOLOGY = {
    "sample_index": SAMPLE_INDEX,
    "sample_indices": SAMPLE_INDICES,
    "epoch_label": EPOCH_LABEL,
    "prove_runs": PROVE_RUNS,
    "prove_aggregation": "median wall time (+ min, max, stdev)",
    "ram_measurement": "/usr/bin/time -v Maximum resident set size (Linux)",
    "gas_measurement": "Foundry gasleft() delta in BenchmarkGasTest",
    "public_input_policy": "EZKL: 6 features + 1 score; Circom: hidden[8] + logit_acc",
    "quantization": "Q8.8 — activation_scale=128, weight_scale=256 (ml-base)",
    "hybrid_model": "one EZKL full prove per epoch + Circom head prove per update (see workloads.hybrid)",
}


def _normalized(path: dict[str, Any] | None, key: str, divisor_key: str) -> float | None:
    if not path:
        return None
    value = path.get(key)
    divisor = path.get(divisor_key)
    if value is None or not divisor:
        return None
    return round(float(value) / float(divisor), 2)


def build_metric_rows(
    ezkl: dict[str, Any] | None,
    circom: dict[str, Any] | None,
    gas: dict[str, Any],
    accuracy: dict[str, Any],
    ezkl_head: dict[str, Any] | None = None,
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
            "ezkl_head": cell(ezkl_head, "constraint_count"),
            "circom": cell(circom, "constraint_count"),
            "notes": "EZKL: settings num_rows; Circom: R1CS total",
        },
        {
            "metric": "prove_time_ms",
            "unit": "ms",
            "ezkl": cell(ezkl, "prove_ms_median"),
            "ezkl_head": cell(ezkl_head, "prove_ms_median"),
            "circom": cell(circom, "prove_ms_median"),
            "notes": f"median of {PROVE_RUNS} runs",
        },
        {
            "metric": "prove_time_stdev_ms",
            "unit": "ms",
            "ezkl": cell(ezkl, "prove_ms_stdev"),
            "ezkl_head": cell(ezkl_head, "prove_ms_stdev"),
            "circom": cell(circom, "prove_ms_stdev"),
            "notes": "sample stdev across prove runs",
        },
        {
            "metric": "verify_time_ms",
            "unit": "ms",
            "ezkl": cell(ezkl, "verify_ms"),
            "ezkl_head": cell(ezkl_head, "verify_ms"),
            "circom": cell(circom, "verify_ms"),
            "notes": "off-chain verifier",
        },
        {
            "metric": "proof_size_bytes",
            "unit": "bytes",
            "ezkl": cell(ezkl, "proof_size_bytes"),
            "ezkl_head": cell(ezkl_head, "proof_size_bytes"),
            "circom": cell(circom, "proof_size_bytes"),
            "notes": "serialized proof file size",
        },
        {
            "metric": "peak_rss_kb",
            "unit": "KB",
            "ezkl": cell(ezkl, "peak_rss_kb"),
            "ezkl_head": cell(ezkl_head, "peak_rss_kb"),
            "circom": cell(circom, "peak_rss_kb"),
            "notes": "prove step peak RSS (Linux time -v)",
        },
        {
            "metric": "verify_gas",
            "unit": "gas",
            "ezkl": gas.get("ezkl_verify_gas"),
            "ezkl_head": None,
            "circom": gas.get("circom_verify_gas"),
            "notes": "EVM verifier only (Foundry)",
        },
        {
            "metric": "constraints_per_matmul",
            "unit": "count",
            "ezkl": _normalized(ezkl, "constraint_count", "matmul_count"),
            "ezkl_head": _normalized(ezkl_head, "constraint_count", "matmul_count"),
            "circom": _normalized(circom, "constraint_count", "matmul_count"),
            "notes": "constraint_count / matmul_count",
        },
        {
            "metric": "constraints_per_lora_rank_op",
            "unit": "count",
            "ezkl": None,
            "ezkl_head": None,
            "circom": (
                round(float(circom["constraint_count"]) / float(circom["lora_rank_ops"]), 2)
                if circom and circom.get("constraint_count") and circom.get("lora_rank_ops")
                else None
            ),
            "notes": "Circom head only: constraints / rank",
        },
        {
            "metric": "verify_gas_per_public_input",
            "unit": "gas",
            "ezkl": (
                round(float(gas["ezkl_verify_gas"]) / float(ezkl["public_input_count"]))
                if gas.get("ezkl_verify_gas") and ezkl and ezkl.get("public_input_count")
                else None
            ),
            "ezkl_head": None,
            "circom": (
                round(float(gas["circom_verify_gas"]) / float(circom["public_input_count"]))
                if gas.get("circom_verify_gas") and circom and circom.get("public_input_count")
                else None
            ),
            "notes": "standalone verify gas / public signals",
        },
        {
            "metric": "accuracy_max_abs_error",
            "unit": "score",
            "ezkl": ezkl_acc.get("max_abs_error"),
            "ezkl_head": None,
            "circom": None,
            "notes": "EZKL full model test split; see head_alignment for comparable head check",
        },
        {
            "metric": "engineering_complexity",
            "unit": "notes",
            "ezkl": "ONNX export + EZKL compile/setup; large pk (~600MB)",
            "ezkl_head": "Head ONNX + EZKL compile; comparable scope to Circom",
            "circom": "Hand gates + snarkjs; local pot12; subgraph only",
            "notes": "qualitative — not a numeric score",
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
    *,
    ezkl_head: dict[str, Any] | None = None,
    hybrid: dict[str, Any] | None = None,
) -> dict[str, Any]:
    return {
        "schema_version": SCHEMA_VERSION,
        "kind": "zyocra_benchmark",
        "timestamp_utc": environment.get("timestamp_utc"),
        "methodology": METHODOLOGY,
        "environment": environment,
        "workloads": {
            "ezkl": ezkl,
            "ezkl_head": ezkl_head,
            "circom": circom,
            "hybrid": hybrid,
        },
        "gas": gas,
        "accuracy": accuracy,
        "metrics": build_metric_rows(ezkl, circom, gas, accuracy, ezkl_head),
        "limitations": LIMITATIONS,
        "errors": errors,
    }
