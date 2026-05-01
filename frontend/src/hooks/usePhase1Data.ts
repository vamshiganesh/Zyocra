import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { buildPhase1View, type Phase1View } from "../data/phase1-view";
import type { DataLoadStatus, Phase1DemoJson } from "../types/phase1";

const DATA_URL = "/data/phase1-demo.json";

type Phase1ContextValue = {
  status: DataLoadStatus;
  view: Phase1View | null;
  error: string | null;
  reload: () => void;
};

const Phase1Context = createContext<Phase1ContextValue | null>(null);

export function Phase1DataProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<DataLoadStatus>("loading");
  const [view, setView] = useState<Phase1View | null>(null);
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
        return res.json() as Promise<Phase1DemoJson>;
      })
      .then((raw) => {
        if (cancelled) return;
        if (!raw.hasArtifacts) {
          setView(null);
          setStatus("empty");
          return;
        }
        setView(buildPhase1View(raw));
        setStatus("ready");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setView(null);
        setStatus("error");
        setError(err instanceof Error ? err.message : "Failed to load demo data");
      });

    return () => {
      cancelled = true;
    };
  }, [tick]);

  const value = useMemo(
    () => ({ status, view, error, reload }),
    [status, view, error],
  );

  return <Phase1Context.Provider value={value}>{children}</Phase1Context.Provider>;
}

export function usePhase1Data() {
  const ctx = useContext(Phase1Context);
  if (!ctx) {
    throw new Error("usePhase1Data must be used within Phase1DataProvider");
  }
  return ctx;
}
