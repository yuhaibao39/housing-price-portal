import AppLayout from "@/components/layout/AppLayout";
import Link from "next/link";

export default function HomePage() {
  return (
    <AppLayout>
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
            California Housing Price Portal
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-blue-100">
            A unified platform for estimating property values and analyzing
            housing market trends, powered by machine learning.
          </p>
        </div>
      </section>

      {/* App Cards */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 -mt-10 pb-16">
        <div className="grid gap-8 md:grid-cols-2">
          {/* App 1: Estimator */}
          <Link
            href="/estimator"
            className="group rounded-xl bg-white border border-gray-200 shadow-lg p-8 hover:shadow-xl hover:border-blue-300 transition-all"
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-700 text-xl">
                🏠
              </span>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Property Value Estimator
                </h2>
                <span className="text-xs text-gray-400">Python FastAPI</span>
              </div>
            </div>
            <p className="text-gray-600 mb-4">
              Get instant property value estimates using our machine learning
              model. Input property details, compare multiple properties, and
              track your estimation history.
            </p>
            <ul className="space-y-1 text-sm text-gray-500">
              <li>✓ Single &amp; batch predictions</li>
              <li>✓ Interactive charts &amp; tables</li>
              <li>✓ Prediction history</li>
              <li>✓ Side-by-side comparison</li>
            </ul>
            <span className="inline-block mt-4 text-blue-600 font-medium text-sm group-hover:underline">
              Open Estimator →
            </span>
          </Link>

          {/* App 2: Market Analysis */}
          <Link
            href="/market-analysis"
            className="group rounded-xl bg-white border border-gray-200 shadow-lg p-8 hover:shadow-xl hover:border-emerald-300 transition-all"
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 text-xl">
                📊
              </span>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Property Market Analysis
                </h2>
                <span className="text-xs text-gray-400">
                  Java Spring Boot
                </span>
              </div>
            </div>
            <p className="text-gray-600 mb-4">
              Explore market trends, analyze property segments, and run what-if
              scenarios. Export data in CSV or PDF formats for reporting.
            </p>
            <ul className="space-y-1 text-sm text-gray-500">
              <li>✓ Interactive dashboards</li>
              <li>✓ Market trend visualizations</li>
              <li>✓ What-if analysis tool</li>
              <li>✓ CSV &amp; PDF export</li>
            </ul>
            <span className="inline-block mt-4 text-emerald-600 font-medium text-sm group-hover:underline">
              Open Dashboard →
            </span>
          </Link>
        </div>

        {/* Quick Stats */}
        <div className="mt-12 grid gap-6 sm:grid-cols-4">
          {[
            { label: "Model Type", value: "Random Forest" },
            { label: "Features", value: "8" },
            { label: "R² Score", value: "~0.85" },
            { label: "Training Data", value: "20k+ records" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-lg border border-gray-200 bg-white p-4 text-center"
            >
              <p className="text-sm text-gray-500">{stat.label}</p>
              <p className="text-xl font-semibold text-gray-900">
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      </section>
    </AppLayout>
  );
}
