"use client";

import { useState, useEffect, useCallback } from "react";
import { javaApi } from "@/lib/api";
import type {
  MarketStatistics,
  TrendResponse,
  WhatIfRequest,
  WhatIfResponse,
} from "@/lib/types";

export function useMarketStatistics() {
  const [data, setData] = useState<MarketStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await javaApi.statistics();
      setData(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load statistics");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

export function useTrends() {
  const [data, setData] = useState<TrendResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await javaApi.trends();
      setData(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load trends");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

export function useWhatIf() {
  const [result, setResult] = useState<WhatIfResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback(async (req: WhatIfRequest) => {
    setLoading(true);
    setError(null);
    try {
      const res = await javaApi.whatIf(req);
      setResult(res);
      return res;
    } catch (e) {
      setError(e instanceof Error ? e.message : "What-if analysis failed");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { result, loading, error, analyze, setResult };
}
