import { useCallback, useEffect, useState } from "react";
import { signalsApi } from "../services/api.js";

const REFRESH_MS = 15_000;

/**
 * Loads signals, auto-refreshes every 15s. Exposes refetch for manual refresh.
 */
export function useSignals() {
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSignals = useCallback(async () => {
    setError(null);
    try {
      const body = await signalsApi.list();
      const list = Array.isArray(body?.data) ? body.data : [];
      setSignals(list);
    } catch (e) {
      setError(e.message ?? "Failed to load signals");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchSignals();
  }, [fetchSignals]);

  useEffect(() => {
    const id = setInterval(() => {
      void fetchSignals();
    }, REFRESH_MS);
    return () => clearInterval(id);
  }, [fetchSignals]);

  return {
    signals,
    loading,
    error,
    refetch: fetchSignals,
  };
}
