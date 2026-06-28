"use client";

import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Spinner from "@/components/ui/Spinner";
import Badge from "@/components/ui/Badge";
import { useMarketStatistics, useTrends, useWhatIf } from "@/hooks/useMarketData";
import { javaApi } from "@/lib/api";
import {
  DEFAULT_FEATURES,
  FEATURE_META,
  type HousingFeatures,
} from "@/lib/types";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// ── Stat Card ──
function StatCard({ label, value, color = "blue" }: { label: string; value: string; color?: "blue" | "green" | "amber" | "purple" }) {
  const border = { blue: "border-l-blue-500", green: "border-l-green-500", amber: "border-l-amber-500", purple: "border-l-purple-500" }[color];
  return (
    <div className={`bg-white rounded-lg border border-gray-200 border-l-4 ${border} p-4`}>
      <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-xl font-bold text-gray-900 mt-1">{value}</p>
    </div>
  );
}

// ── What-If Panel ──
function WhatIfPanel() {
  const { result, loading, error, analyze } = useWhatIf();
  const [changeKey, setChangeKey] = useState<keyof HousingFeatures>("square_footage");
  const [changeValue, setChangeValue] = useState("3000");

  const handleRun = () => {
    analyze({
      baseFeatures: { ...DEFAULT_FEATURES },
      whatIfChanges: { [changeKey]: parseFloat(changeValue) || 0 },
    });
  };

  const fmt = (n: number) => `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

  return (
    <Card title="What-If Analysis" className="h-full">
      <p className="text-sm text-gray-500 mb-4">
        Change a feature to see how the predicted price shifts.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Feature</label>
          <select
            value={changeKey}
            onChange={(e) => setChangeKey(e.target.value as keyof HousingFeatures)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white"
            title="Select a feature to change"
          >
            {(Object.keys(FEATURE_META) as (keyof HousingFeatures)[]).map((k) => (
              <option key={k} value={k}>{FEATURE_META[k].label}</option>
            ))}
          </select>
        </div>
        <Input label="New Value" type="number" step={FEATURE_META[changeKey].step} value={changeValue} onChange={(e) => setChangeValue(e.target.value)} />
      </div>
      <Button onClick={handleRun} loading={loading} className="mt-3 w-full">Run Analysis</Button>

      {error && <p className="text-red-500 text-sm mt-3">{error}</p>}

      {result && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-xs text-gray-500">Baseline</p>
              <p className="text-xl font-bold text-blue-700">{fmt(result.baseline.predicted_price)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Modified</p>
              <p className="text-xl font-bold text-green-700">{fmt(result.modified.predicted_price)}</p>
            </div>
          </div>
          <div className="mt-3 text-center">
            <Badge variant={
              Math.abs(result.percentageChange) < 5 ? "default" : result.percentageChange > 0 ? "success" : "danger"
            }>
              {result.percentageChange >= 0 ? "+" : ""}{result.percentageChange.toFixed(1)}%
            </Badge>
          </div>
        </div>
      )}
    </Card>
  );
}

// ── Market Overview ──
function MarketOverview() {
  const { data, loading, error, refetch } = useMarketStatistics();

  if (loading) return <div className="flex justify-center py-8"><Spinner /></div>;
  if (error) return <div className="text-center py-8"><p className="text-red-500 text-sm mb-3">{error}</p><Button variant="outline" onClick={refetch}>Retry</Button></div>;
  if (!data) return null;

  const fmt = (n: number) => `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Properties" value={data.totalProperties.toLocaleString()} color="blue" />
        <StatCard label="Avg Price" value={fmt(data.avgPrice)} color="green" />
        <StatCard label="Median Price" value={fmt(data.medianPrice)} color="amber" />
        <StatCard label="Std Deviation" value={fmt(data.stdDevPrice)} color="purple" />
      </div>

      {data.featureCorrelations && (
        <Card title="Feature Correlations with Price">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={Object.entries(data.featureCorrelations).map(([name, val]) => ({
                name: name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
                correlation: val,
              }))}
              layout="vertical"
              margin={{ left: 100 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[-1, 1]} tick={{ fontSize: 11 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={95} />
              <Tooltip />
              <Bar dataKey="correlation" fill="#059669" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}
    </>
  );
}

// ── Trends Charts ──
function TrendsCharts() {
  const { data, loading, error } = useTrends();

  if (loading) return <div className="flex justify-center py-8"><Spinner /></div>;
  if (error) return <p className="text-red-500 text-sm">{error}</p>;
  if (!data) return null;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card title="Price by Segment">
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data.priceByIncome}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="value" fill="#2563eb" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card title="Price Trend">
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data.priceByAge}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#d97706" strokeWidth={2} dot={{ fill: "#d97706" }} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <Card title="Price by Region" className="lg:col-span-2">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.priceByRegion}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="category" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="value" fill="#7c3aed" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}

// ── Main Page ──
export default function MarketAnalysisPage() {
  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Property Market Analysis</h1>
            <p className="text-gray-500 mt-1">Visualize market trends, explore segments, and run what-if scenarios</p>
          </div>
          <div className="flex items-center gap-2">
            <a href={javaApi.exportCsv()} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm">Export CSV</Button>
            </a>
            <a href={javaApi.exportPdf()} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm">Export PDF</Button>
            </a>
          </div>
        </div>

        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Market Overview</h2>
          <MarketOverview />
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Trends &amp; Visualizations</h2>
          <TrendsCharts />
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1"><WhatIfPanel /></div>
          <div className="lg:col-span-2">
            <Card title="Export &amp; Reports">
              <p className="text-sm text-gray-500 mb-3">
                Download market data in CSV or PDF format for offline analysis.
              </p>
              <div className="flex gap-3">
                <a href={javaApi.exportCsv()} target="_blank" rel="noopener noreferrer">
                  <Button variant="primary">Download CSV</Button>
                </a>
                <a href={javaApi.exportPdf()} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline">Download PDF</Button>
                </a>
              </div>
            </Card>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
