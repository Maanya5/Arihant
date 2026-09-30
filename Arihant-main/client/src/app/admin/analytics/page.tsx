"use client";

import { useEffect, useState } from "react";
import { BarChart3, TrendingUp, IndianRupee, Users } from "lucide-react";
import api from "@/lib/api";

const fmt = (n: number) => `₹${(n / 100).toLocaleString("en-IN")}`;

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/admin/analytics").then(r => { setData(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="h-10 bg-[#C8D9E6] animate-shimmer w-1/4 mb-10" />
      <div className="h-64 bg-[#C8D9E6] animate-shimmer mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="h-96 bg-[#C8D9E6] animate-shimmer" />
        <div className="h-96 bg-[#C8D9E6] animate-shimmer" />
      </div>
    </div>
  );

  if (!data) return <div className="p-8 text-[var(--color-ink)]">Failed to load analytics.</div>;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <span className="section-eyebrow">Insights</span>
      <h1 className="text-4xl font-display font-bold text-[var(--color-ink)] mt-2 mb-10">Analytics</h1>

      {/* High-level summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
        {[
          { label: "Total Revenue", val: fmt(data.revenueData.reduce((s:any, d:any) => s + d.totalRevenue, 0)), icon: IndianRupee },
          { label: "Avg Order Value", val: fmt(data.revenueData.length ? data.revenueData.reduce((s:any, d:any) => s + (d.totalRevenue/d.orderCount), 0) / data.revenueData.length : 0), icon: TrendingUp },
          { label: "Total Orders (Last 30d)", val: data.revenueData.reduce((s:any, d:any) => s + d.orderCount, 0), icon: Users }
        ].map((s, i) => (
          <div key={i} className="border border-[var(--color-navy)]/10 bg-white p-6 flex items-center gap-4">
            <div className="p-3 bg-[var(--color-navy)]/5 text-[var(--color-ink)]"><s.icon size={24} /></div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-ink-muted)] mb-1">{s.label}</p>
              <p className="text-2xl font-display font-bold text-[var(--color-ink)]">{s.val}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Products */}
        <div className="border border-[var(--color-navy)]/10 bg-white p-6">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 size={18} className="text-[var(--color-ink)]" />
            <h2 className="text-lg font-display font-bold text-[var(--color-ink)]">Top Selling Products</h2>
          </div>
          <div className="space-y-4">
            {data.topItems.map((item: any, i: number) => (
              <div key={item._id} className="flex items-center justify-between border-b border-[var(--color-navy)]/5 pb-3 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-[var(--color-ink-muted)] font-mono text-xs w-4">{i + 1}.</span>
                  <p className="text-xs font-bold text-[var(--color-ink)]">{item.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-[var(--color-teal)]">{item.totalSold} sold</p>
                  <p className="text-[9px] text-[var(--color-ink-muted)]">{fmt(item.revenue)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* School Performance */}
        <div className="border border-[var(--color-navy)]/10 bg-white p-6">
          <h2 className="text-lg font-display font-bold text-[var(--color-ink)] mb-6">Revenue by School</h2>
          <div className="space-y-4">
            {data.schoolMetrics.map((school: any) => (
              <div key={school._id} className="mb-4">
                <div className="flex justify-between items-center mb-1">
                  <p className="text-xs font-bold text-[var(--color-ink)]">{school.name}</p>
                  <p className="text-xs font-bold text-[var(--color-ink)]">{fmt(school.revenue)}</p>
                </div>
                <div className="w-full bg-[var(--color-navy)]/5 h-2">
                  <div className="bg-[var(--color-teal)] h-2" style={{ width: `${Math.min(100, (school.revenue / (data.schoolMetrics[0]?.revenue || 1)) * 100)}%` }} />
                </div>
                <p className="text-[9px] text-[var(--color-ink-muted)] mt-1 text-right">{school.orders} orders</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
