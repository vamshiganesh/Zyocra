import { useCallback, useEffect, useState } from "react";
import {
  chainReadsEnabled,
  readLiveChainStatus,
  type ChainAddressOverrides,
  type LiveChainStatus,
} from "../lib/chain";

export function useChainStatus(overrides?: ChainAddressOverrides, pollMs = 12_000) {
  const oracle = overrides?.oracle;
  const consumer = overrides?.consumer;
  const [live, setLive] = useState<LiveChainStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const enabled = chainReadsEnabled(overrides);

  const refresh = useCallback(async () => {
    if (!enabled) {
      setLive(null);
      setError(null);
      return;
    }
    setLoading(true);
    try {
      const status = await readLiveChainStatus({ oracle, consumer });
      setLive(status);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "chain read failed");
    } finally {
      setLoading(false);
    }
  }, [enabled, oracle, consumer]);

  useEffect(() => {
    void refresh();
    if (!enabled) return;
    const timer = window.setInterval(() => void refresh(), pollMs);
    return () => window.clearInterval(timer);
  }, [pollMs, refresh, enabled]);

  return { live, error, loading, enabled, refresh };
}
