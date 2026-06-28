"use client";

import { useState, useCallback } from "react";
import { task1Api } from "@/lib/api";
import type { HousingFeatures, SinglePredictionResponse, PredictionHistory } from "@/lib/types";

/** Generate a short unique ID */
let _seq = 0;
const uid = () => `${Date.now().toString(36)}-${++_seq}`;

// In-memory history cache shared across hook instances
const _history: PredictionHistory[] = [];

export function usePrediction() {
  const [result, setResult] = useState<SinglePredictionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const predict = useCallback(async (features: HousingFeatures) => {
    setLoading(true);
    setError(null);
    try {
      const res = await task1Api.predict(features);
      setResult(res);
      // Save to local history
      _history.unshift({
        id: uid(),
        features,
        predicted_price: res.predicted_price,
        timestamp: new Date().toISOString(),
      });
      if (_history.length > 500) _history.length = 500;
      return res;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Prediction failed";
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { result, loading, error, predict, setResult, setError };
}

export function usePredictionHistory() {
  const [history, setHistory] = useState<PredictionHistory[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setHistory([..._history]);
    setLoading(false);
    return _history;
  }, []);

  return { history, loading, fetchHistory };
}

export function useBatchPredict() {
  const [results, setResults] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const predictBatch = useCallback(async (features: HousingFeatures[]) => {
    setLoading(true);
    setError(null);
    try {
      const res = await task1Api.predictBatch(features);
      setResults(res.predictions);
      return res;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Batch prediction failed";
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { results, loading, error, predictBatch, setResults };
}
