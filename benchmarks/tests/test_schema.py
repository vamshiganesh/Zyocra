"""Schema and report formatting tests."""

from __future__ import annotations

from zyocra_bench.report import write_csv, write_markdown
from zyocra_bench.schema import LIMITATIONS, assemble_report, build_metric_rows


def test_build_metric_rows_shape() -> None:
    ezkl = {
        "constraint_count": 964,
        "prove_ms_median": 100.0,
        "verify_ms": 5.0,
        "proof_size_bytes": 21415,
        "peak_rss_kb": 500000,
    }
    circom = {
        "constraint_count": 89,
        "prove_ms_median": 10.0,
        "verify_ms": 1.0,
        "proof_size_bytes": 806,
        "peak_rss_kb": 100000,
    }
    gas = {"ezkl_verify_gas": 400000, "circom_verify_gas": 250000}
    accuracy = {"ezkl_full_model": {"max_abs_error": 0.006}}
    rows = build_metric_rows(ezkl, circom, gas, accuracy)
    assert len(rows) >= 6
    assert rows[0]["metric"] == "constraint_count"
    assert rows[0]["ezkl"] == 964
    assert rows[0]["circom"] == 89


def test_assemble_report_has_limitations() -> None:
    report = assemble_report(
        environment={"timestamp_utc": "2026-01-01T00:00:00Z"},
        ezkl=None,
        circom=None,
        gas={},
        accuracy={},
        errors=["partial"],
    )
    assert report["schema_version"] == "1.0"
    assert len(report["limitations"]) == len(LIMITATIONS)
    assert report["errors"] == ["partial"]


def test_write_markdown_and_csv(tmp_path) -> None:
    report = assemble_report(
        environment={"timestamp_utc": "2026-01-01T00:00:00Z", "platform": "test"},
        ezkl={"scope": "full"},
        circom={"scope": "head"},
        gas={},
        accuracy={},
        errors=[],
    )
    md = tmp_path / "out.md"
    csv = tmp_path / "out.csv"
    write_markdown(report, md)
    write_csv(report, csv)
    assert "Limitations" in md.read_text(encoding="utf-8")
    assert "constraint_count" in csv.read_text(encoding="utf-8")
