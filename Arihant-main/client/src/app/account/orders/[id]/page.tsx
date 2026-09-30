"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Check, Circle, ChevronLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import api from "@/lib/api";

const fmt = (n: number) => `₹${(n / 100).toLocaleString("en-IN")}`;
const STATUS_STEPS = ["confirmed", "packed", "shipped", "out-for-delivery", "delivered"];

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-[var(--color-sky)]/10 text-[var(--color-teal)] border-[var(--color-border)]/20",
  processing: "bg-[var(--color-teal)]/10 text-[var(--color-teal)] border-[var(--color-teal)]/20",
  confirmed: "bg-[var(--color-teal)]/10 text-[var(--color-teal)] border-[var(--color-teal)]/20",
  shipped: "bg-[var(--color-teal)]/10 text-[var(--color-teal)] border-[var(--color-teal)]/20",
  delivered: "bg-green-100 text-green-700 border-green-200",
  cancelled: "bg-red-100 text-red-600 border-red-200",
  returned: "bg-red-100 text-red-600 border-red-200",
};

function TrackingTimeline({ tracking, orderStatus }: { tracking: any[]; orderStatus: string }) {
  const activeStep = STATUS_STEPS.indexOf(orderStatus);

  return (
    <div className="border border-[var(--color-navy)]/10 p-6 mb-6">
      <h3 className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-ink)] mb-6">Tracking</h3>

      {/* Visual stepper */}
      <div className="flex items-start mb-8 overflow-x-auto pb-2">
        {STATUS_STEPS.map((s, i) => {
          const done    = i <= activeStep;
          const current = i === activeStep;
          return (
            <div key={s} className="flex items-center flex-shrink-0">
              <div className="flex flex-col items-center text-center w-20">
                <div className={`w-7 h-7 flex items-center justify-center border transition-all ${done ? "bg-[var(--color-teal)] border-[var(--color-teal)] text-white" : "border-[var(--color-navy)]/20 text-[var(--color-ink-muted)]"}`}>
                  {done ? <Check size={12} /> : <Circle size={10} />}
                </div>
                <span className={`text-[8px] uppercase tracking-widest mt-1.5 font-bold leading-tight ${current ? "text-[var(--color-ink)]" : "text-[var(--color-ink-muted)]"}`}>
                  {s.replace("-", " ")}
                </span>
              </div>
              {i < STATUS_STEPS.length - 1 && (
                <div className={`flex-1 h-px mx-1 min-w-4 ${i < activeStep ? "bg-[var(--color-teal)]" : "bg-[var(--color-navy)]/10"}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Tracking events log */}
      {tracking.length > 0 && (
        <div className="space-y-3">
          <p className="text-[9px] uppercase tracking-widest text-[var(--color-ink-muted)] mb-3">Event Log</p>
          {[...tracking].reverse().map((t: any, i) => (
            <div key={i} className="flex gap-3 text-xs">
              <div className="w-1 bg-[var(--color-teal)]/20 flex-shrink-0 mt-1" />
              <div>
                <p className="font-bold text-[var(--color-ink)] capitalize">{t.status.replace(/-/g, " ")}</p>
                {t.note && <p className="text-[var(--color-ink-muted)] text-[10px]">{t.note}</p>}
                <p className="text-[var(--color-ink-muted)] text-[9px] mt-0.5">
                  {new Date(t.timestamp).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder]   = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/orders/${id}`).then(r => { setOrder(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg)]"><Navbar />
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-4">
        {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-[#C8D9E6] animate-shimmer" />)}
      </div>
    </div>
  );

  if (!order) return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg)]"><Navbar />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="font-display text-2xl font-bold text-[var(--color-ink)] mb-4">Order not found.</p>
          <Link href="/account" className="btn-primary">Back to Account</Link>
        </div>
      </div>
      <Footer />
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg)]">
      <Navbar />
      <main className="flex-grow pb-20 md:pb-0">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
          <Link href="/account" className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] mb-6 transition-colors">
            <ChevronLeft size={12} /> Back to Orders
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-3">
            <div>
              <span className="section-eyebrow">Order Details</span>
              <h1 className="text-3xl font-display font-bold text-[var(--color-ink)] mt-1">
                #{String(order._id).slice(-8).toUpperCase()}
              </h1>
              <p className="text-[9px] text-[var(--color-ink-muted)] mt-1">
                {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
            <span className={`text-[9px] font-bold uppercase px-3 py-1.5 border self-start sm:self-auto ${STATUS_COLORS[order.orderStatus] || "border-[var(--color-navy)]/10 bg-[var(--color-navy)]/5 text-[var(--color-ink)]"}`}>
              {order.orderStatus}
            </span>
          </div>

          {/* Tracking timeline */}
          {order.tracking && <TrackingTimeline tracking={order.tracking} orderStatus={order.orderStatus} />}

          {/* Items */}
          <div className="border border-[var(--color-navy)]/10 p-5 mb-5">
            <p className="text-[9px] uppercase tracking-widest text-[var(--color-ink-muted)] mb-4">Items Ordered</p>
            <div className="space-y-4">
              {(order.items || []).map((item: any, i: number) => (
                <div key={i} className="flex gap-3 pb-4 border-b border-[var(--color-navy)]/5 last:border-0 last:pb-0">
                  <div className="w-14 h-14 flex-shrink-0 border border-[var(--color-navy)]/10 overflow-hidden bg-white relative">
                    {item.imageUrl ? <Image src={item.imageUrl || '/fallback-product.jpg'} alt={item.itemName} fill sizes="56px" className="object-cover" loading="lazy" /> : <div className="w-full h-full bg-white" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-[var(--color-ink)]">{item.itemName}</p>
                    {item.schoolName && <p className="text-[9px] text-[var(--color-ink-muted)]">{item.schoolName} · {item.standardName}</p>}
                    <p className="text-[9px] text-[var(--color-ink-muted)] mt-0.5">Size: {item.size} · Qty: {item.quantity}</p>
                  </div>
                  <span className="text-xs font-bold text-[var(--color-ink)]">{fmt(item.price_paisa * item.quantity)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery Address */}
          {order.shippingAddress && (
            <div className="border border-[var(--color-navy)]/10 p-5 mb-5">
              <p className="text-[9px] uppercase tracking-widest text-[var(--color-ink-muted)] mb-3">Delivery Address</p>
              <p className="text-xs font-bold text-[var(--color-ink)]">{order.shippingAddress.fullName}</p>
              <p className="text-[10px] text-[var(--color-ink-muted)] mt-1 leading-relaxed">
                {order.shippingAddress.street}, {order.shippingAddress.city}, {order.shippingAddress.state} — {order.shippingAddress.pincode}
              </p>
            </div>
          )}

          {/* Order Summary */}
          <div className="border border-[var(--color-navy)]/10 p-5">
            <p className="text-[9px] uppercase tracking-widest text-[var(--color-ink-muted)] mb-4">Order Summary</p>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between"><span className="text-[var(--color-ink-muted)]">Payment Status</span>
                <span className={`font-bold ${order.paymentStatus === "paid" ? "text-[var(--color-teal)]" : "text-[var(--color-ink-muted)]"}`}>{order.paymentStatus}</span>
              </div>
              {order.razorpay_payment_id && (
                <div className="flex justify-between"><span className="text-[var(--color-ink-muted)]">Payment ID</span><span className="font-mono text-[var(--color-ink)] text-[9px]">{order.razorpay_payment_id}</span></div>
              )}
              <div className="flex justify-between border-t border-[var(--color-navy)]/5 pt-3 mt-2">
                <span className="font-bold text-[var(--color-ink)]">Total</span>
                <span className="font-display text-base font-bold text-[var(--color-ink)]">{fmt(order.totalAmount)}</span>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
