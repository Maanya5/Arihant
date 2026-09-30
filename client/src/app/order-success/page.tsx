"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Copy, Check, Package } from "lucide-react";
import Navbar from "@/components/Navbar";

function Confetti() {
  const [particles, setParticles] = useState<any[]>([]);
  
  useEffect(() => {
    const colors = ["#567C8D", "#C8D9E6", "#567C8D", "#567C8D"];
    const p = Array.from({ length: 25 }).map((_, i) => ({
      id: i,
      color: colors[Math.floor(Math.random() * colors.length)],
      left: 45 + Math.random() * 10 + "%",
      delay: Math.random() * 0.2 + "s",
      tx: (Math.random() - 0.5) * 300 + "px",
      shape: Math.random() > 0.5 ? "50%" : "0px", // Circles or squares
    }));
    setParticles(p);
    const t = setTimeout(() => setParticles([]), 3000);
    return () => clearTimeout(t);
  }, []);

  if (particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      <style>{`
        @keyframes confetti {
          0% { transform: translate(0, 0) rotate(0deg); opacity: 1; }
          100% { transform: translate(var(--tx), 400px) rotate(720deg); opacity: 0; }
        }
      `}</style>
      {particles.map(p => (
        <div key={p.id} className="absolute top-[25%]" style={{
          left: p.left, width: 8, height: 8, backgroundColor: p.color, borderRadius: p.shape,
          animation: `confetti 2s cubic-bezier(0.25, 1, 0.5, 1) forwards`,
          animationDelay: p.delay,
          '--tx': p.tx
        } as any} />
      ))}
    </div>
  );
}

const TIMELINE = ["Confirmed", "Packed", "Shipped", "Delivered"];

function OrderTimeline() {
  return (
    <motion.div variants={{ show: { transition: { staggerChildren: 0.1 } } }} initial="hidden" animate="show" className="flex items-center justify-between max-w-sm mx-auto mb-10 relative">
      <div className="absolute left-6 right-6 top-3 h-px bg-[var(--color-navy)]/10 -z-10" />
      {TIMELINE.map((step, i) => (
        <motion.div key={step} variants={{ hidden: { opacity: 0, scale: 0.8 }, show: { opacity: 1, scale: 1, transition: { type: "spring" } } }} className="flex flex-col items-center gap-2 bg-[var(--color-bg)] px-2">
          <div className={`relative w-6 h-6 flex items-center justify-center border transition-colors duration-500 ${i === 0 ? "bg-[#567C8D] border-[#567C8D] text-white" : "bg-white border-[var(--color-navy)]/20 text-[var(--color-ink)]/20"}`} style={{ borderRadius: 0 }}>
            {i === 0 && (
              <motion.div className="absolute inset-0 border border-[#567C8D]" style={{ borderRadius: 0 }} animate={{ scale: [1, 1.6], opacity: [0.6, 0] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }} />
            )}
            <Check size={10} strokeWidth={4} className={i === 0 ? "opacity-100" : "opacity-0"} />
          </div>
          <span className={`text-[8px] uppercase tracking-widest font-bold ${i === 0 ? "text-[var(--color-ink)]" : "text-[var(--color-ink-muted)]"}`}>{step}</span>
        </motion.div>
      ))}
    </motion.div>
  );
}

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId") || "";
  const [copied, setCopied] = useState(false);

  const copyId = () => {
    navigator.clipboard.writeText(orderId).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
  };

  return (
    <motion.div 
      initial="hidden" 
      animate="show" 
      variants={{ show: { transition: { staggerChildren: 0.1, delayChildren: 0.4 } } }}
      className="max-w-lg mx-auto px-4 py-20 text-center relative z-10"
    >
      <Confetti />
      
      {/* Celebration Checkmark */}
      <div className="flex items-center justify-center mb-8">
        <motion.div
          initial={{ scale: 0, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
          className="w-24 h-24 bg-[var(--color-teal)] flex items-center justify-center relative"
          style={{ borderRadius: 0 }}
        >
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.4, type: "spring", stiffness: 300, damping: 20 }}>
            <Check size={40} className="text-white" strokeWidth={3} />
          </motion.div>
        </motion.div>
      </div>

      <motion.div variants={fadeInUp}>
        <span className="section-eyebrow">Order Placed</span>
        <h1 className="font-display text-4xl font-bold text-[var(--color-ink)] mt-2 mb-3">Thank You!</h1>
        <p className="text-[var(--color-ink-muted)] text-sm mb-10">Your order has been placed successfully. We'll send you a confirmation email shortly.</p>
      </motion.div>

      <motion.div variants={fadeInUp}>
        <OrderTimeline />
      </motion.div>

      <motion.div variants={fadeInUp}>
        {orderId && (
          <div className="border border-[var(--color-navy)]/10 px-6 py-4 mb-8 flex items-center justify-between bg-white/50">
            <div className="text-left">
              <p className="text-[8px] uppercase tracking-widest text-[var(--color-ink-muted)]">Order ID</p>
              <p className="text-xs font-bold text-[var(--color-ink)] font-mono mt-0.5">{orderId}</p>
            </div>
            <button onClick={copyId} className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-[var(--color-teal)] hover:text-[var(--color-ink)] transition-colors">
              {copied ? <><Check size={10} /> Copied</> : <><Copy size={10} /> Copy</>}
            </button>
          </div>
        )}
      </motion.div>

      <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-3">
        {orderId && (
          <Link href={`/account?tab=orders`} className="btn-primary flex-1 justify-center shadow-sm hover:-translate-y-[1px] transition-all">
            <Package size={14} /> Track Order
          </Link>
        )}
        <Link href="/products" className="btn-secondary flex-1 justify-center hover:bg-[var(--color-navy)]/5 transition-colors">
          Continue Shopping
        </Link>
      </motion.div>
    </motion.div>
  );
}

export default function OrderSuccessPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg)]">
      <Navbar />
      <main className="flex-grow flex items-center overflow-hidden relative">
        <Suspense fallback={<div className="flex-1 flex items-center justify-center"><div className="h-6 w-6 border-2 border-[var(--color-teal)] border-t-transparent rounded-full animate-spin" /></div>}>
          <OrderSuccessContent />
        </Suspense>
      </main>
    </div>
  );
}
