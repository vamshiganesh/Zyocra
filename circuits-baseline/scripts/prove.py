#!/usr/bin/env python3
"""Generate ZK proof from witness."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from zyocra_ezkl.config import COMPILED_EZKL, PK_FILE, PROOF_JSON, SRS_FILE, WITNESS_JSON
from zyocra_ezkl.pipeline import prove


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate EZKL proof")
    parser.add_argument("--witness", type=Path, default=WITNESS_JSON)
    parser.add_argument("--compiled", type=Path, default=COMPILED_EZKL)
    parser.add_argument("--pk", type=Path, default=PK_FILE)
    parser.add_argument("--proof", type=Path, default=PROOF_JSON)
    parser.add_argument("--srs", type=Path, default=SRS_FILE)
    args = parser.parse_args()
    prove(args.witness, args.compiled, args.pk, args.proof, args.srs)


if __name__ == "__main__":
    main()
