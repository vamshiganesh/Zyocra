#!/usr/bin/env python3
"""Verify proof off-chain."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from zyocra_ezkl.config import PROOF_JSON, SETTINGS_JSON, SRS_FILE, VK_FILE
from zyocra_ezkl.pipeline import verify


def main() -> None:
    parser = argparse.ArgumentParser(description="Verify EZKL proof")
    parser.add_argument("--proof", type=Path, default=PROOF_JSON)
    parser.add_argument("--settings", type=Path, default=SETTINGS_JSON)
    parser.add_argument("--vk", type=Path, default=VK_FILE)
    parser.add_argument("--srs", type=Path, default=SRS_FILE)
    args = parser.parse_args()
    ok = verify(args.proof, args.settings, args.vk, args.srs)
    if not ok:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
