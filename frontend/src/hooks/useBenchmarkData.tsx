import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { BenchmarkRow } from "../components/ui/BenchmarkPanel";
import type { DataLoadStatus } from "../types/phase1";

const DATA_URL = "/data/bench-latest.json";

type BenchJson = {
  metrics?: {
    metric: string;
    unit: string;
    ezkl: number | string | null;
    circom: number | string | null;
    notes?: string;
  }[];
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
  if (v === null || v === undefined) return "—";
  if (typeof v === "number") {
    if (Number.isInteger(v)) return v.toLocaleString();
    return v.toFixed(2);
  }
  return String(v);
}

function rowsFromJson(raw: BenchJson): BenchmarkRow[] {
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
      return { metric: LABELS[key] ?? key, ezkl: "—", circom: "—" };
    }
    let ezkl = fmt(m.ezkl);
    let circom = fmt(m.circom);
    if (key === "prove_time_ms" || key === "verify_time_ms") {
      ezkl = m.ezkl != null ? `${ezkl} ms` : "—";
      circom = m.circom != null ? `${circom} ms` : "—";
    }
    if (key === "peak_rss_kb" && m.ezkl != null) {
      ezkl = `${(Number(m.ezkl) / 1024).toFixed(1)} MB`;
      circom = m.circom != null ? `${(Number(m.circom) / 1024).toFixed(1)} MB` : "—";
    }
    return { metric: LABELS[key] ?? m.metric, ezkl, circom };
  });
}

type BenchmarkContextValue = {
  status: DataLoadStatus;
  rows: BenchmarkRow[] | null;
  error: string | null;
  reload: () => void;
};

const BenchmarkContext = createContext<BenchmarkContextValue | null>(null);

export function BenchmarkDataProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<DataLoadStatus>("loading");
  const [rows, setRows] = useState<BenchmarkRow[] | null>(null);
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
          setRows(null);
          setStatus("empty");
          return;
        }
        setRows(rowsFromJson(raw));
        setStatus("ready");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setRows(null);
        setStatus("error");
        setError(err instanceof Error ? err.message : "Failed to load benchmark data");
      });

    return () => {
      cancelled = true;
    };
  }, [tick]);

  const value = useMemo(() => ({ status, rows, error, reload }), [status, rows, error]);

  return <BenchmarkContext.Provider value={value}>{children}</BenchmarkContext.Provider>;
}

export function useBenchmarkData() {
  const ctx = useContext(BenchmarkContext);
  if (!ctx) {
    throw new Error("useBenchmarkData must be used within BenchmarkDataProvider");
  }
  return ctx;
}
