"use client";

import React, { useEffect, useState, useCallback, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronDown, SlidersHorizontal, Plus, Minus } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import api from "@/lib/api";
import ProductCard, { cardVariants, Product } from "@/components/ProductCard";

interface School { _id: string; name: string; city: string; }

const ITEM_TYPES = ["shirt","pant","skirt","blazer","shorts","belt","socks","tie","t-shirt","track","shoes"];
const SIZES      = ["XS","S","M","L","XL","XXL","UK3","UK4","UK5","UK6","UK7","UK8"];
const GENDERS    = [{ label: "Boy",   value: "boy" }, { label: "Girl",  value: "girl" }, { label: "Unisex", value: "unisex" }];
const SORTS      = [
  { label: "Newest",            value: "newest" },
  { label: "Price: Low → High", value: "price_asc" },
  { label: "Price: High → Low", value: "price_desc" },
];

const gridContainerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
  exit: { opacity: 0, transition: { duration: 0.2 } }
};

const skeletonContainerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.03 } }
};

function SkeletonCard() {
  return (
    <motion.div variants={cardVariants} className="w-full flex flex-col">
      <div className="aspect-[3/4] animate-pulse bg-[#E5E5E5] mb-2" />
      <div className="h-2.5 bg-[#E5E5E5] animate-pulse mb-1.5 w-2/3" />
      <div className="h-2.5 bg-[#E5E5E5] animate-pulse w-1/3" />
    </motion.div>
  );
}

// ─── HM Style Right Filter Drawer Content ─────────────────────────────────────────
function FilterSidebar({ schools, filters, onChange, onClear }: {
  schools: School[];
  filters: Record<string, string>;
  onChange: (key: string, val: string) => void;
  onClear: () => void;
}) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    sort: false, price: true, school: false, gender: false, type: false, size: false
  });
  const toggle = (key: string) => setOpenSections(s => ({ ...s, [key]: !s[key] }));

  const Section = ({ id, label, children }: { id: string; label: string; children: React.ReactNode }) => (
    <div className="border-b border-[#E5E5E5]">
      <button
        onClick={() => toggle(id)}
        className="w-full flex items-center justify-between py-4 text-[11px] font-bold uppercase tracking-widest text-black hover:opacity-70 transition-opacity"
      >
        {label}
        {openSections[id] ? <Minus size={14} strokeWidth={1.5} /> : <Plus size={14} strokeWidth={1.5} />}
      </button>
      <AnimatePresence>
        {openSections[id] && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pb-5 space-y-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <div className="w-full flex flex-col h-full bg-white">
      <Section id="price" label="Price Range">
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="text-[10px] uppercase text-gray-500 mb-1.5 block">Min (Rs)</label>
            <input
              type="number" min={0} max={5000} step={100}
              value={filters.minPrice || "0"}
              onChange={e => onChange("minPrice", e.target.value)}
              className="w-full border-b border-gray-300 py-1.5 text-xs focus:outline-none focus:border-black transition-colors"
            />
          </div>
          <div className="flex-1">
            <label className="text-[10px] uppercase text-gray-500 mb-1.5 block">Max (Rs)</label>
            <input
              type="number" min={0} max={5000} step={100}
              value={filters.maxPrice || "5000"}
              onChange={e => onChange("maxPrice", e.target.value)}
              className="w-full border-b border-gray-300 py-1.5 text-xs focus:outline-none focus:border-black transition-colors"
            />
          </div>
        </div>
      </Section>

      <Section id="sort" label="Sort By">
        <div className="flex flex-col gap-3">
          {SORTS.map(s => (
            <label key={s.value} className="flex items-center gap-3 cursor-pointer group">
              <div className="w-4 h-4 border border-black flex items-center justify-center relative">
                <input type="radio" checked={filters.sort === s.value} onChange={() => onChange("sort", s.value)} className="absolute opacity-0" />
                {filters.sort === s.value && <div className="w-2.5 h-2.5 bg-black" />}
              </div>
              <span className="text-xs text-black tracking-wide uppercase">{s.label}</span>
            </label>
          ))}
        </div>
      </Section>

      <Section id="type" label="Category">
        <div className="flex flex-col gap-3">
          {ITEM_TYPES.map(t => (
            <label key={t} className="flex items-center gap-3 cursor-pointer group">
              <div className="w-4 h-4 border border-gray-400 flex items-center justify-center relative group-hover:border-black transition-colors">
                <input type="checkbox" checked={filters.type === t} onChange={() => onChange("type", filters.type === t ? "" : t)} className="absolute opacity-0" />
                {filters.type === t && <div className="w-2 h-2 bg-black" />}
              </div>
              <span className="text-xs text-black tracking-wide uppercase">{t}</span>
            </label>
          ))}
        </div>
      </Section>

      <Section id="school" label="School">
        <div className="flex flex-col gap-3 max-h-48 overflow-y-auto pr-2">
          {schools.map(s => (
            <label key={s._id} className="flex items-center gap-3 cursor-pointer group">
              <div className="w-4 h-4 border border-gray-400 flex items-center justify-center relative group-hover:border-black transition-colors">
                <input type="checkbox" checked={filters.school === s._id} onChange={() => onChange("school", filters.school === s._id ? "" : s._id)} className="absolute opacity-0" />
                {filters.school === s._id && <div className="w-2 h-2 bg-black" />}
              </div>
              <span className="text-xs text-black tracking-wide uppercase">{s.name}</span>
            </label>
          ))}
        </div>
      </Section>

      <Section id="size" label="Size">
        <div className="grid grid-cols-4 gap-2">
          {SIZES.map(s => (
            <button
              key={s}
              onClick={() => onChange("size", filters.size === s ? "" : s)}
              className={`text-[10px] font-bold uppercase py-2.5 border transition-colors ${
                filters.size === s
                  ? "border-black bg-black text-white"
                  : "border-gray-300 text-black hover:border-black"
              }`}
            >{s}</button>
          ))}
        </div>
      </Section>
    </div>
  );
}

