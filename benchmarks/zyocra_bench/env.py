"""Capture host environment and toolchain versions for reproducibility."""

from __future__ import annotations

import json
import os
import platform
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from zyocra_bench.config import BENCH_ROOT, CIRCOM_ROOT, EZKL_ROOT, ML_ROOT, PYTHON, REPO_ROOT


def _run(cmd: list[str], cwd: Path | None = None) -> str | None:
    try:
        out = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True, check=True)
        return (out.stdout or out.stderr).strip().splitlines()[0]
    except (subprocess.CalledProcessError, FileNotFoundError, IndexError):
        return None


def _read_mem_total_kb() -> int | None:
    try:
        for line in Path("/proc/meminfo").read_text(encoding="utf-8").splitlines():
            if line.startswith("MemTotal:"):
                return int(line.split()[1])
    except OSError:
        return None
    return None


def capture_environment() -> dict[str, Any]:
    """Record machine profile and pinned tool versions."""
    py = PYTHON if PYTHON.is_file() else Path(sys.executable)
    torch_ver = ezkl_ver = None
    if py.is_file():
        torch_ver = _run([str(py), "-c", "import torch; print(torch.__version__)"])
        ezkl_ver = _run([str(py), "-c", "import ezkl; print(getattr(ezkl, '__version__', 'unknown'))"])

    snarkjs_ver = _run(["npx", "--prefix", str(CIRCOM_ROOT), "snarkjs", "--version"])

    return {
        "timestamp_utc": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "hostname": platform.node(),
        "platform": platform.platform(),
        "cpu_count": os.cpu_count(),
        "mem_total_kb": _read_mem_total_kb(),
        "repo_root": str(REPO_ROOT),
        "tools": {
            "node": _run(["node", "-v"]),
            "pnpm": _run(["pnpm", "-v"]),
            "python": _run(["python3", "--version"]),
            "rustc": _run(["rustc", "--version"]),
            "forge": _run(["forge", "--version"]),
            "circom": _run(["circom", "--version"]),
            "snarkjs": snarkjs_ver,
        },
        "python_packages": {
            "torch": torch_ver,
            "ezkl": ezkl_ver,
        },
    }


def write_env_snapshot(path: Path) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    payload = {"kind": "env_snapshot", **capture_environment()}
    path.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    return path
