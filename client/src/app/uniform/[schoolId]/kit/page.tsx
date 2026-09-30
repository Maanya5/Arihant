"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import CartSummaryBar from "@/components/CartSummaryBar";
import CatalogueItemCard from "@/components/CatalogueItemCard";
import api from "@/lib/api";
import { ArrowLeft, Package } from "lucide-react";
import { useUniformStore } from "@/store/uniformStore";
import { motion, AnimatePresence } from "framer-motion";
import WizardProgress from "@/components/uniform/WizardProgress";

/* ── loading skeleton ── */
function SkeletonCard() {
  return (
    <div className="bg-white border border-[var(--color-border)] overflow-hidden animate-pulse" style={{ borderRadius: 0 }}>
      <div className="aspect-[4/5] bg-[var(--color-sky)]/30" />
      <div className="p-8 space-y-4">
        <div className="h-5 bg-[var(--color-sky)]/30 w-3/4" />
        <div className="h-7 bg-[var(--color-sky)]/30 w-1/3" />
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="w-12 h-12 bg-[var(--color-sky)]/30" />
          ))}
        </div>
        <div className="h-12 bg-[var(--color-sky)]/30 w-1/2 mt-4" />
        <div className="h-14 bg-[var(--color-sky)]/30 w-full mt-6" />
      </div>
    </div>
  );
}

export default function CataloguePage() {
  const router = useRouter();
  const { schoolId } = useParams();
  const gender = useUniformStore((state) => state.gender);
  const classNum = useUniformStore((state) => state.classRange);

  const [items, setItems] = useState<any[]>([]);
  const [schoolData, setSchoolData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"regular" | "sports">("regular");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const fetchItems = async () => {
      try {
        const schoolRes = await api.get(`/schools/${schoolId}`);
        setSchoolData(schoolRes.data);

        const genderMap: Record<string, string> = { Boy: "boy", Girl: "girl" };
        const genderVal = genderMap[gender || ""] || "boy";

        const standards = schoolRes.data.standards || [];
        const match = standards.find(
          (s: any) => s.class_name === classNum && s.gender === genderVal
        );

        if (!match) {
          setError("No uniform standard found for this class/gender combination.");
          return;
        }

        const itemsRes = await api.get(`/uniform-items/school/${schoolId}/standard/${match._id}`);
        setItems(itemsRes.data.products || itemsRes.data || []);
      } catch (err: any) {
        console.error(err);
        setError("Could not load catalogue. Please try a different selection.");
      } finally {
        setLoading(false);
      }
    };

    if (schoolId && gender && classNum) {
      fetchItems();
    }
  }, [schoolId, gender, classNum]);

  const filteredItems = items.filter((item) => (item.uniform_type || "regular") === activeTab);

  /* ── Empty state ── */
  if (!loading && (error || items.length === 0)) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="flex items-center justify-center px-4 py-20"
      >
        <div className="max-w-md text-center bg-white p-10 border border-[var(--color-border)] shadow-sm" style={{ borderRadius: 0 }}>
          <div className="w-20 h-20 bg-[var(--color-surface-alt)] flex items-center justify-center mx-auto mb-6 text-[var(--color-navy)]" style={{ borderRadius: 0 }}>
            <Package size={40} />
          </div>
          <h2 className="text-3xl font-display text-[var(--color-navy)] mb-3 font-bold">
            No Items Found
          </h2>
          <p className="text-[var(--color-ink-muted)] mb-8 font-sans text-sm">
            {error || "There are no uniform items available for this selection."}
          </p>
          <button
            onClick={() => router.back()}
            className="btn-primary w-full py-4 text-xs tracking-widest"
          >
            Go Back
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col"
    >
      <WizardProgress currentStep={4} />

      <div className="max-w-7xl mx-auto w-full mt-6">
        <motion.button 
          whileHover={{ x: -3 }}
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-[var(--color-teal)] hover:text-[var(--color-navy)] transition-colors duration-150 mb-6 text-sm font-bold uppercase tracking-widest"
        >
          <ArrowLeft size={14} />
          <span>Back</span>
        </motion.button>

        {/* Page Title Header */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[var(--color-border)] pb-8">
          <div>
            <span className="text-[var(--color-teal)] text-[11px] uppercase tracking-widest font-bold mb-2 block">Step 4 of 4</span>
            <div className="flex items-center gap-4">
              {schoolData?.logo && (
                <div className="w-14 h-14 bg-white border border-[var(--color-border)] flex items-center justify-center p-1 shrink-0">
                  <Image src={schoolData.logo} alt="Logo" width={48} height={48} className="object-contain" />
                </div>
              )}
              <div>
                <h1 className="font-display text-[clamp(1.8rem,3vw,2.5rem)] font-bold text-[var(--color-navy)] leading-tight">
                  {schoolData?.name || "School"} Uniforms
                </h1>
                <p className="font-sans text-[var(--color-teal)] text-sm mt-1">
                  {isMounted ? `Class ${classNum} • ${gender}` : "Loading..."}
                </p>
              </div>
            </div>
          </div>
          
          {/* Tab Switcher */}
          {!loading && items.length > 0 && (
            <div className="flex border-b-2 border-[var(--color-border)] relative">
              {(["regular", "sports"] as const).map((tab) => {
                const isActive = activeTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`relative px-5 py-3 text-[13px] font-semibold uppercase tracking-wider transition-colors duration-200 ${
                      isActive ? "text-[var(--color-navy)]" : "text-[var(--color-ink-subtle)] hover:text-[var(--color-teal)]"
                    }`}
                  >
                    {tab} Uniform
                    {isActive && (
                      <motion.div
                        layoutId="tab-indicator"
                        className="absolute bottom-[-2px] left-0 right-0 h-[3px] bg-[var(--color-navy)]"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Tab Content area */}
        <div className="pb-32">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <SkeletonCard key={i} />
                ))}
              </motion.div>
            ) : filteredItems.length > 0 ? (
              <motion.div 
                key={`items-${activeTab}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
              >
                {filteredItems.map((item) => (
                  <CatalogueItemCard key={item._id} item={item} />
                ))}
              </motion.div>
            ) : (
              <motion.div 
                key={`empty-${activeTab}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="text-center py-20 bg-white border border-[var(--color-border)] shadow-sm"
              >
                <Package size={32} className="mx-auto text-[var(--color-ink-subtle)] mb-4" />
                <h3 className="text-xl font-display font-bold text-[var(--color-navy)] mb-2">No {activeTab} items</h3>
                <p className="text-[var(--color-teal)] text-sm">There are no {activeTab} uniform items currently available for this class.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Sticky Cart Summary */}
      <CartSummaryBar />
    </motion.div>
  );
}
