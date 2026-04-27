#!/usr/bin/env python3
"""Generate witness from input JSON."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from zyocra_ezkl.config import COMPILED_EZKL, SAMPLE_INPUT, SRS_FILE, VK_FILE, WITNESS_JSON
from zyocra_ezkl.pipeline import gen_witness


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate EZKL witness")
    parser.add_argument("--input", type=Path, default=SAMPLE_INPUT)
    parser.add_argument("--compiled", type=Path, default=COMPILED_EZKL)
    parser.add_argument("--witness", type=Path, default=WITNESS_JSON)
    parser.add_argument("--vk", type=Path, default=VK_FILE)
    parser.add_argument("--srs", type=Path, default=SRS_FILE)
    args = parser.parse_args()
    gen_witness(args.input, args.compiled, args.witness, args.vk, args.srs)


if __name__ == "__main__":
    main()
