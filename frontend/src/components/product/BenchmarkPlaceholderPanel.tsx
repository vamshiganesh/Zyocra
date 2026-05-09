import { benchmarkRows } from "../../data/placeholders";
import { useBenchmarkData } from "../../hooks/useBenchmarkData";
import { BenchmarkPanel } from "../ui/BenchmarkPanel";
import { SectionHeader } from "../ui/SectionHeader";
import "./product.css";

/** EZKL vs Circom comparison — reads benchmarks/raw-results via public/data/bench-latest.json */
export function BenchmarkPlaceholderPanel() {
  const { status, rows, error } = useBenchmarkData();
  const live = status === "ready" && rows !== null;
  const displayRows = live ? rows : benchmarkRows;

  return (
    <div className="benchmark-placeholder">
      <SectionHeader
        label="Benchmarks"
        title={live ? "EZKL vs Circom (local run)" : "EZKL vs Circom"}
        description={
          live
            ? "From make benchmark — see docs/benchmarks.md for workload scope and limitations."
            : "Run make benchmark, then sync or copy bench-latest.json to frontend/public/data/."
        }
      />
      <p className="benchmark-placeholder__status mono-label">
        {live
          ? "Populated · bench-latest.json"
          : status === "loading"
            ? "Loading benchmark data…"
            : status === "error"
              ? `Benchmark data error: ${error ?? "unknown"}`
              : "Awaiting make benchmark"}
      </p>
      <BenchmarkPanel rows={displayRows} />
    </div>
  );
}