// ─── Main PLP ─────────────────────────────────────────────────────────────────
function ProductsContent() {
  const searchParams = useSearchParams();

  const [products, setProducts]       = useState<Product[]>([]);
  const [schools, setSchools]         = useState<School[]>([]);
  const [total, setTotal]             = useState(0);
  const [page, setPage]               = useState(1);
  const [loading, setLoading]         = useState(true);
  const [drawerOpen, setDrawerOpen]   = useState(false);

  const [filters, setFilters] = useState({
    school:   searchParams.get("school")   || "",
    standard: searchParams.get("standard") || "",
    gender:   searchParams.get("gender")   || "",
    type:     searchParams.get("type")     || "",
    size:     searchParams.get("size")     || "",
    minPrice: searchParams.get("minPrice") || "0",
    maxPrice: searchParams.get("maxPrice") || "5000",
    sort:     searchParams.get("sort")     || "newest",
  });

  const LIMIT = 24;
  const filterHash = JSON.stringify(filters);

  useEffect(() => {
    api.get("/schools").then(r => setSchools(r.data.filter((s: any) => s.is_active))).catch(() => {});
  }, []);

  const fetchProducts = useCallback(async (pageNum = 1) => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page: pageNum, limit: LIMIT };
      Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
      const { data } = await api.get("/products", { params });
      setProducts(pageNum === 1 ? data.products : prev => [...prev, ...data.products]);
      setTotal(data.total);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { setPage(1); fetchProducts(1); }, [filters]);

  const handleFilterChange = (key: string, val: string) => {
    setFilters(f => ({ ...f, [key]: val }));
  };

  const handleClearAll = () => {
    setFilters({ school: "", standard: "", gender: "", type: "", size: "", minPrice: "0", maxPrice: "5000", sort: "newest" });
  };

  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !loading && products.length < total) {
        const next = page + 1;
        setPage(next);
        fetchProducts(next);
      }
    }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [loading, products.length, total, page, fetchProducts]);

  // Derived Title
  const isAll = !filters.type && !filters.gender && !filters.school;
  let pageTitle = "ALL PRODUCTS";
  if (!isAll) {
    const parts = [];
    if (filters.gender === "boy") parts.push("MEN'S");
    else if (filters.gender === "girl") parts.push("WOMEN'S");
    if (filters.type) parts.push(filters.type.toUpperCase() + "S");
    pageTitle = parts.join(" ") || "PRODUCTS";
  }

  return (
    <div className="w-full relative bg-white pb-20">
      {/* Huge Header Section */}
      <div className="px-4 md:px-8 pt-8 pb-6 w-full">
        <h1 className="text-4xl md:text-5xl lg:text-[42px] font-sans font-black tracking-wide uppercase text-black leading-none whitespace-nowrap overflow-hidden text-ellipsis mb-6 md:mb-8">
          {pageTitle}
        </h1>

        {/* Categories Row & Filter Toggle */}
        <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-2">
          {/* Horizontal scrollable tags */}
          <div className="flex items-center gap-6 overflow-x-auto no-scrollbar py-1 flex-1 pr-4">
            <button
              onClick={() => handleFilterChange("type", "")}
              className={`text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-colors ${
                !filters.type ? "text-black" : "text-gray-400 hover:text-black"
              }`}
            >
              ALL ITEMS
            </button>
            {ITEM_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => handleFilterChange("type", t)}
                className={`text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-colors ${
                  filters.type === t ? "text-black" : "text-gray-400 hover:text-black"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Filter button far right */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-black pl-4 flex-shrink-0"
          >
            FILTER <SlidersHorizontal size={12} strokeWidth={2} />
          </button>
        </div>
        
        {/* Results Count Line */}
        <div className="py-3 text-[10px] text-gray-500 uppercase tracking-widest">
          {total} Products
        </div>
      </div>

      {/* Main Full-Bleed Grid Area */}
      <div className="px-4 md:px-8">
        <AnimatePresence mode="wait">
          {loading && products.length === 0 ? (
            <motion.div 
              key="initial-loading"
              variants={gridContainerVariants}
              initial="hidden" animate="show" exit="exit"
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-1 gap-y-12 md:gap-x-2"
            >
              {[...Array(12)].map((_, i) => <SkeletonCard key={`skel-${i}`} />)}
            </motion.div>
          ) : products.length === 0 ? (
            <motion.div 
              key="empty-state"
              initial="hidden" animate="show" exit="exit"
              variants={gridContainerVariants}
              className="text-center py-32 w-full"
            >
              <h3 className="font-medium text-2xl text-black mb-2 uppercase tracking-wide">No items found</h3>
              <p className="text-sm text-gray-500 mb-8 uppercase tracking-widest">Try adjusting your filters.</p>
              <button onClick={handleClearAll} className="bg-black text-white text-[10px] font-bold uppercase tracking-widest px-10 py-4 hover:bg-gray-800 transition-colors">
                Clear Filters
              </button>
            </motion.div>
          ) : (
            <motion.div 
              key={filterHash}
              variants={gridContainerVariants}
              initial="hidden" animate="show" exit="exit"
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-1 gap-y-12 md:gap-x-2"
            >
              {products.map(p => <ProductCard key={p._id} product={p} />)}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Infinite scroll sentinel */}
        <div ref={sentinelRef} className="mt-16 flex flex-col items-center justify-center min-h-[48px]">
          {loading && products.length > 0 && (
            <motion.div 
              variants={skeletonContainerVariants}
              initial="hidden" animate="show"
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-1 gap-y-12 md:gap-x-2 w-full"
            >
              {[...Array(4)].map((_, i) => <SkeletonCard key={`inf-skel-${i}`} />)}
            </motion.div>
          )}
        </div>
      </div>

      {/* HM Style Sliding Right Drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-black/40 z-[100] backdrop-blur-[2px]"
              onClick={() => setDrawerOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 350, damping: 35 }}
              className="fixed top-0 right-0 h-full w-full max-w-[360px] bg-white z-[110] shadow-[-10px_0_30px_rgba(0,0,0,0.1)] flex flex-col"
            >
              <div className="flex items-center justify-between px-6 py-5">
                <h2 className="text-[14px] font-bold uppercase tracking-widest text-black">Filter</h2>
                <button onClick={() => setDrawerOpen(false)} className="text-black hover:opacity-50 transition-opacity">
                  <X size={20} strokeWidth={1.5} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto px-6 py-2">
                <FilterSidebar schools={schools} filters={filters} onChange={handleFilterChange} onClear={handleClearAll} />
              </div>

              <div className="px-6 py-4 flex gap-3 border-t border-[#E5E5E5] bg-white">
                <button 
                  onClick={handleClearAll}
                  className="flex-1 border border-black bg-white text-black text-[11px] font-bold uppercase tracking-widest py-3.5 hover:bg-gray-100 transition-colors"
                >
                  Clear
                </button>
                <button 
                  onClick={() => setDrawerOpen(false)}
                  className="flex-1 bg-black text-white text-[11px] font-bold uppercase tracking-widest py-3.5 hover:bg-gray-800 transition-colors"
                >
                  View [{total}]
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white overflow-x-hidden">
      <Navbar />
      <main className="flex-grow pb-10">
        <Suspense fallback={
          <div className="px-4 md:px-8 py-10 w-full">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-1 gap-y-12 md:gap-x-2">
              {[...Array(12)].map((_, i) => <SkeletonCard key={`fb-${i}`} />)}
            </div>
          </div>
        }>
          <ProductsContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
