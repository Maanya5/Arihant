"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useInView, useAnimate, stagger, Variants } from "framer-motion";
import {
  ArrowRight, ShoppingBag, Truck, RotateCcw,
  Users, ShieldCheck, ChevronRight, ChevronDown
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import api from "@/lib/api";
import FadeInUp from "@/components/motion/FadeInUp";
import StaggerGroup from "@/components/motion/StaggerGroup";

// New hero sections
import MenSection from "@/components/home/MenSection";
import WomenSection from "@/components/home/WomenSection";
import KidsSection from "@/components/home/KidsSection";

// ─── HELPERS ────────────────────────────────────────────────────────────────
const formatPrice = (paisa: number) =>
  `₹${(paisa / 100).toLocaleString("en-IN")}`;

const discountPercent = (price: number, mrp: number) =>
  mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;

// ─── TYPES ──────────────────────────────────────────────────────────────────
interface Product {
  _id: string;
  name: string;
  item_type: string;
  price_paisa: number;
  mrp_paisa?: number | null;
  primary_image?: string;
  itemSlug?: string;
  school?: { _id: string; name: string };
  standard?: { class_name: string; gender: string };
}


// ─── COUNTDOWN TIMER ────────────────────────────────────────────────────────
const SALE_END = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000); // 2 days from now

const CountdownBlock = ({ val, label }: { val: string; label: string }) => (
  <div className="flex flex-col items-center min-w-[48px]">
    <span className="text-3xl font-display font-bold text-white leading-none">{val}</span>
    <span className="text-[9px] uppercase tracking-widest text-white/60 mt-1">{label}</span>
  </div>
);

function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState({ h: "00", m: "00", s: "00" });
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const tick = () => {
      const diff = SALE_END.getTime() - Date.now();
      if (diff <= 0) { setExpired(true); return; }
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1_000);
      setTimeLeft({
        h: String(h).padStart(2, "0"),
        m: String(m).padStart(2, "0"),
        s: String(s).padStart(2, "0"),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  if (expired) return null;

  return (
    <div className="flex items-center gap-3">
      <CountdownBlock val={timeLeft.h} label="Hrs" />
      <span className="text-2xl font-display text-white/60 pb-4">:</span>
      <CountdownBlock val={timeLeft.m} label="Min" />
      <span className="text-2xl font-display text-white/60 pb-4">:</span>
      <CountdownBlock val={timeLeft.s} label="Sec" />
    </div>
  );
}

// ─── COUNT-UP HOOK ───────────────────────────────────────────────────────────
function useCountUp(target: number, duration = 800) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = target / (duration / 16);
    const id = setInterval(() => {
      start = Math.min(start + step, target);
      setValue(Math.round(start));
      if (start >= target) clearInterval(id);
    }, 16);
    return () => clearInterval(id);
  }, [inView, target, duration]);

  return { ref, value };
}

// ─── SKELETON CARD ───────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="flex-shrink-0 w-56">
      <div className="aspect-square bg-[#C8D9E6] animate-shimmer mb-3" />
      <div className="h-3 bg-[#C8D9E6] animate-shimmer mb-2 w-3/4" />
      <div className="h-3 bg-[#C8D9E6] animate-shimmer w-1/2" />
    </div>
  );
}

// ─── PRODUCT CARD (Best Sellers / Recently Viewed) ────────────────────────────
function ProductCard({ product }: { product: Product }) {
  const [addedFeedback, setAddedFeedback] = useState(false);
  const disc = discountPercent(product.price_paisa, product.mrp_paisa ?? 0);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    if (addedFeedback) return;
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 1400);
  };

  return (
    <Link
      href={`/products/${product.itemSlug || product._id}`}
      className="block w-full group card-hover-shadow"
    >
      <div className="relative aspect-square border border-[var(--color-navy)] overflow-hidden mb-3">
        {product.primary_image ? (
          <Image
            src={product.primary_image || '/fallback-product.jpg'}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-white flex items-center justify-center">
            <ShoppingBag size={32} className="text-[var(--color-ink)]/20" />
          </div>
        )}
        {disc > 0 && (
          <span className="absolute top-3 left-3 z-20 bg-[var(--color-sky)] text-white text-[9px] font-bold uppercase tracking-widest px-2 py-0.5">
            {disc}% OFF
          </span>
        )}

        {/* Quick Add — CSS-only slide-up, always visible on mobile */}
        <div
          className="
            absolute bottom-0 left-0 right-0 z-10
            translate-y-0 md:translate-y-full md:group-hover:translate-y-0
            transition-transform duration-[220ms] ease-out
            border-t border-[#C8D9E6]
          "
        >
          <button
            onClick={handleQuickAdd}
            className={`
              w-full text-[10px] font-bold uppercase tracking-widest py-3
              transition-colors duration-200
              ${addedFeedback
                ? "bg-emerald-600 text-white"
                : "bg-[var(--color-navy)] text-white hover:bg-[var(--color-teal)]"
              }
            `}
          >
            {addedFeedback ? "✓ Added" : "Quick Add"}
          </button>
        </div>
      </div>

      {product.school && (
        <span className="inline-block bg-[var(--color-teal)] text-white text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 mb-1.5">
          {product.school.name}
        </span>
      )}
      <p className="font-display text-sm font-bold text-[var(--color-ink)] leading-snug line-clamp-2 mb-1">
        {product.name}
      </p>
      {product.standard && (
        <p className="text-[10px] uppercase tracking-wider text-[var(--color-ink-muted)] mb-1.5">
          {product.standard.class_name} · {product.standard.gender === "boy" ? "Boys" : product.standard.gender === "girl" ? "Girls" : "Unisex"}
        </p>
      )}
      <div className="flex items-baseline gap-2">
        <span className="text-sm font-bold text-[var(--color-ink)]">{formatPrice(product.price_paisa)}</span>
        {product.mrp_paisa && product.mrp_paisa > product.price_paisa && (
          <span className="text-xs text-[var(--color-ink-muted)] line-through">{formatPrice(product.mrp_paisa)}</span>
        )}
      </div>
    </Link>
  );
}

