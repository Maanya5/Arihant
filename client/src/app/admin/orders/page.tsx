"use client";

import { useEffect, useState } from "react";
import { Search, ChevronDown, CheckCircle, Package, Truck, Calendar, ArrowRight } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-[var(--color-sky)]/10 text-[var(--color-teal)] border-[var(--color-border)]/20",
  processing: "bg-[var(--color-teal)]/10 text-[var(--color-teal)] border-[var(--color-teal)]/20",
  confirmed: "bg-[var(--color-teal)]/10 text-[var(--color-teal)] border-[var(--color-teal)]/20",
  packed: "bg-[var(--color-teal)]/10 text-[var(--color-teal)] border-[var(--color-teal)]/20",
  shipped: "bg-[var(--color-teal)]/10 text-[var(--color-teal)] border-[var(--color-teal)]/20",
  "out-for-delivery": "bg-[var(--color-teal)]/10 text-[var(--color-teal)] border-[var(--color-teal)]/20",
  delivered: "bg-green-100 text-green-700 border-green-200",
  cancelled: "bg-red-100 text-red-600 border-red-200",
  returned: "bg-red-100 text-red-600 border-red-200",
};

export default function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const fetchOrders = async () => {
    try {
      const { data } = await api.get("/admin/orders");
      setOrders(Array.isArray(data) ? data : data.orders || data.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchOrders(); }, []);

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      await api.patch(`/admin/orders/${orderId}`, { orderStatus: newStatus });
      setOrders(orders.map(o => o._id === orderId ? { ...o, orderStatus: newStatus } : o));
    } catch (err) { alert("Failed to update status."); }
  };

  const filtered = orders.filter(o => 
    (statusFilter ? o.orderStatus === statusFilter : true) &&
    (search ? (
      o._id.toLowerCase().includes(search.toLowerCase()) || 
      (o.shippingAddress?.fullName || "").toLowerCase().includes(search.toLowerCase())
    ) : true)
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <span className="section-eyebrow">Fulfillment</span>
      <h1 className="text-4xl font-display font-bold text-[var(--color-ink)] mt-2 mb-10">Manage Orders</h1>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
        <div className="relative w-full sm:w-96">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-muted)]" />
          <input 
            type="text" placeholder="Search by Order ID or Customer Name" 
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-[var(--color-navy)]/20 text-xs bg-transparent focus:outline-none focus:border-[var(--color-navy)]"
            style={{ borderRadius: 0 }}
          />
        </div>
        <select 
          value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="w-full sm:w-48 border border-[var(--color-navy)]/20 py-3 px-4 text-xs bg-transparent focus:outline-none focus:border-[var(--color-navy)]"
          style={{ borderRadius: 0 }}
        >
          <option value="">All Statuses</option>
          {Object.keys(STATUS_COLORS).map(s => (
            <option key={s} value={s}>{s.replace(/-/g, " ").toUpperCase()}</option>
          ))}
        </select>
      </div>

      <div className="border border-[var(--color-navy)]/10 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead>
              <tr className="bg-[var(--color-navy)]/5 border-b border-[var(--color-navy)]/10">
                <th className="py-4 px-6 font-bold text-[var(--color-ink)]">Order Details</th>
                <th className="py-4 px-6 font-bold text-[var(--color-ink)]">Customer</th>
                <th className="py-4 px-6 font-bold text-[var(--color-ink)]">Total</th>
                <th className="py-4 px-6 font-bold text-[var(--color-ink)]">Status</th>
                <th className="py-4 px-6 font-bold text-[var(--color-ink)] text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="p-4"><div className="space-y-4">{[...Array(5)].map((_,i) => <div key={i} className="h-12 bg-[#C8D9E6] animate-shimmer" />)}</div></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="py-12 text-center text-[var(--color-ink-muted)]">No orders found.</td></tr>
              ) : filtered.map(o => (
                <tr key={o._id} className="border-b border-[var(--color-navy)]/5 hover:bg-[var(--color-navy)]/3 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono font-bold text-[var(--color-ink)]">#{String(o._id).slice(-8).toUpperCase()}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[9px] text-[var(--color-ink-muted)]">
                      <Calendar size={10} /> {new Date(o.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <p className="font-bold text-[var(--color-ink)]">{o.shippingAddress?.fullName || "Unknown"}</p>
                    <p className="text-[10px] text-[var(--color-ink-muted)] mt-0.5 truncate max-w-[150px]">{o.shippingAddress?.city}, {o.shippingAddress?.state}</p>
                  </td>
                  <td className="py-4 px-6">
                    <p className="font-bold text-[var(--color-ink)]">₹{(o.totalAmount / 100).toLocaleString("en-IN")}</p>
                    <p className="text-[9px] uppercase text-[var(--color-ink-muted)]">{o.paymentMethod || "online"}</p>
                  </td>
                  <td className="py-4 px-6">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={o.orderStatus}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.05 }}
                        transition={{ duration: 0.2 }}
                      >
                        <select
                          value={o.orderStatus}
                          onChange={(e) => handleStatusUpdate(o._id, e.target.value)}
                          className={`text-[9px] font-bold uppercase tracking-widest px-2 py-1 border focus:outline-none cursor-pointer ${STATUS_COLORS[o.orderStatus] || "border-[var(--color-navy)]/10"}`}
                          style={{ borderRadius: 0 }}
                        >
                          {Object.keys(STATUS_COLORS).map(s => (
                            <option key={s} value={s} className="bg-white text-[var(--color-ink)]">{s.replace(/-/g, " ")}</option>
                          ))}
                        </select>
                      </motion.div>
                    </AnimatePresence>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <Link href={`/admin/orders/${o._id}`} className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-teal)] hover:text-[var(--color-ink)] transition-colors flex items-center justify-end gap-1">
                      View <ArrowRight size={12} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
