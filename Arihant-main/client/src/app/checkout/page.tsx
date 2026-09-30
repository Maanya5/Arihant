"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import Navbar from "@/components/Navbar";
import api from "@/lib/api";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/store/authStore";
import PageSpinner from "@/components/PageSpinner";

declare global { interface Window { Razorpay: any; } }
const STEPS = ["Address", "Payment", "Review"];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center mb-10">
      {STEPS.map((s, i) => (
        <div key={s} className="flex items-center">
          <div className="flex flex-col items-center">
            <div className={`relative w-8 h-8 flex items-center justify-center text-[10px] font-bold border transition-all duration-300 ${
              i < current ? "bg-[#567C8D] border-[#567C8D] text-white" 
              : i === current ? "bg-[var(--color-navy)] border-[var(--color-navy)] text-white" 
              : "bg-transparent border-[var(--color-navy)]/20 text-[var(--color-ink-muted)]"
            }`}>
              {/* Pulse Ring for active step */}
              {i === current && (
                <motion.div
                  className="absolute inset-0 border border-[var(--color-navy)]"
                  animate={{ scale: [1, 1.4], opacity: [0.6, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
                />
              )}
              {/* Checkmark Spin-in */}
              {i < current ? (
                <motion.div initial={{ rotate: -90, scale: 0 }} animate={{ rotate: 0, scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
                  <Check size={12} strokeWidth={3} />
                </motion.div>
              ) : i + 1}
            </div>
            <span className={`text-[8px] uppercase tracking-widest mt-2 font-bold ${i === current ? "text-[var(--color-ink)]" : "text-[var(--color-ink-muted)]"}`}>{s}</span>
          </div>
          {i < STEPS.length - 1 && (
            <div className="w-16 md:w-24 h-px mx-3 mb-5 bg-[var(--color-navy)]/10 relative">
              <motion.div 
                className="absolute inset-0 bg-[#567C8D] origin-left"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: i < current ? 1 : 0 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, clearCart } = useCart();
  const { user, isAuthenticated, isLoaded } = useAuth();
  const [step, setStep] = useState(0);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddr, setAddr] = useState<any>(null);
  const [newAddr, setNewAddr] = useState({ fullName: "", phone: "", street: "", city: "", state: "", pincode: "" });
  const [payMethod, setPayMethod] = useState<"razorpay" | "cod">("razorpay");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const delivery = subtotal >= 999 || items.length === 0 ? 0 : 60;
  const total = subtotal + delivery;

  useEffect(() => {
    if (isLoaded) {
      if (!isAuthenticated) { router.push("/login"); return; }
      api.get("/addresses").then(r => {
        setAddresses(r.data);
        const def = r.data.find((a: any) => a.isDefault) || r.data[0];
        if (def) setAddr(def);
      }).catch(() => { });
    }
  }, [isAuthenticated, isLoaded]);

  if (!isLoaded) {
    return <PageSpinner />;
  }

  const shippingAddress = selectedAddr || newAddr;
  const rawAddr = shippingAddress;

  const handlePlaceOrder = async () => {
    if (!rawAddr.fullName || !rawAddr.phone || !(rawAddr.street || rawAddr.addressLine1)) {
      setError("Please fill in all address fields."); return;
    }
    setError(""); setLoading(true);
    try {
      const mappedAddress = {
        fullName: rawAddr.fullName || rawAddr.name,
        phone: rawAddr.phone || rawAddr.contact,
        street: rawAddr.street || rawAddr.addressLine1 || rawAddr.address || "",
        addressLine1: rawAddr.street || rawAddr.addressLine1 || rawAddr.address || "",
        city: rawAddr.city,
        state: rawAddr.state,
        pincode: rawAddr.pincode || rawAddr.zipCode,
        zipCode: rawAddr.pincode || rawAddr.zipCode
      };
      const orderPayload = { items: items.map(i => ({ product: i.id, size: i.size, quantity: i.quantity })), shippingAddress: mappedAddress, paymentMethod: payMethod };
      if (payMethod === "cod") {
        const { data } = await api.post("/orders", { orderData: orderPayload });
        clearCart(); router.push(`/order-success?orderId=${data._id}`); return;
      }
      const { data: rzpData } = await api.post("/orders/create-razorpay-order", { amount: Math.round(total * 100), currency: "INR", receipt: `rcpt_${Date.now()}` });
      const script = document.createElement("script"); script.src = "https://checkout.razorpay.com/v1/checkout.js"; document.body.appendChild(script);
      script.onload = () => {
        const rzp = new window.Razorpay({
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, amount: rzpData.amount, currency: "INR",
          name: "Arihant Store", description: "School Uniform Order", order_id: rzpData.id,
          handler: async (response: any) => {
            try {
              const { data: v } = await api.post("/orders/verify-payment", { razorpay_order_id: response.razorpay_order_id, razorpay_payment_id: response.razorpay_payment_id, razorpay_signature: response.razorpay_signature, orderData: orderPayload });
              clearCart(); router.push(`/order-success?orderId=${v.orderId}`);
            } catch (err: any) {
              const msg = err?.response?.data?.message || "Payment verification failed. Contact support.";
              setError(msg);
            }
          },
          prefill: { name: user?.name || "", email: user?.email || "" },
          theme: { color: "#567C8D" }
        });
        rzp.open(); setLoading(false);
      };
    } catch (e: any) { setError(e?.response?.data?.message || "Order failed. Please try again."); setLoading(false); }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg)]">
      <Navbar />
      <main className="flex-grow pb-20 md:pb-0">
        <div className="max-w-2xl mx-auto px-4 py-10">
          <span className="section-eyebrow">Secure Checkout</span>
          <h1 className="text-section font-display font-bold text-[var(--color-ink)] mt-2 mb-8 border-b border-[#C8D9E6] pb-4">Checkout</h1>
          <StepIndicator current={step} />
          {error && <div className="border border-red-200 bg-red-50 text-red-700 text-xs px-4 py-3 mb-6">{error}</div>}

          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div key="step-0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25, ease: "easeOut" }}>
                <h2 className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-ink)] mb-6">Delivery Address</h2>
                {addresses.length > 0 && (
                  <div className="space-y-3 mb-6">
                    {addresses.map((a: any) => (
                      <button key={a._id} onClick={() => setAddr(a)} className={`w-full text-left border p-4 transition-all ${selectedAddr?._id === a._id ? "border-[#567C8D] bg-[#567C8D]/5" : "border-[var(--color-navy)]/15 hover:border-[#567C8D]/50"}`}>
                        <div className="flex items-center justify-between mb-1">
                          <p className={`text-xs font-bold ${selectedAddr?._id === a._id ? "text-[#567C8D]" : "text-[var(--color-ink)]"}`}>{a.fullName || a.name}</p>
                          {selectedAddr?._id === a._id && <Check size={14} className="text-[#567C8D]" />}
                        </div>
                        <p className="text-[10px] text-[var(--color-ink-muted)]">{a.street}, {a.city}, {a.state} — {a.pincode}</p>
                      </button>
                    ))}
                  </div>
                )}
                <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--color-ink-muted)] mb-3">{addresses.length > 0 ? "Or add new address" : "Add delivery address"}</p>
                <motion.div variants={{ show: { transition: { staggerChildren: 0.06 } } }} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[["fullName", "Full Name"], ["phone", "Phone"], ["street", "Street Address"], ["city", "City"], ["state", "State"], ["pincode", "Pincode"]].map(([k, l]) => (
                    <motion.div key={k} variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} className={k === "street" ? "md:col-span-2" : ""}>
                      <input type="text" placeholder={l} value={(newAddr as any)[k]} onChange={e => { setAddr(null); setNewAddr(n => ({ ...n, [k]: e.target.value })); }}
                        className="w-full border border-[var(--color-navy)]/20 px-4 py-3 text-xs bg-transparent focus:outline-none focus:border-[#567C8D] transition-colors" style={{ borderRadius: 0 }} />
                    </motion.div>
                  ))}
                </motion.div>
                <button onClick={() => setStep(1)} className="btn-primary w-full mt-6 shadow-sm hover:shadow-md hover:-translate-y-[1px] transition-all">Continue to Payment</button>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div key="step-1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25, ease: "easeOut" }}>
                <h2 className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-ink)] mb-6">Payment Method</h2>
                <div className="space-y-3 mb-8">
                  {[{ id: "razorpay", label: "Pay Online", sub: "UPI, Cards, Net Banking via Razorpay" }, { id: "cod", label: "Cash on Delivery", sub: "Pay when your order arrives" }].map(opt => (
                    <button key={opt.id} onClick={() => setPayMethod(opt.id as any)} className={`w-full text-left border p-4 transition-all ${payMethod === opt.id ? "border-[#567C8D] bg-[#567C8D]/5" : "border-[var(--color-navy)]/15 hover:border-[#567C8D]/50"}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 border flex-shrink-0 flex items-center justify-center transition-colors ${payMethod === opt.id ? "border-[#567C8D] bg-[#567C8D]" : "border-[var(--color-navy)]/30"}`}>
                          {payMethod === opt.id && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}><Check size={10} className="text-white" strokeWidth={3} /></motion.div>}
                        </div>
                        <div>
                          <p className={`text-xs font-bold ${payMethod === opt.id ? "text-[#567C8D]" : "text-[var(--color-ink)]"}`}>{opt.label}</p>
                          <p className="text-[9px] text-[var(--color-ink-muted)]">{opt.sub}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setStep(0)} className="btn-secondary flex-1">Back</button>
                  <button onClick={() => setStep(2)} className="btn-primary flex-1 shadow-sm hover:shadow-md hover:-translate-y-[1px] transition-all">Review Order</button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step-2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25, ease: "easeOut" }}>
                <h2 className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-ink)] mb-6">Review & Place Order</h2>
                <div className="border border-[var(--color-navy)]/10 p-5 mb-4">
                  <p className="text-[9px] uppercase tracking-widest text-[var(--color-ink-muted)] mb-2">Delivery To</p>
                  <p className="text-xs font-bold text-[var(--color-ink)]">{shippingAddress.fullName}</p>
                  <p className="text-[10px] text-[var(--color-ink-muted)] mt-1">{shippingAddress.street}, {shippingAddress.city}, {shippingAddress.state} — {shippingAddress.pincode}</p>
                </div>
                
                <div className="border border-[var(--color-navy)]/10 p-5 mb-4">
                  <p className="text-[9px] uppercase tracking-widest text-[var(--color-ink-muted)] mb-3">Items ({items.length})</p>
                  <motion.div variants={{ show: { transition: { staggerChildren: 0.08 } } }} initial="hidden" animate="show">
                    {items.map(i => (
                      <motion.div key={`${i.id}-${i.size}`} variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }} className="flex justify-between py-2 border-b border-[var(--color-navy)]/5 last:border-0">
                        <div>
                          <p className="text-xs font-bold text-[var(--color-ink)] line-clamp-1">{i.name}</p>
                          <p className="text-[9px] text-[var(--color-ink-muted)] mt-0.5">Size: {i.size} · Qty: {i.quantity}</p>
                        </div>
                        <span className="text-xs font-bold text-[var(--color-ink)]">₹{(i.price * i.quantity).toLocaleString("en-IN")}</span>
                      </motion.div>
                    ))}
                  </motion.div>
                </div>

                <div className="border border-[var(--color-navy)]/10 p-5 mb-6">
                  <div className="flex justify-between text-xs mb-2"><span className="text-[var(--color-ink-muted)]">Subtotal</span><span className="font-bold">₹{subtotal.toLocaleString("en-IN")}</span></div>
                  <div className="flex justify-between text-xs mb-3"><span className="text-[var(--color-ink-muted)]">Delivery</span><span className={`font-bold ${delivery === 0 ? "text-[#567C8D]" : ""}`}>{delivery === 0 ? "FREE" : `₹${delivery}`}</span></div>
                  <div className="flex justify-between border-t border-[var(--color-navy)]/10 pt-3">
                    <span className="text-xs font-bold text-[var(--color-ink)]">Total</span>
                    <span className="text-lg font-display font-bold text-[var(--color-ink)]">₹{total.toLocaleString("en-IN")}</span>
                  </div>
                  <p className="text-[9px] text-[var(--color-ink-muted)] mt-2">Payment: {payMethod === "cod" ? "Cash on Delivery" : "Online via Razorpay"}</p>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setStep(1)} className="btn-secondary flex-1">Back</button>
                  <button onClick={handlePlaceOrder} disabled={loading} className="btn-primary flex-1 disabled:opacity-60 shadow-sm hover:shadow-md hover:-translate-y-[2px] transition-all relative overflow-hidden flex items-center justify-center">
                    <AnimatePresence mode="wait">
                      {loading ? (
                        <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex justify-center items-center h-[18px]">
                          <div className="w-[18px] h-[18px] border-2 border-white border-t-transparent rounded-full animate-spin" />
                        </motion.div>
                      ) : (
                        <motion.span key="text" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-[18px] flex items-center">
                          {payMethod === "cod" ? "Place Order" : "Pay & Place Order"}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </main>
    </div>
  );
}
