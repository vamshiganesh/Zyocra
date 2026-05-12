"""Write JSON, CSV, Markdown summary, and SVG charts."""

from __future__ import annotations

import csv
import json
import shutil
from pathlib import Path
from typing import Any

from zyocra_bench.config import LATEST_CSV, LATEST_JSON, LATEST_MD, PLOTS_DIR, RAW_DIR, FE_PUBLIC_BENCH


def _fmt(v: Any) -> str:
    if v is None:
        return "—"
    if isinstance(v, float):
        return f"{v:.4g}"
    return str(v)


def write_json(report: dict[str, Any], path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(report, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def write_csv(report: dict[str, Any], path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    rows = report.get("metrics", [])
    with path.open("w", encoding="utf-8", newline="") as fh:
        writer = csv.DictWriter(
            fh,
            fieldnames=["metric", "unit", "ezkl", "ezkl_head", "circom", "notes"],
        )
        writer.writeheader()
        for row in rows:
            writer.writerow(
                {
                    "metric": row["metric"],
                    "unit": row["unit"],
                    "ezkl": _fmt(row.get("ezkl")),
                    "ezkl_head": _fmt(row.get("ezkl_head")),
                    "circom": _fmt(row.get("circom")),
                    "notes": row.get("notes", ""),
                }
            )


def write_markdown(report: dict[str, Any], path: Path) -> None:
    env = report.get("environment", {})
    tools = env.get("tools", {})
    metrics = report.get("metrics", [])

    lines = [
        "# Zyocra benchmark summary",
        "",
        f"- **UTC:** {report.get('timestamp_utc', '—')}",
        f"- **Host:** {env.get('platform', '—')}",
        f"- **CPUs:** {env.get('cpu_count', '—')}",
        f"- **EZKL:** {env.get('python_packages', {}).get('ezkl', '—')}",
        f"- **Circom:** {tools.get('circom', '—')}",
        f"- **Forge:** {tools.get('forge', '—')}",
        "",
        "## Workload scope",
        "",
        f"- **EZKL:** {report.get('workloads', {}).get('ezkl', {}).get('scope', '—')}",
        f"- **Circom:** {report.get('workloads', {}).get('circom', {}).get('scope', '—')}",
        "",
        "## Metrics",
        "",
        "| Metric | EZKL | Circom | Unit | Notes |",
        "|--------|------|--------|------|-------|",
    ]

    for row in metrics:
        lines.append(
            f"| {row['metric']} | {_fmt(row.get('ezkl'))} | {_fmt(row.get('circom'))} | {row['unit']} | {row.get('notes', '')} |"
        )

    lines.extend(["", "## Methodology", ""])
    for key, val in (report.get("methodology") or {}).items():
        lines.append(f"- **{key}:** {val}")

    lines.extend(["", "## Limitations", ""])
    for item in report.get("limitations") or []:
        lines.append(f"- {item}")

    if report.get("errors"):
        lines.extend(["", "## Errors", ""])
        for err in report["errors"]:
            lines.append(f"- {err}")

    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def _bar_chart_svg(
    title: str,
    labels: list[str],
    ezkl_vals: list[float],
    circom_vals: list[float],
    path: Path,
    *,
    unit: str = "",
) -> None:
    width, height = 520, 280
    margin = 60
    chart_w = width - 2 * margin
    chart_h = height - 80
    pairs = list(zip(labels, ezkl_vals, circom_vals, strict=True))
    max_v = max([v for _, e, c in pairs for v in (e, c) if v > 0] or [1.0])

    bars: list[str] = []
    group_w = chart_w / max(len(pairs), 1)
    bar_w = group_w * 0.28

    for i, (label, ez, ci) in enumerate(pairs):
        gx = margin + i * group_w + group_w * 0.15
        eh = (ez / max_v) * chart_h if ez else 0
        ch = (ci / max_v) * chart_h if ci else 0
        y_base = height - 40
        bars.append(
            f'<rect x="{gx:.1f}" y="{y_base - eh:.1f}" width="{bar_w:.1f}" height="{eh:.1f}" fill="#1a1a1a"/>'
        )
        bars.append(
            f'<rect x="{gx + bar_w + 4:.1f}" y="{y_base - ch:.1f}" width="{bar_w:.1f}" height="{ch:.1f}" fill="#eba50e"/>'
        )
        bars.append(
            f'<text x="{gx + bar_w:.1f}" y="{height - 22}" font-size="10" text-anchor="middle" fill="#333">{label}</text>'
        )

    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">
  <text x="{margin}" y="24" font-size="14" font-weight="600" fill="#111">{title}</text>
  <text x="{width - margin}" y="24" font-size="10" text-anchor="end" fill="#666">{unit}</text>
  <rect x="{margin}" y="40" width="{chart_w}" height="{chart_h}" fill="none" stroke="#ddd"/>
  {''.join(bars)}
  <rect x="{margin}" y="48" width="10" height="10" fill="#1a1a1a"/>
  <text x="{margin + 14}" y="57" font-size="10" fill="#333">EZKL</text>
  <rect x="{margin + 70}" y="48" width="10" height="10" fill="#eba50e"/>
  <text x="{margin + 84}" y="57" font-size="10" fill="#333">Circom</text>
</svg>
"""
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(svg, encoding="utf-8")


def write_charts(report: dict[str, Any], plots_dir: Path) -> list[str]:
    plots_dir.mkdir(parents=True, exist_ok=True)
    metrics = {m["metric"]: m for m in report.get("metrics", [])}
    written: list[str] = []

    def num(metric: str, key: str) -> float:
        v = metrics.get(metric, {}).get(key)
        return float(v) if v is not None else 0.0

    chart_specs = [
        ("constraints.svg", "Constraint count", ["constraints"], "constraint_count", "count"),
        ("prove-time.svg", "Prove time (median)", ["prove"], "prove_time_ms", "ms"),
        ("proof-size.svg", "Proof size", ["size"], "proof_size_bytes", "bytes"),
        ("verify-gas.svg", "Verify gas (EVM)", ["gas"], "verify_gas", "gas"),
    ]

    for filename, title, labels, metric_key, unit in chart_specs:
        out = plots_dir / filename
        _bar_chart_svg(
            title,
            labels,
            [num(metric_key, "ezkl")],
            [num(metric_key, "circom")],
            out,
            unit=unit,
        )
        written.append(str(out))

    return written


def publish_report(report: dict[str, Any], stamp: str) -> dict[str, str]:
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    stamped_json = RAW_DIR / f"bench-{stamp}.json"
    stamped_csv = RAW_DIR / f"bench-{stamp}.csv"
    stamped_md = RAW_DIR / f"bench-{stamp}.md"

    write_json(report, stamped_json)
    write_csv(report, stamped_csv)
    write_markdown(report, stamped_md)

    shutil.copy2(stamped_json, LATEST_JSON)
    shutil.copy2(stamped_csv, LATEST_CSV)
    shutil.copy2(stamped_md, LATEST_MD)
    FE_PUBLIC_BENCH.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(LATEST_JSON, FE_PUBLIC_BENCH)

    charts = write_charts(report, PLOTS_DIR)

    # Per-path snapshots for frontend placeholders
    ezkl = report.get("workloads", {}).get("ezkl")
    circom = report.get("workloads", {}).get("circom")
    if ezkl:
        write_json({"kind": "ezkl_bench", **ezkl}, RAW_DIR / f"ezkl-{stamp}.json")
        shutil.copy2(RAW_DIR / f"ezkl-{stamp}.json", RAW_DIR / "ezkl-latest.json")
    if circom:
        write_json({"kind": "circom_bench", **circom}, RAW_DIR / f"circom-{stamp}.json")
        shutil.copy2(RAW_DIR / f"circom-{stamp}.json", RAW_DIR / "circom-latest.json")

    return {
        "json": str(stamped_json),
        "csv": str(stamped_csv),
        "md": str(stamped_md),
        "latest_json": str(LATEST_JSON),
        "charts": ",".join(charts),
    }
