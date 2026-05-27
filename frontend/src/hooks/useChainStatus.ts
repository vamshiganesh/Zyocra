import { useCallback, useEffect, useState } from "react";
import { chainReadsEnabled, readLiveChainStatus, type LiveChainStatus } from "../lib/chain";

export function useChainStatus(pollMs = 12_000) {
  const [live, setLive] = useState<LiveChainStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!chainReadsEnabled) {
      setLive(null);
      setError(null);
      return;
    }
    setLoading(true);
    try {
      const status = await readLiveChainStatus();
      setLive(status);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "chain read failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    if (!chainReadsEnabled) return;
    const timer = window.setInterval(() => void refresh(), pollMs);
    return () => window.clearInterval(timer);
  }, [pollMs, refresh]);

  return { live, error, loading, enabled: chainReadsEnabled, refresh };
}
