"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface Metrics {
  totalUsers: number;
  completedSignup: number;
  completedDNA: number;
  generatedDirection: number;
  retained: number;
  monthlySignups: { month: string; count: number }[];
}

interface Revenue {
  mrr: number;
  activeSubscribers: number;
  monthlyRevenue: { month: string; revenue: number }[];
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">{label}</p>
      <p className="text-3xl font-semibold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

function pct(part: number, total: number) {
  if (!total) return "—";
  return `${Math.round((part / total) * 100)}% of total`;
}

export function ReportsDashboard() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [revenue, setRevenue] = useState<Revenue | null>(null);
  const [metricsErr, setMetricsErr] = useState(false);
  const [revenueErr, setRevenueErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/metrics")
        .then((r) => r.json())
        .then((d) => (d.error ? setMetricsErr(true) : setMetrics(d)))
        .catch(() => setMetricsErr(true)),
      fetch("/api/admin/revenue")
        .then((r) => r.json())
        .then((d) =>
          d.error ? setRevenueErr(d.error) : setRevenue(d)
        )
        .catch(() => setRevenueErr("Failed to load")),
    ]).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">Reports</h1>
        <p className="text-sm text-gray-500">Live metrics from Firestore and Stripe.</p>
      </div>

      {/* User funnel */}
      <section>
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">User Funnel</h2>
        {metricsErr ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-sm text-red-600">
            Could not load metrics. Make sure Firebase Admin env vars are set.
          </div>
        ) : metrics ? (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <StatCard label="Total Users" value={metrics.totalUsers} />
            <StatCard
              label="Completed Sign-up"
              value={metrics.completedSignup}
              sub={pct(metrics.completedSignup, metrics.totalUsers)}
            />
            <StatCard
              label="Completed DNA"
              value={metrics.completedDNA}
              sub={pct(metrics.completedDNA, metrics.totalUsers)}
            />
            <StatCard
              label="Generated Direction"
              value={metrics.generatedDirection}
              sub={pct(metrics.generatedDirection, metrics.totalUsers)}
            />
            <StatCard
              label="Retained (>1 day)"
              value={metrics.retained}
              sub={pct(metrics.retained, metrics.totalUsers)}
            />
          </div>
        ) : null}
      </section>

      {/* Monthly signups chart */}
      {metrics && (
        <section>
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Monthly Sign-ups</h2>
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={metrics.monthlySignups} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
                  cursor={{ fill: "#f3f4f6" }}
                />
                <Bar dataKey="count" fill="#111" radius={[4, 4, 0, 0]} name="Sign-ups" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* Revenue */}
      <section>
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Revenue</h2>
        {revenueErr ? (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-sm text-amber-700">
            {revenueErr === "STRIPE_SECRET_KEY not configured"
              ? "Add STRIPE_SECRET_KEY to your environment variables to enable revenue metrics."
              : `Could not load revenue: ${revenueErr}`}
          </div>
        ) : revenue ? (
          <>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <StatCard
                label="MRR"
                value={`$${revenue.mrr.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
                sub="Monthly recurring revenue"
              />
              <StatCard
                label="Active Subscribers"
                value={revenue.activeSubscribers}
                sub="Stripe active subscriptions"
              />
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={revenue.monthlyRevenue} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
                    cursor={{ fill: "#f3f4f6" }}
                    formatter={(v: number) => [`$${v.toLocaleString()}`, "Revenue"]}
                  />
                  <Bar dataKey="revenue" fill="#111" radius={[4, 4, 0, 0]} name="Revenue" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        ) : null}
      </section>
    </div>
  );
}
