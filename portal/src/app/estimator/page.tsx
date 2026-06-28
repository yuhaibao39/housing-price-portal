"use client";

import { useState, useCallback, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Spinner from "@/components/ui/Spinner";
import Badge from "@/components/ui/Badge";
import DataTable, { type Column } from "@/components/ui/DataTable";
import { usePrediction, usePredictionHistory, useBatchPredict } from "@/hooks/usePrediction";
import { task1Api } from "@/lib/api";
import {
  DEFAULT_FEATURES,
  FEATURE_META,
  type HousingFeatures,
  type PredictionHistory,
  type ModelInfoResponse,
} from "@/lib/types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type Tab = "predict" | "history" | "compare";

// ────────────── Predict Form ──────────────

function PredictForm({
  onPredict,
  loading,
}: {
  onPredict: (f: HousingFeatures) => void;
  loading: boolean;
}) {
  const [features, setFeatures] = useState<HousingFeatures>({ ...DEFAULT_FEATURES });
  const [errors, setErrors] = useState<Partial<Record<keyof HousingFeatures, string>>>({});

  const updateField = (key: keyof HousingFeatures, raw: string) => {
    const val = parseFloat(raw);
    setFeatures((p) => ({ ...p, [key]: raw === "" ? 0 : val }));

    const meta = FEATURE_META[key];
    if (raw === "" || isNaN(val)) {
      setErrors((p) => ({ ...p, [key]: "Required" }));
    } else if (val < meta.min || val > meta.max) {
      setErrors((p) => ({ ...p, [key]: `Must be ${meta.min}–${meta.max}` }));
    } else {
      setErrors((p) => {
        const n = { ...p }; delete n[key]; return n;
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Partial<Record<keyof HousingFeatures, string>> = {};
    for (const [k, v] of Object.entries(features)) {
      const key = k as keyof HousingFeatures;
      const meta = FEATURE_META[key];
      const num = Number(v);
      if (isNaN(num)) errs[key] = "Required";
      else if (num < meta.min || num > meta.max) errs[key] = `Must be ${meta.min}–${meta.max}`;
    }
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    onPredict(features);
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {(Object.keys(FEATURE_META) as (keyof HousingFeatures)[]).map((key) => {
        const meta = FEATURE_META[key];
        return (
          <Input
            key={key}
            label={meta.label}
            unit={meta.unit}
            help={meta.help}
            type="number"
            step={meta.step}
            min={meta.min}
            max={meta.max}
            value={features[key]}
            onChange={(e) => updateField(key, e.target.value)}
            error={errors[key]}
          />
        );
      })}
      <div className="sm:col-span-2 lg:col-span-3 flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={() => { setFeatures({ ...DEFAULT_FEATURES }); setErrors({}); }}>
          Reset
        </Button>
        <Button type="submit" loading={loading}>
          Predict Price
        </Button>
      </div>
    </form>
  );
}

// ────────────── Result Card ──────────────

function ResultCard({ result, modelInfo }: { result: { predicted_price: number; input_features: HousingFeatures }; modelInfo: ModelInfoResponse | null }) {
  const fmt = (n: number) => `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

  // Feature importance from model coefficients (use absolute value as importance proxy)
  const chartData = modelInfo?.coefficients
    ? modelInfo.coefficients
        .map((c) => ({ name: formatFeatureName(c.feature), importance: Math.abs(c.coefficient) }))
        .sort((a, b) => b.importance - a.importance)
    : [];

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Prediction value */}
      <div className="flex flex-col items-center justify-center p-6 bg-green-50 rounded-xl border border-green-200">
        <span className="text-sm text-gray-500 mb-2">Estimated Price</span>
        <span className="text-4xl font-bold text-green-700">
          {fmt(result.predicted_price)}
        </span>
        <span className="text-xs text-gray-400 mt-1">USD</span>
        {modelInfo && (
          <div className="mt-3 flex flex-wrap gap-1 justify-center">
            {modelInfo.metrics.map((m) => (
              <Badge key={m.name} variant="info">
                {m.name} = {m.value.toFixed(4)}
              </Badge>
            ))}
          </div>
        )}
      </div>
      {/* Feature importance (coefficient magnitude) */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">
          Model Coefficient Magnitudes
        </h4>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={270}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 90 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={85} />
              <Tooltip />
              <Bar dataKey="importance" fill="#059669" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-gray-400 pt-8 text-center">
            Load model-info to see coefficients
          </p>
        )}
      </div>
    </div>
  );
}

function formatFeatureName(key: string): string {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ────────────── History Tab ──────────────

function HistoryTab() {
  const { history, loading, fetchHistory } = usePredictionHistory();

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const columns: Column[] = [
    {
      key: "timestamp",
      header: "Date",
      render: (r) => new Date(String(r.timestamp)).toLocaleString(),
    },
    {
      key: "predicted_price",
      header: "Price",
      render: (r) => `$${Number(r.predicted_price).toLocaleString("en-US")}`,
    },
    { key: "square_footage", header: "Sq Ft", render: (r) => String(r.square_footage) },
    { key: "bedrooms", header: "Beds", render: (r) => String(r.bedrooms) },
    { key: "bathrooms", header: "Baths", render: (r) => String(r.bathrooms) },
    { key: "year_built", header: "Year", render: (r) => String(r.year_built) },
  ];

  if (loading) return <div className="flex justify-center py-8"><Spinner /></div>;
  if (history.length === 0) return <p className="text-gray-400 text-sm py-4">No predictions yet. Make one above!</p>;

  return (
    <DataTable
      columns={columns}
      data={history as unknown as Record<string, unknown>[]}
      keyField="id"
      pageSize={10}
    />
  );
}

// ────────────── Comparison Tab ──────────────

function ComparisonTab() {
  const { results, loading, error, predictBatch } = useBatchPredict();

  const handleCompare = useCallback(async () => {
    await predictBatch([
      { ...DEFAULT_FEATURES },
      { square_footage: 3200, bedrooms: 5, bathrooms: 3.5, year_built: 2015, lot_size: 12000, distance_to_city_center: 12, school_rating: 9.1 },
    ]);
  }, [predictBatch]);

  return (
    <div>
      <p className="text-sm text-gray-500 mb-4">
        Compare price estimates for up to 10 properties. Click below for a demo.
      </p>
      <Button onClick={handleCompare} loading={loading}>Run Comparison (2 properties)</Button>
      {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
      {results.length > 0 && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {results.map((price, i) => (
            <Card key={i} title={`Property ${i + 1}`}>
              <div className="text-center">
                <span className="text-3xl font-bold text-green-700">
                  ${price.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ────────────── Main Page ──────────────

export default function EstimatorPage() {
  const [tab, setTab] = useState<Tab>("predict");
  const { result, loading, error, predict } = usePrediction();
  const [modelInfo, setModelInfo] = useState<ModelInfoResponse | null>(null);

  // Load model info on mount
  useEffect(() => {
    task1Api.modelInfo().then(setModelInfo).catch(() => {});
  }, []);

  const tabs: { key: Tab; label: string }[] = [
    { key: "predict", label: "Prediction" },
    { key: "history", label: "History" },
    { key: "compare", label: "Comparison" },
  ];

  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Property Value Estimator</h1>
          <p className="text-gray-500 mt-1">
            Enter property details — get an instant AI-powered price estimate
          </p>
        </div>

        {/* Quick info */}
        {modelInfo && (
          <div className="flex flex-wrap gap-2">
            <Badge variant="info">{modelInfo.model_type}</Badge>
            {modelInfo.metrics.map((m) => (
              <Badge key={m.name} variant="default">
                {m.name}: {m.value.toFixed(4)}
              </Badge>
            ))}
            <Badge variant="default">{modelInfo.training_samples} samples</Badge>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-200">
          {tabs.map((t) => (
            <button
              type="button"
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === t.key ? "border-blue-600 text-blue-700" : "border-transparent text-gray-500 hover:text-gray-700"}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === "predict" && (
          <div className="grid gap-6 lg:grid-cols-2">
            <Card title="Property Details">
              <PredictForm onPredict={predict} loading={loading} />
            </Card>
            <Card title="Results">
              {loading && <div className="flex justify-center py-12"><Spinner size="lg" /></div>}
              {error && <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}
              {!loading && !error && !result && (
                <div className="text-center py-12 text-gray-400">
                  <div className="text-4xl mb-3">🏠</div>
                  <p>Fill in the form and click Predict Price</p>
                </div>
              )}
              {result && <ResultCard result={result} modelInfo={modelInfo} />}
            </Card>
          </div>
        )}

        {tab === "history" && (
          <Card title="Prediction History"><HistoryTab /></Card>
        )}

        {tab === "compare" && (
          <Card title="Compare Properties"><ComparisonTab /></Card>
        )}
      </div>
    </AppLayout>
  );
}
