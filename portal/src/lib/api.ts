/** API client — Task 1 (8000), Python App Backend (8001), Java Backend (8080) */

const TASK1_API = process.env.NEXT_PUBLIC_TASK1_API_URL ?? "http://localhost:8000";
const PYTHON_API = process.env.NEXT_PUBLIC_PYTHON_API_URL ?? "http://localhost:8001";
const JAVA_API = process.env.NEXT_PUBLIC_JAVA_API_URL ?? "http://localhost:8080";

import type {
  HousingFeatures,
  SinglePredictionResponse,
  BatchPredictionResponse,
  HealthResponse,
  ModelInfoResponse,
  TrendResponse,
  MarketStatistics,
  WhatIfRequest,
  WhatIfResponse,
  PredictionHistory,
} from "./types";

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { detail?: string }).detail ?? `HTTP ${res.status}`);
  }
  return res.json();
}

// ── Task 1: Housing Price Prediction API (port 8000, already running) ──

export const task1Api = {
  health: () => request<HealthResponse>(`${TASK1_API}/health`),

  modelInfo: () => request<ModelInfoResponse>(`${TASK1_API}/model-info`),

  predict: (features: HousingFeatures) =>
    request<SinglePredictionResponse>(`${TASK1_API}/predict`, {
      method: "POST",
      body: JSON.stringify({ features }),
    }),

  predictBatch: (features: HousingFeatures[]) =>
    request<BatchPredictionResponse>(`${TASK1_API}/predict/batch`, {
      method: "POST",
      body: JSON.stringify({ features }),
    }),
};

// ── App 1 Backend: Python FastAPI (port 8001) ──

export const pythonApi = {
  health: () => request<HealthResponse>(`${PYTHON_API}/health`),

  modelInfo: () => request<ModelInfoResponse>(`${PYTHON_API}/model-info`),

  predict: (features: HousingFeatures) =>
    request<SinglePredictionResponse>(`${PYTHON_API}/predict`, {
      method: "POST",
      body: JSON.stringify({ features }),
    }),

  predictBatch: (features: HousingFeatures[]) =>
    request<BatchPredictionResponse>(`${PYTHON_API}/predict/batch`, {
      method: "POST",
      body: JSON.stringify({ features }),
    }),

  history: (limit = 50) =>
    request<PredictionHistory[]>(`${PYTHON_API}/predict/history?limit=${limit}`),

  compare: (features: HousingFeatures[]) =>
    request<{ index: number; predicted_price: number; features: HousingFeatures }[]>(
      `${PYTHON_API}/compare`,
      { method: "POST", body: JSON.stringify(features) }
    ),
};

// ── App 2 Backend: Java Spring Boot (port 8080) ──

export const javaApi = {
  health: () => request<{ status: string }>(`${JAVA_API}/api/v2/health`),

  statistics: () => request<MarketStatistics>(`${JAVA_API}/api/v2/statistics`),

  trends: () => request<TrendResponse>(`${JAVA_API}/api/v2/trends`),

  predict: (features: HousingFeatures) =>
    request<SinglePredictionResponse>(`${JAVA_API}/api/v2/predict`, {
      method: "POST",
      body: JSON.stringify(features),
    }),

  compare: (features: HousingFeatures[]) =>
    request<BatchPredictionResponse>(`${JAVA_API}/api/v2/compare`, {
      method: "POST",
      body: JSON.stringify({ properties: features, includeForecast: false }),
    }),

  whatIf: (req: WhatIfRequest) =>
    request<WhatIfResponse>(`${JAVA_API}/api/v2/what-if`, {
      method: "POST",
      body: JSON.stringify(req),
    }),

  exportCsv: () => `${JAVA_API}/api/v2/export?format=csv`,
  exportPdf: () => `${JAVA_API}/api/v2/export?format=pdf`,

  clearCache: () =>
    request<{ status: string }>(`${JAVA_API}/api/v2/cache`, { method: "DELETE" }),
};
