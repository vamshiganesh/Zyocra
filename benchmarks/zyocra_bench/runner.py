"""Benchmark orchestrator."""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

BENCH_ROOT = Path(__file__).resolve().parents[1]
if str(BENCH_ROOT) not in sys.path:
    sys.path.insert(0, str(BENCH_ROOT))

from zyocra_bench.accuracy import collect_accuracy
from zyocra_bench.circom_bench import collect_circom
from zyocra_bench.config import RAW_DIR, SAMPLE_INDICES
from zyocra_bench.env import capture_environment, write_env_snapshot
from zyocra_bench.ezkl_bench import collect_ezkl
from zyocra_bench.ezkl_head_bench import collect_ezkl_head
from zyocra_bench.gas_bench import collect_gas
from zyocra_bench.hybrid_bench import collect_hybrid
from zyocra_bench.report import publish_report
from zyocra_bench.schema import assemble_report


def _write_env_txt(environment: dict[str, Any]) -> Path:
    path = RAW_DIR / "env-latest.txt"
    lines = [
        f"timestamp_utc: {environment.get('timestamp_utc')}",
        f"platform: {environment.get('platform')}",
        f"hostname: {environment.get('hostname')}",
        f"cpu_count: {environment.get('cpu_count')}",
        f"mem_total_kb: {environment.get('mem_total_kb')}",
    ]
    tools = environment.get("tools") or {}
    for key in ("forge", "circom", "node", "python"):
        lines.append(f"{key}: {tools.get(key)}")
    pkgs = environment.get("python_packages") or {}
    lines.append(f"ezkl: {pkgs.get('ezkl')}")
    lines.append(f"torch: {pkgs.get('torch')}")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return path


def run_benchmark(
    *,
    refresh_prove: bool = False,
    skip_gas: bool = False,
    skip_ezkl_head: bool = False,
    sample_indices: list[int] | None = None,
) -> dict:
    errors: list[str] = []
    environment = capture_environment()
    if sample_indices:
        environment["sample_indices"] = sample_indices

    ezkl = circom = ezkl_head = None
    try:
        ezkl = collect_ezkl(refresh_prove=refresh_prove)
    except Exception as exc:  # noqa: BLE001 — collect partial bench
        errors.append(f"ezkl: {exc}")

    try:
        circom = collect_circom(refresh_prove=refresh_prove)
    except Exception as exc:
        errors.append(f"circom: {exc}")

    if not skip_ezkl_head:
        try:
            ezkl_head = collect_ezkl_head(refresh_prove=refresh_prove)
        except Exception as exc:
            errors.append(f"ezkl_head: {exc}")

    accuracy = collect_accuracy()

    gas: dict = {"ezkl_verify_gas": None, "circom_verify_gas": None}
    if not skip_gas:
        try:
            gas = collect_gas()
        except Exception as exc:
            errors.append(f"gas: {exc}")

    hybrid = collect_hybrid(ezkl=ezkl, circom=circom)

    report = assemble_report(
        environment, ezkl, circom, gas, accuracy, errors, ezkl_head=ezkl_head, hybrid=hybrid
    )
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    paths = publish_report(report, stamp)
    write_env_snapshot(RAW_DIR / f"env-{stamp}.json")
    _write_env_txt(environment)

    print(f"==> benchmark json: {paths['json']}")
    print(f"==> benchmark csv:  {paths['csv']}")
    print(f"==> summary md:     {paths['md']}")
    print(f"==> env pin:        {RAW_DIR / 'env-latest.txt'}")
    if paths.get("charts"):
        print(f"==> charts:         {paths['charts']}")
    if errors:
        print("!!  partial run — errors:")
        for err in errors:
            print(f"    {err}")
    return report


def main() -> None:
    parser = argparse.ArgumentParser(description="Zyocra EZKL vs Circom benchmark harness")
    parser.add_argument("--refresh-prove", action="store_true", help="Regenerate proofs before timing")
    parser.add_argument("--skip-gas", action="store_true", help="Skip Foundry gas probes")
    parser.add_argument("--skip-ezkl-head", action="store_true", help="Skip EZKL head-only comparable row")
    parser.add_argument(
        "--sample-indices",
        type=str,
        default=",".join(str(i) for i in SAMPLE_INDICES),
        help="Comma-separated sample indices (recorded in environment; default 0,1,2,3)",
    )
    args = parser.parse_args()
    indices = [int(x.strip()) for x in args.sample_indices.split(",") if x.strip()]
    run_benchmark(
        refresh_prove=args.refresh_prove,
        skip_gas=args.skip_gas,
        skip_ezkl_head=args.skip_ezkl_head,
        sample_indices=indices,
    )


if __name__ == "__main__":
    main()