const TRUST_ITEMS = [
  { icon: Truck, title: "Free Delivery", sub: "On orders above ₹999" },
  { icon: RotateCcw, title: "10-Day Returns", sub: "Hassle-free returns policy" },
  { icon: Users, title: "Bulk School Orders", sub: "Special pricing for schools" },
  { icon: ShieldCheck, title: "Quality Certified", sub: "Premium fabrics, every piece" },
];

const trustIconVariants: Variants = {
  hidden: { scale: 0, opacity: 0 },
  show: {
    scale: 1,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 15,
      delay: 0.1,
    }
  }
};

const trustTextVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1],
      delay: 0.2,
    }
  }
};

function SectionDivider() {
  return (
    <motion.div
      className="w-full h-px bg-[#C8D9E6]"
      initial={{ scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      style={{ originX: 0.5 }}
    />
  );
}

// ─── HOMEPAGE ────────────────────────────────────────────────────────────────
export default function HomePage() {
  const [homepageData, setHomepageData] = useState<any>(null);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [recentItems, setRecentItems] = useState<Product[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Stat counts for hero
  const { ref: schoolRef, value: schoolCount } = useCountUp(14);
  const { ref: orderRef, value: orderCount } = useCountUp(2400);

  useEffect(() => {
    // Fetch homepage layout data
    api.get("/homepage").then(r => {
      setHomepageData(r.data.sections);
      setLoadingData(false);
    }).catch(() => setLoadingData(false));

    // Fetch existing bestsellers
    api.get("/products/best-sellers?limit=12").then(r => {
      setBestSellers(r.data);
    }).catch(() => { });

    // Load recently viewed from localStorage
    try {
      const stored = JSON.parse(localStorage.getItem("arihant-recently-viewed") || '{"state":{"ids":[]}}');
      const ids: string[] = stored?.state?.ids || [];
      if (ids.length > 0) {
        api.get(`/products/batch?ids=${ids.join(",")}`).then(r => setRecentItems(r.data));
      }
    } catch { /* ignore */ }
  }, []);

  if (loadingData) {
    // Skeletons for the hero sections
    return (
      <div className="min-h-screen flex flex-col bg-[var(--color-bg)]">
        <Navbar />
        <main className="flex-grow">
          <div className="w-full h-screen bg-[#C8D9E6] animate-shimmer" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg)]">
      <Navbar />

      <main className="flex-grow">

        {/* ── MEN SECTION ────────────────────────────────────────────── */}
        <MenSection data={homepageData?.men} />

        <SectionDivider />

        {/* ── WOMEN SECTION ──────────────────────────────────────────── */}
        <WomenSection data={homepageData?.women} />

        <SectionDivider />

        {/* ── KIDS / SCHOOLS SECTION ─────────────────────────────────── */}
        <KidsSection data={homepageData?.kids} />

        {/* ── STATS / COUNT-UP SECTION ───────────────────────── */}
        <section className="py-20 md:py-28 bg-[var(--color-bg)] relative" aria-label="Store Statistics">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <FadeInUp>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-24 text-center md:text-left">
                <div>
                  <span ref={schoolRef} className="font-display font-bold text-[var(--color-ink)] text-[clamp(2.5rem,4vw,4rem)] leading-none">
                    {schoolCount}+
                  </span>
                  <p className="text-eyebrow mt-2">Partner Schools</p>
                  <p className="text-sm text-[var(--color-ink-muted)] mt-3 max-w-sm">
                    Providing official, standardized uniforms for leading schools across the region.
                  </p>
                </div>
                <div>
                  <span ref={orderRef} className="font-display font-bold text-[var(--color-ink)] text-[clamp(2.5rem,4vw,4rem)] leading-none">
                    {orderCount.toLocaleString("en-IN")}+
                  </span>
                  <p className="text-eyebrow mt-2">Orders Delivered</p>
                  <p className="text-sm text-[var(--color-ink-muted)] mt-3 max-w-sm">
                    Ensuring reliable quality and door-to-door delivery for thousands of happy families.
                  </p>
                </div>
              </div>
            </FadeInUp>
          </div>
        </section>

        {/* ── FLASH SALE STRIP ────────────────────────────────── */}
        <FadeInUp>
          <section className="bg-[var(--color-navy)] py-10 border-y border-[var(--color-navy)]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                <div>
                  <span className="section-eyebrow !text-[var(--color-teal)]">Limited Time</span>
                  <h2 className="text-3xl md:text-4xl font-display font-bold text-white mt-2">
                    Back to School Sale
                  </h2>
                  <p className="text-white/50 text-sm mt-2">Session 2025-26 — New stock, unbeatable prices</p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-[9px] uppercase tracking-widest text-white/50 mb-3">Ends in</p>
                    <CountdownTimer />
                  </div>
                  <Link href="/products" className="btn-primary !bg-[var(--color-teal)] !border-[var(--color-teal)] !text-white whitespace-nowrap">
                    Shop Now
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </FadeInUp>

        {/* ── BEST SELLERS ────────────────────────────────────── */}
        <section className="py-20 md:py-28 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-end mb-12">
              <FadeInUp>
                <span className="section-eyebrow text-[var(--color-teal)] font-bold">Trending</span>
                <h2 className="text-4xl md:text-5xl font-display font-bold text-[var(--color-ink)] mt-2">Best Sellers</h2>
              </FadeInUp>
              <FadeInUp delay={0.1}>
                <Link href="/products" className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-teal)] border-b border-[var(--color-teal)] pb-0.5 hidden md:flex items-center gap-1">
                  View All <ChevronRight size={12} />
                </Link>
              </FadeInUp>
            </div>

            {bestSellers.length === 0 ? (
              <div className="flex gap-6 overflow-x-auto pb-4">
                {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : (
              <FadeInUp>
                <StaggerGroup
                  stagger={0.08}
                  className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory"
                  childClassName="flex-shrink-0 w-56 snap-start"
                >
                  {bestSellers.map(p => <ProductCard key={p._id} product={p} />)}
                </StaggerGroup>
              </FadeInUp>
            )}
          </div>
        </section>

        {/* ── TRUST STRIP ─────────────────────────────────────── */}
        <section className="py-20 md:py-28 bg-[var(--color-bg)] border-y border-[var(--color-navy)]/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <StaggerGroup
              stagger={0.12}
              className="grid grid-cols-2 md:grid-cols-4 divide-x divide-[var(--color-navy)]/10"
            >
              {TRUST_ITEMS.map((item, i) => {
                const Icon = item.icon;
                return (
                  <div
                    key={i}
                    className="flex flex-col items-center text-center px-6 py-4 md:py-0"
                  >
                    <motion.div variants={trustIconVariants}>
                      <Icon size={24} className="text-[var(--color-teal)] mb-4" />
                    </motion.div>
                    <motion.div variants={trustTextVariants} className="flex flex-col items-center">
                      <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-ink)] mb-1">{item.title}</p>
                      <p className="text-[10px] text-[var(--color-ink-muted)]">{item.sub}</p>
                    </motion.div>
                  </div>
                );
              })}
            </StaggerGroup>
          </div>
        </section>

        {/* ── RECENTLY VIEWED ──────────────────────────────────── */}
        {recentItems.length > 0 && (
          <section className="py-20 md:py-28 bg-white border-t border-[var(--color-navy)]/5">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <FadeInUp className="mb-12">
                <span className="section-eyebrow text-[var(--color-teal)] font-bold">Picks for you</span>
                <h2 className="text-4xl md:text-5xl font-display font-bold text-[var(--color-ink)] mt-2">Continue Where You Left Off</h2>
              </FadeInUp>
              <FadeInUp>
                <StaggerGroup
                  stagger={0.08}
                  className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory"
                  childClassName="flex-shrink-0 w-56 snap-start"
                >
                  {recentItems.map(p => <ProductCard key={p._id} product={p} />)}
                </StaggerGroup>
              </FadeInUp>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
