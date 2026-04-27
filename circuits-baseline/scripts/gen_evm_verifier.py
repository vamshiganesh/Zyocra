#!/usr/bin/env python3
"""Generate Solidity EVM verifier contract."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from zyocra_ezkl.config import SETTINGS_JSON, SRS_FILE, VERIFIER_ABI, VERIFIER_SOL, VK_FILE
from zyocra_ezkl.pipeline import gen_evm_verifier


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate EVM verifier")
    parser.add_argument("--vk", type=Path, default=VK_FILE)
    parser.add_argument("--settings", type=Path, default=SETTINGS_JSON)
    parser.add_argument("--sol", type=Path, default=VERIFIER_SOL)
    parser.add_argument("--abi", type=Path, default=VERIFIER_ABI)
    parser.add_argument("--srs", type=Path, default=SRS_FILE)
    args = parser.parse_args()
    gen_evm_verifier(args.vk, args.settings, args.sol, args.abi, args.srs)


if __name__ == "__main__":
    main()
