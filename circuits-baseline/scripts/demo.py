#!/usr/bin/env python3
"""End-to-end local demo: sample input → witness → proof → verify → oracle payload."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from zyocra_ezkl.config import (
    COMPILED_EZKL,
    DEMO_MANIFEST,
    ORACLE_PAYLOAD_JSON,
    PK_FILE,
    PROOF_JSON,
    SAMPLE_INPUT,
    SETTINGS_JSON,
    SRS_FILE,
    VK_FILE,
    WITNESS_JSON,
)
from zyocra_ezkl.oracle_payload import write_oracle_payload
from zyocra_ezkl.pipeline import (
    compile_circuit,
    gen_settings,
    gen_witness,
    load_sample_features,
    prepare_onnx,
    prove,
    read_score_from_witness,
    setup_keys,
    verify,
    write_demo_manifest,
    write_input_json,
)


def main() -> None:
    parser = argparse.ArgumentParser(description="Run EZKL baseline demo")
    parser.add_argument("--sample-index", type=int, default=0)
    parser.add_argument("--skip-setup", action="store_true", help="Reuse existing vk/pk/srs")
    parser.add_argument("--skip-compile", action="store_true", help="Reuse compiled circuit")
    args = parser.parse_args()

    prepare_onnx()
    if not args.skip_compile:
        gen_settings()
        compile_circuit()
    elif not SETTINGS_JSON.exists() or not COMPILED_EZKL.exists():
        raise SystemExit("missing settings/compiled circuit — rerun without --skip-compile")

    if not args.skip_setup:
        setup_keys()
    elif not all(p.exists() for p in (VK_FILE, PK_FILE, SRS_FILE)):
        raise SystemExit("missing keys — rerun without --skip-setup")

    features = load_sample_features(args.sample_index)
    write_input_json(features, SAMPLE_INPUT)
    gen_witness(SAMPLE_INPUT, COMPILED_EZKL, WITNESS_JSON, VK_FILE, SRS_FILE)
    prove(WITNESS_JSON, COMPILED_EZKL, PK_FILE, PROOF_JSON, SRS_FILE)
    ok = verify(PROOF_JSON, SETTINGS_JSON, VK_FILE, SRS_FILE)
    score = read_score_from_witness(WITNESS_JSON)
    oracle_path = write_oracle_payload(score_float=score)

    write_demo_manifest(
        {
            "sample_index": args.sample_index,
            "features": features.reshape(-1).tolist(),
            "score_float": score,
            "verify_passed": ok,
            "artifacts": {
                "input": str(SAMPLE_INPUT),
                "witness": str(WITNESS_JSON),
                "proof": str(PROOF_JSON),
                "oracle_payload": str(oracle_path),
            },
        },
        DEMO_MANIFEST,
    )

    print(f"\nDemo complete. score={score:.6f} verify={'PASS' if ok else 'FAIL'}")
    print(f"oracle payload → {oracle_path}")


if __name__ == "__main__":
    main()
