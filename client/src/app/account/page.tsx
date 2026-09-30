"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { User, Package, MapPin, Heart, LogOut, ChevronRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth as useStoreAuth } from "@/store/authStore";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import api from "@/lib/api";
import PageSpinner from "@/components/PageSpinner";


const STATUS_COLORS: Record<string, string> = {
  pending: "bg-[var(--color-sky)]/10 text-[var(--color-teal)]", processing: "bg-[var(--color-teal)]/10 text-[var(--color-teal)]",
  confirmed: "bg-[var(--color-teal)]/10 text-[var(--color-teal)]", packed: "bg-[var(--color-teal)]/10 text-[var(--color-teal)]",
  shipped: "bg-[var(--color-teal)]/10 text-[var(--color-teal)]", delivered: "bg-[#567C8D]/15 text-[#567C8D]",
  cancelled: "bg-red-100 text-red-600", returned: "bg-red-100 text-red-600",
};

const fmt = (n: number) => `₹${(n / 100).toLocaleString("en-IN")}`;

const tabVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" } },
  exit: { opacity: 0, y: 8, transition: { duration: 0.15 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const fadeInUp = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } }
};

function AccountPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") || "orders";
  const { user, isAuthenticated, fullLogout, isLoaded } = useStoreAuth();
  const { logout: firebaseLogout } = useAuth();
  const { clearCart } = useCart();
  const [orders, setOrders]       = useState<any[]>([]);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [wishlist, setWishlist]   = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    if (isLoaded) {
      if (!isAuthenticated) { router.push("/login"); return; }
      setLoading(true);
      const fetches = [
        api.get("/orders/my-orders").then(r => setOrders(Array.isArray(r.data) ? r.data : r.data.data || [])).catch(() => {}),
        api.get("/addresses").then(r => setAddresses(r.data)).catch(() => {}),
        api.get("/wishlist").then(r => setWishlist(r.data?.items || [])).catch(() => {}),
      ];
      Promise.all(fetches).finally(() => setLoading(false));
    }
  }, [isAuthenticated, isLoaded]);

  if (!isLoaded) {
    return <PageSpinner />;
  }

  const handleLogout = async () => {
    try { await firebaseLogout(); } catch {}
    clearCart(); fullLogout(); router.push("/");
  };

  const TABS = [
    { id: "orders",    label: "My Orders",   icon: Package },
    { id: "addresses", label: "Addresses",   icon: MapPin },
    { id: "wishlist",  label: "Wishlist",    icon: Heart },
    { id: "profile",   label: "Profile",     icon: User },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg)]">
      <Navbar />
      <main className="flex-grow pb-20 md:pb-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col md:flex-row gap-10">

            {/* Sidebar */}
            <div className="w-full md:w-56 flex-shrink-0">
              <div className="border border-[var(--color-navy)]/10 p-5 mb-4 bg-white/30">
                <div className="w-10 h-10 bg-[var(--color-teal)]/10 border border-[var(--color-teal)]/20 flex items-center justify-center text-[var(--color-teal)] font-bold text-base mb-3">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <p className="text-xs font-bold text-[var(--color-ink)]">{user?.name}</p>
                <p className="text-[9px] text-[var(--color-ink-muted)] truncate mt-0.5">{user?.email}</p>
              </div>
              <nav className="space-y-0.5">
                {TABS.map(t => {
                  const Icon = t.icon;
                  return (
                    <Link key={t.id} href={`/account?tab=${t.id}`}
                      className={`flex items-center gap-3 px-4 py-3 text-[10px] font-bold uppercase tracking-widest transition-all ${
                        tab === t.id ? "bg-[var(--color-navy)] text-white" : "text-[var(--color-ink)]/60 hover:bg-[var(--color-navy)]/5 hover:text-[var(--color-ink)]"
                      }`}>
                      <Icon size={13} /> {t.label}
                    </Link>
                  );
                })}
                <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-red-500 hover:bg-red-50 w-full transition-all">
                  <LogOut size={13} /> Logout
                </button>
              </nav>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {loading ? (
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-[#C8D9E6] animate-shimmer" />)}
                </div>
              ) : (
                <AnimatePresence mode="wait">
                  {/* Orders */}
                  {tab === "orders" && (
                    <motion.div key="orders" variants={tabVariants} initial="hidden" animate="show" exit="exit">
                      <span className="section-eyebrow">Purchase History</span>
                      <h2 className="text-3xl font-display font-bold text-[var(--color-ink)] mt-2 mb-6">My Orders</h2>
                      {orders.length === 0 ? (
                        <div className="border border-dashed border-[var(--color-navy)]/10 py-16 text-center bg-white/30">
                          <Package size={32} className="text-[var(--color-ink)]/20 mx-auto mb-4" />
                          <p className="text-[var(--color-ink-muted)] text-sm">No orders yet. Start shopping!</p>
                          <Link href="/products" className="btn-primary mt-6 inline-flex">Shop Now</Link>
                        </div>
                      ) : (
                        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-2">
                          {orders.map((o: any) => (
                            <motion.div key={o._id} variants={fadeInUp}>
                              <Link href={`/account/orders/${o._id}`}
                                className="flex items-center justify-between border border-[var(--color-navy)]/10 p-4 hover:border-[var(--color-teal)]/40 bg-white/40 hover:bg-white transition-all group">
                                <div>
                                  <div className="flex items-center gap-3 mb-1">
                                    <span className="text-[9px] font-mono text-[var(--color-ink-muted)]">#{String(o._id).slice(-8).toUpperCase()}</span>
                                    <motion.span 
                                      initial={{ scale: 0.8, opacity: 0 }} 
                                      animate={{ scale: 1, opacity: 1 }} 
                                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                      className={`text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 ${STATUS_COLORS[o.orderStatus] || "bg-[var(--color-navy)]/5 text-[var(--color-ink)]"}`}
                                    >
                                      {o.orderStatus}
                                    </motion.span>
                                  </div>
                                  <p className="text-xs font-bold text-[var(--color-ink)]">{o.items?.length} item{o.items?.length !== 1 ? "s" : ""}</p>
                                  <p className="text-[9px] text-[var(--color-ink-muted)] mt-0.5">{new Date(o.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                  <span className="text-sm font-bold text-[var(--color-ink)]">{fmt(o.totalAmount)}</span>
                                  <ChevronRight size={14} className="text-[var(--color-ink-muted)] group-hover:text-[#567C8D] transition-colors" />
                                </div>
                              </Link>
                            </motion.div>
                          ))}
                        </motion.div>
                      )}
                    </motion.div>
                  )}

                  {/* Addresses */}
                  {tab === "addresses" && (
                    <motion.div key="addresses" variants={tabVariants} initial="hidden" animate="show" exit="exit">
                      <span className="section-eyebrow">Saved Locations</span>
                      <h2 className="text-3xl font-display font-bold text-[var(--color-ink)] mt-2 mb-6">My Addresses</h2>
                      {addresses.length === 0 ? (
                        <div className="border border-dashed border-[var(--color-navy)]/10 py-16 text-center bg-white/30">
                          <MapPin size={32} className="text-[var(--color-ink)]/20 mx-auto mb-4" />
                          <p className="text-[var(--color-ink-muted)] text-sm">No saved addresses.</p>
                        </div>
                      ) : (
                        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {addresses.map((a: any) => (
                            <motion.div key={a._id} variants={fadeInUp} className="border border-[var(--color-navy)]/10 p-5 bg-white/30 hover:border-[var(--color-navy)]/30 transition-colors">
                              <p className="text-xs font-bold text-[var(--color-ink)] mb-1.5">{a.fullName || a.name}</p>
                              <p className="text-[10px] text-[var(--color-ink-muted)] leading-relaxed">{a.street}<br />{a.city}, {a.state} — {a.pincode}</p>
                              {a.isDefault && <span className="text-[8px] text-[#567C8D] font-bold uppercase tracking-widest mt-3 inline-block">Default Address</span>}
                            </motion.div>
                          ))}
                        </motion.div>
                      )}
                    </motion.div>
                  )}

                  {/* Wishlist */}
                  {tab === "wishlist" && (
                    <motion.div key="wishlist" variants={tabVariants} initial="hidden" animate="show" exit="exit">
                      <span className="section-eyebrow">Saved Items</span>
                      <h2 className="text-3xl font-display font-bold text-[var(--color-ink)] mt-2 mb-6">My Wishlist</h2>
                      {wishlist.length === 0 ? (
                        <div className="border border-dashed border-[var(--color-navy)]/10 py-16 text-center bg-white/30">
                          <Heart size={32} className="text-[var(--color-ink)]/20 mx-auto mb-4" />
                          <p className="text-[var(--color-ink-muted)] text-sm">Your wishlist is empty.</p>
                          <Link href="/products" className="btn-primary mt-6 inline-flex">Browse Products</Link>
                        </div>
                      ) : (
                        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {wishlist.map((entry: any) => {
                            const p = entry.item;
                            if (!p) return null;
                            return (
                              <motion.div key={entry._id} variants={fadeInUp}>
                                <Link href={`/products/${p.itemSlug || p._id}`} className="block group border border-[var(--color-navy)]/10 hover:border-[#567C8D]/40 transition-colors bg-white">
                                  <div className="aspect-[4/5] overflow-hidden bg-[#C8D9E6] relative">
                                    {p.primary_image ? <Image src={p.primary_image || '/fallback-product.jpg'} alt={p.name} fill sizes="(max-width: 768px) 50vw, 33vw" className="object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" /> : <div className="w-full h-full bg-white" />}
                                  </div>
                                  <div className="p-3">
                                    <p className="font-display text-xs font-bold text-[var(--color-ink)] line-clamp-2 mb-1">{p.name}</p>
                                    <p className="text-xs font-bold text-[var(--color-ink)]">{fmt(p.price_paisa)}</p>
                                  </div>
                                </Link>
                              </motion.div>
                            );
                          })}
                        </motion.div>
                      )}
                    </motion.div>
                  )}

                  {/* Profile */}
                  {tab === "profile" && (
                    <motion.div key="profile" variants={tabVariants} initial="hidden" animate="show" exit="exit">
                      <span className="section-eyebrow">Your Details</span>
                      <h2 className="text-3xl font-display font-bold text-[var(--color-ink)] mt-2 mb-6">Profile</h2>
                      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="border border-[var(--color-navy)]/10 p-6 max-w-sm space-y-5 bg-white/30">
                        {[["Name", user?.name], ["Email", user?.email], ["Role", user?.role]].map(([l, v]) => (
                          <motion.div key={l} variants={fadeInUp}>
                            <p className="text-[9px] uppercase tracking-widest text-[var(--color-ink-muted)] mb-1">{l}</p>
                            <p className="text-xs font-bold text-[var(--color-ink)]">{v || "—"}</p>
                          </motion.div>
                        ))}
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
        <div className="w-8 h-8 border-2 border-[#567C8D] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <AccountPageContent />
    </Suspense>
  );
}
