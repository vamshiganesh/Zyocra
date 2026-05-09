import type { DataLoadStatus } from "../../types/phase1";
import "./product.css";

type Props = {
  status: DataLoadStatus;
  error?: string | null;
  onRetry?: () => void;
  /** Override default copy for benchmark vs phase-1 data sources */
  variant?: "phase1" | "benchmark";
};

const phase1Copy: Record<DataLoadStatus, { title: string; body: string }> = {
  loading: {
    title: "Loading local demo data",
    body: "Reading phase1-demo.json from the public data directory.",
  },
  empty: {
    title: "No demo artifacts yet",
    body: "Run bash scripts/sync-frontend-data.sh after the EZKL pipeline or e2e_phase1.sh.",
  },
  error: {
    title: "Could not load demo data",
    body: "Check that frontend/public/data/phase1-demo.json exists and is valid JSON.",
  },
  ready: { title: "", body: "" },
};

const benchmarkCopy: Record<DataLoadStatus, { title: string; body: string }> = {
  loading: {
    title: "Loading benchmark results",
    body: "Reading bench-latest.json from the public data directory.",
  },
  empty: {
    title: "No benchmark results yet",
    body: "Run make benchmark from repo root, then bash scripts/sync-frontend-data.sh.",
  },
  error: {
    title: "Could not load benchmark data",
    body: "Check that frontend/public/data/bench-latest.json exists and is valid JSON.",
  },
  ready: { title: "", body: "" },
};

export function DataStatus({ status, error, onRetry, variant = "phase1" }: Props) {
  if (status === "ready") return null;

  const text = variant === "benchmark" ? benchmarkCopy[status] : phase1Copy[status];

  return (
    <div className={`data-status data-status--${status}`} role="status">
      <p className="data-status__title mono-label">{text.title}</p>
      <p className="data-status__body">{error ?? text.body}</p>
      {status !== "loading" && onRetry ? (
        <button type="button" className="data-status__retry" onClick={onRetry}>
          Retry
        </button>
      ) : null}
    </div>
  );
}
