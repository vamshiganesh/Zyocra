"""Subprocess timing with optional peak RSS (Linux /usr/bin/time -v)."""

from __future__ import annotations

import re
import statistics
import subprocess
import time
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class RunStats:
    wall_ms: float
    peak_rss_kb: int | None
    exit_code: int
    stderr: str


@dataclass(frozen=True)
class AggregatedStats:
    wall_ms_median: float
    wall_ms_min: float
    wall_ms_max: float
    wall_ms_stdev: float | None
    peak_rss_kb: int | None
    runs: int


_TIME_BIN = Path("/usr/bin/time")


def _parse_time_v(stderr: str) -> tuple[float | None, int | None]:
    elapsed = None
    rss = None
    for line in stderr.splitlines():
        if "Elapsed (wall clock)" in line:
            m = re.search(r"(\d+):(\d{2}(?:\.\d+)?)$", line.strip())
            if m:
                elapsed = float(m.group(1)) * 60 + float(m.group(2))
            else:
                m2 = re.search(r"(\d+\.\d+)$", line.strip())
                if m2:
                    elapsed = float(m2.group(1))
        if "Maximum resident set size" in line:
            m = re.search(r"(\d+)", line)
            if m:
                rss = int(m.group(1))
    return elapsed, rss


def run_once(cmd: list[str], cwd: Path | None = None) -> RunStats:
    if _TIME_BIN.is_file():
        proc = subprocess.run(
            [str(_TIME_BIN), "-v", *cmd],
            cwd=cwd,
            capture_output=True,
            text=True,
        )
        elapsed, rss = _parse_time_v(proc.stderr)
        wall_ms = (elapsed or 0.0) * 1000.0
        return RunStats(wall_ms=wall_ms, peak_rss_kb=rss, exit_code=proc.returncode, stderr=proc.stderr)

    t0 = time.perf_counter()
    proc = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True)
    wall_ms = (time.perf_counter() - t0) * 1000.0
    return RunStats(wall_ms=wall_ms, peak_rss_kb=None, exit_code=proc.returncode, stderr=proc.stderr)


def aggregate_runs(results: list[RunStats]) -> AggregatedStats:
    walls = [r.wall_ms for r in results]
    rss_vals = [r.peak_rss_kb for r in results if r.peak_rss_kb is not None]
    stdev = float(statistics.stdev(walls)) if len(walls) > 1 else None
    return AggregatedStats(
        wall_ms_median=float(statistics.median(walls)),
        wall_ms_min=float(min(walls)),
        wall_ms_max=float(max(walls)),
        wall_ms_stdev=round(stdev, 2) if stdev is not None else None,
        peak_rss_kb=int(statistics.median(rss_vals)) if rss_vals else None,
        runs=len(results),
    )


def median_runs(cmd: list[str], runs: int, cwd: Path | None = None) -> RunStats:
    """Backward-compatible median stats for a command."""
    agg = run_aggregate(cmd, runs, cwd=cwd)
    return RunStats(
        wall_ms=agg.wall_ms_median,
        peak_rss_kb=agg.peak_rss_kb,
        exit_code=0,
        stderr="",
    )


def run_aggregate(cmd: list[str], runs: int, cwd: Path | None = None) -> AggregatedStats:
    results = [run_once(cmd, cwd=cwd) for _ in range(runs)]
    if any(r.exit_code != 0 for r in results):
        bad = next(r for r in results if r.exit_code != 0)
        raise RuntimeError(f"command failed ({bad.exit_code}): {' '.join(cmd)}\n{bad.stderr}")
    return aggregate_runs(results)
