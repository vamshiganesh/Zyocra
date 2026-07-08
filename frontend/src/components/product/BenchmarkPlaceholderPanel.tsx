import { benchmarkRows } from "../../data/placeholders";
import { useBenchmarkData } from "../../hooks/useBenchmarkData";
import { BenchmarkPanel } from "../ui/BenchmarkPanel";
import { SectionHeader } from "../ui/SectionHeader";
import "./BenchmarkPlaceholderPanel.css";

/** Matched head table (primary) + asymmetric full table + hybrid cost model. */
export function BenchmarkPlaceholderPanel({ compact = false }: { compact?: boolean }) {
  const { status, headRows, fullRows, hybrid, hasEzklHead, error } = useBenchmarkData();
  const live = status === "ready" && headRows != null;
  const primary = live ? headRows : benchmarkRows;
  const secondary = live && fullRows ? fullRows : benchmarkRows;

  return (
    <div className="benchmark-placeholder">
      <SectionHeader
        label="Benchmarks"
        title={hasEzklHead || !live ? "Matched LoRA head subgraph" : "Waiting for EZKL head row"}
        description={
          live
            ? hasEzklHead
              ? "Primary comparison: EZKL head-only ONNX vs hand Circom on the same hidden[8] → logit statement. Run make head-benchmark to refresh."
              : "Published bench-latest.json is missing ezkl_head — run make head-benchmark so the fair row is populated."
            : "Run make head-benchmark, then bash scripts/sync-frontend-data.sh."
        }
      />
      <p className="benchmark-placeholder__status mono-label">
        {status === "loading"
          ? "Loading benchmark data…"
          : status === "error"
            ? `Benchmark data error: ${error ?? "unknown"}`
            : status === "empty"
              ? "Awaiting make head-benchmark"
              : hasEzklHead
                ? "Primary = matched head · Secondary = asymmetric system workloads"
                : "Primary falls back to EZKL full until ezkl_head exists"}
      </p>

      <BenchmarkPanel
        title="Primary — fair circuit comparison"
        note="Same LoRA output-head algebra · EZKL-compiled head ONNX vs hand Circom."
        ezklColumn="EZKL head"
        circomColumn="Circom head"
        rows={primary}
      />

      {!compact ? (
        <>
          <BenchmarkPanel
            title="Secondary — system workloads (not equivalent)"
            note="EZKL full-graph end-to-end score vs Circom head-only LoRA subgraph."
            ezklColumn="EZKL full graph"
            circomColumn="Circom head"
            banner="Not end-to-end equivalent: full-graph constraints / prove time must not be read as a matched kernel bakeoff."
            bannerTone="warn"
            rows={secondary}
          />

          {hybrid ? (
            <div className="bench-panel__hybrid">
              <p className="bench-panel__hybrid-title mono-label">Hybrid amortized cost</p>
              <div className="bench-panel__hybrid-grid">
                <div className="bench-panel__hybrid-cell">
                  <span className="bench-panel__hybrid-label">EZKL full / epoch</span>
                  <span className="bench-panel__hybrid-value">{hybrid.ezklFullMs}</span>
                </div>
                <div className="bench-panel__hybrid-cell">
                  <span className="bench-panel__hybrid-label">Circom head / update</span>
                  <span className="bench-panel__hybrid-value">{hybrid.circomHeadMs}</span>
                </div>
                <div className="bench-panel__hybrid-cell">
                  <span className="bench-panel__hybrid-label">Updates / epoch</span>
                  <span className="bench-panel__hybrid-value">{hybrid.updatesPerEpoch}</span>
                </div>
                <div className="bench-panel__hybrid-cell">
                  <span className="bench-panel__hybrid-label">Amortized / update</span>
                  <span className="bench-panel__hybrid-value">{hybrid.amortizedMs}</span>
                </div>
                <div className="bench-panel__hybrid-cell">
                  <span className="bench-panel__hybrid-label">Total prove / epoch</span>
                  <span className="bench-panel__hybrid-value">{hybrid.totalEpochMs}</span>
                </div>
              </div>
              <p className="bench-panel__hybrid-note">{hybrid.scope}</p>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
