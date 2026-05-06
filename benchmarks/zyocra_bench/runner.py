"""Benchmark orchestrator."""

from __future__ import annotations

import argparse
import sys
from datetime import datetime, timezone
from pathlib import Path

BENCH_ROOT = Path(__file__).resolve().parents[1]
if str(BENCH_ROOT) not in sys.path:
    sys.path.insert(0, str(BENCH_ROOT))

from zyocra_bench.accuracy import collect_accuracy
from zyocra_bench.circom_bench import collect_circom
from zyocra_bench.env import capture_environment, write_env_snapshot
from zyocra_bench.ezkl_bench import collect_ezkl
from zyocra_bench.gas_bench import collect_gas
from zyocra_bench.report import publish_report
from zyocra_bench.schema import assemble_report


def run_benchmark(*, refresh_prove: bool = False, skip_gas: bool = False) -> dict:
    errors: list[str] = []
    environment = capture_environment()

    ezkl = circom = None
    try:
        ezkl = collect_ezkl(refresh_prove=refresh_prove)
    except Exception as exc:  # noqa: BLE001 — collect partial bench
        errors.append(f"ezkl: {exc}")

    try:
        circom = collect_circom(refresh_prove=refresh_prove)
    except Exception as exc:
        errors.append(f"circom: {exc}")

    accuracy = collect_accuracy()

    gas: dict = {"ezkl_verify_gas": None, "circom_verify_gas": None}
    if not skip_gas:
        try:
            gas = collect_gas()
        except Exception as exc:
            errors.append(f"gas: {exc}")

    report = assemble_report(environment, ezkl, circom, gas, accuracy, errors)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    paths = publish_report(report, stamp)
    write_env_snapshot(BENCH_ROOT / "raw-results" / f"env-{stamp}.json")

    print(f"==> benchmark json: {paths['json']}")
    print(f"==> benchmark csv:  {paths['csv']}")
    print(f"==> summary md:     {paths['md']}")
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
    args = parser.parse_args()
    run_benchmark(refresh_prove=args.refresh_prove, skip_gas=args.skip_gas)


if __name__ == "__main__":
    main()
