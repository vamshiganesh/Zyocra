#!/usr/bin/env python3
"""Generate SRS + proving/verification keys."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from zyocra_ezkl.config import COMPILED_EZKL, PK_FILE, SRS_FILE, VK_FILE
from zyocra_ezkl.pipeline import ensure_srs, setup_keys


def main() -> None:
    parser = argparse.ArgumentParser(description="EZKL setup (SRS + vk/pk)")
    parser.add_argument("--compiled", type=Path, default=COMPILED_EZKL)
    parser.add_argument("--srs", type=Path, default=SRS_FILE)
    parser.add_argument("--vk", type=Path, default=VK_FILE)
    parser.add_argument("--pk", type=Path, default=PK_FILE)
    parser.add_argument("--srs-only", action="store_true", help="Only generate SRS")
    args = parser.parse_args()

    if args.srs_only:
        ensure_srs()
        return

    setup_keys(args.compiled, args.vk, args.pk, args.srs)


if __name__ == "__main__":
    main()
