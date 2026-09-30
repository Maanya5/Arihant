"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Minus, Plus, Trash2, Tag, ArrowRight, X } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useCart } from "@/context/CartContext";
import api from "@/lib/api";


const fmt = (p: number) => `₹${p.toLocaleString("en-IN")}`;

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

const itemVariants = {
  hidden: { opacity: 0, x: -24 },
  show: { opacity: 1, x: 0, transition: { duration: 0.3, ease: "easeOut" } }
};

export default function CartPage() {
  const { items, removeItem, updateQuantity, totalItems, clearCart } = useCart();
  const [coupon, setCoupon]     = useState("");
  const [discount, setDiscount] = useState(0);
  const [couponMsg, setCouponMsg] = useState("");
  const [couponOk, setCouponOk]  = useState(false);
  const [couponLoading, setCouponLoading] = useState(false);
  const [recommendations, setRecs] = useState<any[]>([]);
  const [flash, setFlash] = useState(false);
  const router = useRouter();

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const delivery = subtotal >= 999 || items.length === 0 ? 0 : 60;
  const total    = subtotal + delivery - discount;

  useEffect(() => {
    if (items.length > 0) {
      const schoolId = (items[0] as any).schoolId;
      if (schoolId) {
        api.get(`/products/recommendations?schoolId=${schoolId}&limit=4`).then(r => setRecs(r.data)).catch(() => {});
      }
    }
  }, [items]);

  // Flash highlight on price change
  useEffect(() => {
    setFlash(true);
    const t = setTimeout(() => setFlash(false), 400);
    return () => clearTimeout(t);
  }, [total]);

  const validateCoupon = async () => {
    if (!coupon.trim()) return;
    setCouponLoading(true); setCouponMsg("");
    try {
      const { data } = await api.post("/coupons/validate", { code: coupon, cartTotal: Math.round(subtotal * 100) });
      if (data.valid) {
        setDiscount(data.discountAmount / 100);
        setCouponOk(true);
        setCouponMsg(data.message);
      } else {
        setCouponOk(false); setDiscount(0);
        setCouponMsg(data.message);
      }
    } catch { setCouponMsg("Could not validate coupon."); }
    finally { setCouponLoading(false); }
  };

  const removeCoupon = () => {
    setCouponOk(false);
    setDiscount(0);
    setCoupon("");
    setCouponMsg("");
  };

  if (items.length === 0) return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg)]">
      <Navbar />
      <main className="flex-grow flex items-center justify-center px-4 pb-20 md:pb-0">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }} className="text-center max-w-sm">
          <div className="text-6xl mb-6">🛍️</div>
          <h1 className="font-display text-3xl font-bold text-[var(--color-ink)] mb-3">Your cart is empty.</h1>
          <p className="text-[var(--color-ink-muted)] text-sm mb-8">Time to dress up. Browse our collection of school uniforms.</p>
          <Link href="/products" className="btn-primary">Browse Collection <ArrowRight size={14} /></Link>
        </motion.div>
      </main>
      <Footer />
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg)]">
      <Navbar />
      <main className="flex-grow pb-20 md:pb-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <span className="section-eyebrow">Your Selection</span>
          <h1 className="text-section font-display font-bold text-[var(--color-ink)] mt-2 mb-10 border-b border-[#C8D9E6] pb-4">Shopping Cart</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Items */}
            <div className="lg:col-span-2 space-y-0">
              <div className="border-t border-[var(--color-navy)]/10">
                <motion.div variants={containerVariants} initial="hidden" animate="show">
                  <AnimatePresence initial={false}>
                    {items.map(item => (
                      <motion.div
                        layout
                        key={`${item.id}-${item.size}`}
                        variants={itemVariants}
                        exit={{ opacity: 0, x: "100%", height: 0, padding: 0, margin: 0, transition: { duration: 0.3 } }}
                        className="overflow-hidden"
                      >
                        <div className="flex gap-4 py-6 border-b border-[var(--color-navy)]/5">
                          {/* Image */}
                          <div className="w-20 h-20 flex-shrink-0 border border-[var(--color-navy)]/10 overflow-hidden relative">
                            {item.image
                              ? <Image src={item.image || '/fallback-product.jpg'} alt={item.name} fill sizes="80px" className="object-cover" loading="lazy" />
                              : <div className="w-full h-full bg-white" />
                            }
                          </div>

                          {/* Details */}
                          <div className="flex-1 min-w-0">
                            {(item as any).schoolName && (
                              <span className="inline-block bg-[var(--color-sky)] text-white text-[7px] font-bold uppercase tracking-wider px-2 py-0.5 mb-1">
                                {(item as any).schoolName}
                              </span>
                            )}
                            <p className="font-display text-sm font-bold text-[var(--color-ink)] line-clamp-2 mb-1">{item.name}</p>
                            <p className="text-[9px] uppercase tracking-widest text-[var(--color-ink-muted)] mb-3">Size: {item.size}</p>

                            <div className="flex items-center justify-between">
                              {/* Qty stepper */}
                              <div className="flex items-center border border-[var(--color-navy)]/20 bg-white">
                                <motion.button 
                                  whileTap={{ scale: 0.88 }}
                                  onClick={() => updateQuantity(item.id!, item.size!, item.quantity - 1)} 
                                  disabled={item.quantity <= 1}
                                  className="w-8 h-8 flex items-center justify-center text-[var(--color-ink)]/60 hover:text-[var(--color-ink)] hover:bg-[var(--color-navy)]/5 disabled:opacity-30 disabled:hover:bg-transparent transition-colors z-10"
                                >
                                  <Minus size={10} />
                                </motion.button>
                                <div className="w-8 h-8 flex items-center justify-center overflow-hidden">
                                  <AnimatePresence mode="popLayout" initial={false}>
                                    <motion.span 
                                      key={item.quantity}
                                      initial={{ y: 15, opacity: 0 }}
                                      animate={{ y: 0, opacity: 1 }}
                                      exit={{ y: -15, opacity: 0 }}
                                      transition={{ duration: 0.2 }}
                                      className="text-xs font-bold text-[var(--color-ink)] inline-block"
                                    >
                                      {item.quantity}
                                    </motion.span>
                                  </AnimatePresence>
                                </div>
                                <motion.button 
                                  whileTap={{ scale: 0.88 }}
                                  onClick={() => updateQuantity(item.id!, item.size!, item.quantity + 1)}
                                  className="w-8 h-8 flex items-center justify-center text-[var(--color-ink)]/60 hover:text-[var(--color-ink)] hover:bg-[var(--color-navy)]/5 transition-colors z-10"
                                >
                                  <Plus size={10} />
                                </motion.button>
                              </div>

                              <div className="flex items-center gap-4">
                                <span className={`text-sm font-bold px-1 transition-all duration-400 ${flash ? "bg-[#567C8D]/15 text-[#567C8D]" : "bg-transparent text-[var(--color-ink)]"}`}>
                                  {fmt(item.price * item.quantity)}
                                </span>
                                <button onClick={() => removeItem(item.id!, item.size!)} className="text-[var(--color-ink-muted)] hover:text-red-500 transition-colors">
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              </div>
            </div>

            {/* Summary */}
            <div className="lg:sticky lg:top-24 self-start">
              <div className="border border-[var(--color-navy)]/10 p-6 bg-white/30">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-ink)] mb-6">Order Summary</h3>

                {/* Coupon */}
                <div className="mb-5">
                  <AnimatePresence mode="wait">
                    {couponOk ? (
                      <motion.div 
                        key="applied" 
                        initial={{ scale: 0.9, opacity: 0 }} 
                        animate={{ scale: 1, opacity: 1 }} 
                        exit={{ scale: 0.9, opacity: 0 }} 
                        className="flex items-center justify-between border border-[#567C8D] bg-[#567C8D]/5 px-3 py-2.5"
                      >
                        <div className="flex items-center gap-2 text-[10px] font-bold text-[#567C8D] uppercase tracking-widest"><Tag size={12} /> {coupon} Applied</div>
                        <button onClick={removeCoupon} className="text-[var(--color-ink)]/40 hover:text-[var(--color-ink)] transition-colors"><X size={14} /></button>
                      </motion.div>
                    ) : (
                      <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Tag size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-muted)]" />
                            <input
                              type="text" placeholder="Coupon code" value={coupon} onChange={e => setCoupon(e.target.value.toUpperCase())}
                              className={`w-full pl-8 pr-3 py-2.5 text-xs border bg-white focus:outline-none uppercase transition-colors ${couponMsg && !couponOk ? "border-red-500" : "border-[var(--color-navy)]/20 focus:border-[#567C8D]"}`}
                              style={{ borderRadius: 0 }}
                            />
                          </div>
                          <button onClick={validateCoupon} disabled={couponLoading || !coupon.trim()}
                            className="px-4 py-2.5 bg-[var(--color-navy)] text-white text-[9px] font-bold uppercase tracking-widest disabled:opacity-50 transition-all hover:bg-[var(--color-teal)]">
                            {couponLoading ? "..." : "Apply"}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  <AnimatePresence>
                    {couponMsg && (
                      <motion.div 
                        initial={{ y: -8, opacity: 0 }} 
                        animate={!couponOk ? "shake" : "show"} 
                        variants={{
                          show: { y: 0, opacity: 1 },
                          shake: { x: [0, -6, 6, -4, 4, 0], y: 0, opacity: 1 }
                        }}
                        transition={{ duration: 0.3 }}
                        className={`text-[9px] font-bold mt-2 ${couponOk ? "text-[#567C8D]" : "text-red-500"}`}
                      >
                        {couponMsg}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Price breakdown */}
                <div className="space-y-3 text-xs border-t border-[var(--color-navy)]/5 pt-5 mb-5">
                  <div className="flex justify-between"><span className="text-[var(--color-ink-muted)]">Subtotal ({totalItems} items)</span><span className={`font-bold px-1 transition-all duration-400 ${flash ? "bg-[#567C8D]/15 text-[#567C8D]" : "text-[var(--color-ink)]"}`}>{fmt(subtotal)}</span></div>
                  <div className="flex justify-between"><span className="text-[var(--color-ink-muted)]">Delivery</span><span className={`font-bold ${delivery === 0 ? "text-[#567C8D]" : "text-[var(--color-ink)]"}`}>{delivery === 0 ? "FREE" : fmt(delivery)}</span></div>
                  <AnimatePresence>
                    {discount > 0 && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="flex justify-between overflow-hidden">
                        <span className="text-[var(--color-ink-muted)]">Coupon Discount</span><span className="font-bold text-[#567C8D]">−{fmt(discount)}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {delivery > 0 && <p className="text-[9px] text-[#567C8D] pt-1">Add {fmt(999 - subtotal)} more for free delivery</p>}
                </div>

                <div className="flex justify-between border-t border-[var(--color-navy)]/10 pt-5 mb-6">
                  <span className="text-xs font-bold text-[var(--color-ink)] self-center">Total</span>
                  <span className={`text-xl font-display font-bold px-1 transition-all duration-400 ${flash ? "bg-[#567C8D]/20 text-[#567C8D]" : "text-[var(--color-ink)]"}`}>{fmt(total)}</span>
                </div>

                <Link href="/checkout" className="btn-primary w-full shadow-sm hover:shadow-md hover:-translate-y-[1px]">
                  Proceed to Checkout <ArrowRight size={14} />
                </Link>
                <Link href="/products" className="btn-secondary w-full mt-3 !text-[9px]">Continue Shopping</Link>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <section className="mt-16 pt-10 border-t border-[var(--color-navy)]/5">
              <span className="section-eyebrow">From the Same School</span>
              <h2 className="text-2xl font-display font-bold text-[var(--color-ink)] mt-2 mb-8">You Might Also Need</h2>
              <div className="flex gap-6 overflow-x-auto pb-4 custom-scrollbar">
                {recommendations.map((p: any) => (
                  <Link key={p._id} href={`/products/${p.itemSlug || p._id}`} className="flex-shrink-0 w-44 group">
                    <div className="aspect-[4/5] border border-[var(--color-navy)]/10 overflow-hidden mb-3 group-hover:border-[var(--color-navy)] transition-colors relative">
                      {p.primary_image ? <Image src={p.primary_image || '/fallback-product.jpg'} alt={p.name} fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" /> : <div className="w-full h-full bg-white" />}
                    </div>
                    <p className="font-display text-xs font-bold text-[var(--color-ink)] line-clamp-2 mb-1">{p.name}</p>
                    <p className="text-xs font-bold text-[var(--color-ink)]">{fmt(p.price_paisa / 100)}</p>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
