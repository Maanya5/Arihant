"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { TrendingUp, ShoppingCart, Package, AlertTriangle, ArrowRight } from "lucide-react";
import api from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";

function useCountUp(target: number, duration = 800) {
  const [value, setValue] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (hasAnimated || target === 0) return;
    let startTimestamp: number;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setValue(Math.floor(ease * target));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setHasAnimated(true);
        setValue(target);
      }
    };
    window.requestAnimationFrame(step);
  }, [target, duration, hasAnimated]);
  return { ref, value };
}

const staggerContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

const fadeInUp = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } }
};

function KpiCard({ title, target, prefix = "", icon: Icon, bg, text, link, borderCol }: any) {
  const { ref, value } = useCountUp(target);

  return (
    <motion.div variants={fadeInUp}>
      <Link href={link} className="block border border-[var(--color-navy)]/10 bg-white p-6 transition-colors group hover:shadow-sm" style={{ borderLeft: `4px solid ${borderCol}` }}>
        <div className="flex justify-between items-start mb-6">
          <div className={`p-3 ${bg} ${text}`}><Icon size={24} /></div>
          <ArrowRight size={16} className="text-[var(--color-ink)]/20 group-hover:text-[var(--color-ink)] transition-colors" />
        </div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-ink-muted)] mb-1">{title}</p>
        <p className="text-3xl font-display font-bold text-[var(--color-ink)]" ref={ref}>
          {prefix}{value.toLocaleString('en-IN')}
        </p>
      </Link>
    </motion.div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalOrders: 0, totalRevenuePaisa: 0, productsCount: 0, lowStock: 0, pendingOrders: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get("/admin/stats");
        setStats(res.data);
      } catch (err) { console.error("Error fetching stats:", err); }
      finally { setLoading(false); }
    };
    fetchStats();
  }, []);

  const cards = [
    { title: "Total Revenue", target: Math.floor(stats.totalRevenuePaisa / 100), prefix: "₹", icon: TrendingUp, bg: "bg-[var(--color-teal)]/10", text: "text-[var(--color-teal)]", link: "/admin/analytics", borderCol: "#567C8D" },
    { title: "Total Orders", target: stats.totalOrders, prefix: "", icon: ShoppingCart, bg: "bg-[var(--color-teal)]/10", text: "text-[var(--color-teal)]", link: "/admin/orders", borderCol: "#567C8D" },
    { title: "Pending Orders", target: stats.pendingOrders, prefix: "", icon: Package, bg: "bg-[var(--color-sky)]/10", text: "text-[var(--color-teal)]", link: "/admin/orders?status=pending", borderCol: "#567C8D" },
    { title: "Low Stock Alerts", target: stats.lowStock, prefix: "", icon: AlertTriangle, bg: "bg-red-100", text: "text-red-600", link: "/admin/inventory?filter=low", borderCol: "#C8D9E6" },
  ];

  if (loading) return (
    <div className="p-8 space-y-6">
      <div className="h-10 bg-[#C8D9E6] animate-shimmer w-1/4 mb-10" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-[#C8D9E6] animate-shimmer" />)}
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <span className="section-eyebrow">Overview</span>
      <h1 className="text-4xl font-display font-bold text-[var(--color-ink)] mt-2 mb-10">Dashboard</h1>

      {/* KPI Cards */}
      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {cards.map((c, i) => (
          <KpiCard key={i} {...c} />
        ))}
      </motion.div>

      {/* Action Prompts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="border border-[var(--color-navy)]/10 bg-white p-8">
          <h2 className="text-2xl font-display font-bold text-[var(--color-ink)] mb-6 flex justify-between items-center">
            Pending Orders
            {stats.pendingOrders > 0 && <span className="bg-[var(--color-sky)] text-white px-3 py-1 text-[10px] font-bold uppercase tracking-widest">{stats.pendingOrders} New</span>}
          </h2>
          <p className="text-sm text-[var(--color-ink-muted)] mb-6">
            {stats.pendingOrders > 0
              ? `You have ${stats.pendingOrders} orders waiting to be processed and shipped.`
              : "All caught up! No pending orders at the moment."}
          </p>
          <Link href="/admin/orders" className="btn-primary w-full sm:w-auto inline-flex">Go to Orders</Link>
        </div>

        <div className="border border-[var(--color-navy)]/10 bg-white p-8">
           <h2 className="text-2xl font-display font-bold text-[var(--color-ink)] mb-6 flex items-center">
             Inventory Status
             {stats.lowStock > 0 && <span className="ml-3 low-stock-dot" />}
           </h2>
           <p className="text-sm text-[var(--color-ink-muted)] mb-6">
            {stats.lowStock > 0
              ? `Attention: ${stats.lowStock} products are running low on stock. Please restock soon.`
              : "Inventory levels are healthy. No items are currently low on stock."}
           </p>
           <Link href="/admin/inventory" className="btn-secondary w-full sm:w-auto inline-flex">Manage Inventory</Link>
        </div>
      </div>
    </div>
  );
}
