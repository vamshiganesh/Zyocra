import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { BenchmarkRow } from "../components/ui/BenchmarkPanel";
import { EMPTY_VALUE } from "../lib/display";
import type { DataLoadStatus } from "../types/phase1";

const DATA_URL = "/data/bench-latest.json";

type MetricRow = {
  metric: string;
  unit: string;
  ezkl: number | string | null;
  ezkl_head?: number | string | null;
  circom: number | string | null;
  notes?: string;
};

type HybridWorkload = {
  amortized_prove_ms_per_update?: number;
  circom_head_prove_ms?: number;
  ezkl_full_prove_ms?: number;
  total_prove_ms_per_epoch?: number;
  scope?: string;
  assumptions?: {
    updates_per_epoch?: number;
    backbone_trust?: string;
  };
};

type BenchJson = {
  metrics?: MetricRow[];
  workloads?: {
    hybrid?: HybridWorkload | null;
    ezkl_head?: Record<string, unknown> | null;
  };
  limitations?: string[];
};

export type HybridSummary = {
  ezklFullMs: string;
  circomHeadMs: string;
  amortizedMs: string;
  totalEpochMs: string;
  updatesPerEpoch: number;
  scope: string;
};

const LABELS: Record<string, string> = {
  constraint_count: "Constraint count",
  prove_time_ms: "Proof generation time",
  verify_time_ms: "Verify time (off-chain)",
  proof_size_bytes: "Proof size (bytes)",
  peak_rss_kb: "Peak RAM (prover)",
  verify_gas: "Verification gas",
  accuracy_max_abs_error: "Score quant error",
};

function fmt(v: number | string | null | undefined): string {
  if (v === null || v === undefined) return EMPTY_VALUE;
  if (typeof v === "number") {
    if (Number.isInteger(v)) return v.toLocaleString();
    return v.toFixed(2);
  }
  return String(v);
}

function fmtMs(v: number | string | null | undefined): string {
  if (v === null || v === undefined) return EMPTY_VALUE;
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return EMPTY_VALUE;
  if (n >= 1000) return `${(n / 1000).toFixed(2)} s`;
  return `${n.toFixed(0)} ms`;
}

function fmtRss(v: number | string | null | undefined): string {
  if (v === null || v === undefined) return EMPTY_VALUE;
  return `${(Number(v) / 1024).toFixed(1)} MB`;
}

function rowsFromColumn(
  raw: BenchJson,
  leftKey: "ezkl" | "ezkl_head",
): BenchmarkRow[] {
  const byKey = new Map((raw.metrics ?? []).map((m) => [m.metric, m]));
  const order = [
    "constraint_count",
    "peak_rss_kb",
    "prove_time_ms",
    "verify_gas",
    "proof_size_bytes",
    "accuracy_max_abs_error",
  ];
  return order.map((key) => {
    const m = byKey.get(key);
    if (!m) {
      return { metric: LABELS[key] ?? key, ezkl: EMPTY_VALUE, circom: EMPTY_VALUE };
    }
    let left = fmt(m[leftKey] ?? null);
    let circom = fmt(m.circom);
    if (key === "prove_time_ms" || key === "verify_time_ms") {
      left = m[leftKey] != null ? fmtMs(m[leftKey]) : EMPTY_VALUE;
      circom = m.circom != null ? fmtMs(m.circom) : EMPTY_VALUE;
    } else if (key === "peak_rss_kb") {
      left = fmtRss(m[leftKey] ?? null);
      circom = fmtRss(m.circom);
    } else if (key === "verify_gas" && leftKey === "ezkl_head") {
      // Head path has no separate gas row in harness, mark N/A honestly.
      left = EMPTY_VALUE;
    }
    return { metric: LABELS[key] ?? m.metric, ezkl: left, circom };
  });
}

function hybridFromJson(raw: BenchJson): HybridSummary | null {
  const h = raw.workloads?.hybrid;
  if (!h || h.amortized_prove_ms_per_update == null) return null;
  return {
    ezklFullMs: fmtMs(h.ezkl_full_prove_ms),
    circomHeadMs: fmtMs(h.circom_head_prove_ms),
    amortizedMs: fmtMs(h.amortized_prove_ms_per_update),
    totalEpochMs: fmtMs(h.total_prove_ms_per_epoch),
    updatesPerEpoch: h.assumptions?.updates_per_epoch ?? 4,
    scope: h.scope ?? "EZKL full once per epoch + Circom head per update",
  };
}

type BenchmarkContextValue = {
  status: DataLoadStatus;
  /** Primary: matched EZKL head vs Circom head */
  headRows: BenchmarkRow[] | null;
  /** Secondary: EZKL full vs Circom head (asymmetric) */
  fullRows: BenchmarkRow[] | null;
  hybrid: HybridSummary | null;
  hasEzklHead: boolean;
  error: string | null;
  reload: () => void;
  /** @deprecated use headRows, kept for Overview fallbacks */
  rows: BenchmarkRow[] | null;
};

const BenchmarkContext = createContext<BenchmarkContextValue | null>(null);

export function BenchmarkDataProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<DataLoadStatus>("loading");
  const [headRows, setHeadRows] = useState<BenchmarkRow[] | null>(null);
  const [fullRows, setFullRows] = useState<BenchmarkRow[] | null>(null);
  const [hybrid, setHybrid] = useState<HybridSummary | null>(null);
  const [hasEzklHead, setHasEzklHead] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const reload = () => setTick((n) => n + 1);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setError(null);

    fetch(`${DATA_URL}?t=${tick}`, { cache: "no-store" })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<BenchJson>;
      })
      .then((raw) => {
        if (cancelled) return;
        if (!raw.metrics?.length) {
          setHeadRows(null);
          setFullRows(null);
          setHybrid(null);
          setHasEzklHead(false);
          setStatus("empty");
          return;
        }
        const headPresent = Boolean(
          raw.workloads?.ezkl_head ||
            raw.metrics.some((m) => m.metric === "prove_time_ms" && m.ezkl_head != null),
        );
        setHasEzklHead(headPresent);
        setHeadRows(headPresent ? rowsFromColumn(raw, "ezkl_head") : rowsFromColumn(raw, "ezkl"));
        setFullRows(rowsFromColumn(raw, "ezkl"));
        setHybrid(hybridFromJson(raw));
        setStatus("ready");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setHeadRows(null);
        setFullRows(null);
        setHybrid(null);
        setHasEzklHead(false);
        setStatus("error");
        setError(err instanceof Error ? err.message : "Failed to load benchmark data");
      });

    return () => {
      cancelled = true;
    };
  }, [tick]);

  const value = useMemo(
    () => ({
      status,
      headRows,
      fullRows,
      hybrid,
      hasEzklHead,
      error,
      reload,
      rows: headRows,
    }),
    [status, headRows, fullRows, hybrid, hasEzklHead, error],
  );

  return <BenchmarkContext.Provider value={value}>{children}</BenchmarkContext.Provider>;
}

export function useBenchmarkData() {
  const ctx = useContext(BenchmarkContext);
  if (!ctx) {
    throw new Error("useBenchmarkData must be used within BenchmarkDataProvider");
  }
  return ctx;
}
