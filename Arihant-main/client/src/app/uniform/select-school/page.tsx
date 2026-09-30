"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ChevronRight, School, Check, Search } from "lucide-react";
import api from "@/lib/api";
import { motion, AnimatePresence, Variants } from "framer-motion";
import WizardProgress from "@/components/uniform/WizardProgress";

import { InlineSpinner } from "@/components/PageSpinner";
import ErrorBanner from "@/components/ErrorBanner";
import { EmptySchools } from "@/components/EmptyState";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } 
  }
};

export default function SelectSchoolPage() {
  const router = useRouter();
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const fetchSchools = async () => {
    try {
      const res = await api.get("/schools");
      setSchools(res.data);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to load schools");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchools();
  }, []);

  const handleSelect = (schoolId: string) => {
    setSelectedSchoolId(schoolId);
    // Delay routing slightly to allow premium selection animation to play
    setTimeout(() => {
      router.push(`/uniform/${schoolId}/gender`);
    }, 400);
  };

  const filteredSchools = schools.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || (s.city && s.city.toLowerCase().includes(searchQuery.toLowerCase())));

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <WizardProgress currentStep={1} />

      <div className="text-center mb-10 mt-6">
        <span className="text-[var(--color-teal)] text-[11px] uppercase tracking-widest font-bold mb-2 block">Step 1 of 4</span>
        <h1 className="font-display text-[clamp(1.8rem,3vw,2.5rem)] font-bold text-[var(--color-navy)] mb-2">Select Your School</h1>
        <p className="font-sans text-[var(--color-teal)] text-sm max-w-sm mx-auto">Choose your school to see the official uniform kits.</p>
      </div>

      <div className="max-w-5xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="relative mb-8 max-w-xl mx-auto"
        >
          <Search 
            size={18} 
            className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200 ${isFocused ? 'text-[var(--color-teal)]' : 'text-[var(--color-ink-subtle)]'}`} 
          />
          <input
            type="text"
            placeholder="Search for your school..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className="w-full bg-white border-[1.5px] border-[var(--color-border)] px-4 py-[14px] pl-11 text-sm text-[var(--color-ink)] placeholder-[var(--color-ink-subtle)] outline-none transition-all duration-200 focus:border-[var(--color-teal)] focus:shadow-[0_0_0_3px_rgba(86,124,141,0.15)]"
            style={{ borderRadius: 0 }}
          />
        </motion.div>

        {loading ? (
          <div className="py-12">
            <InlineSpinner message="Finding schools..." />
          </div>
        ) : error ? (
          <ErrorBanner 
            type="server" 
            message="We couldn't load the schools list. Please try again." 
            onRetry={() => {
              setLoading(true);
              setError(null);
              fetchSchools();
            }} 
          />
        ) : filteredSchools.length > 0 ? (
          <motion.div 
            variants={containerVariants} 
            initial="hidden" 
            animate="show" 
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4"
          >
            {filteredSchools.map((s) => {
              const isSelected = selectedSchoolId === s._id;
              
              return (
                <motion.button
                  key={s._id}
                  variants={itemVariants}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleSelect(s._id)}
                  className={`relative w-full text-left p-4 lg:p-5 flex flex-col justify-between group overflow-hidden transition-all duration-200 ease-out bg-white ${
                    isSelected 
                      ? "border-[2px] border-[var(--color-navy)] bg-[var(--color-surface-alt)] shadow-[0_0_0_3px_rgba(47,65,86,0.08)]" 
                      : "border border-[var(--color-border)] hover:border-[var(--color-teal)] hover:-translate-y-[3px] hover:shadow-[0_8px_20px_rgba(47,65,86,0.1)]"
                  }`}
                  style={{ borderRadius: 0 }}
                >
                   {/* Checkmark Badge */}
                   <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 400, damping: 20 }}
                        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-[var(--color-navy)] flex items-center justify-center text-white shadow-sm z-20"
                      >
                        <Check size={14} strokeWidth={3} />
                      </motion.div>
                    )}
                   </AnimatePresence>

                   <div className="flex flex-col relative z-10 w-full h-full">
                      {s.logo ? (
                        <div className="w-[52px] h-[52px] bg-white border border-[var(--color-border)] flex items-center justify-center p-1 mb-3 relative overflow-hidden" style={{ borderRadius: 0 }}>
                          <Image src={s.logo || '/fallback-product.jpg'} alt={s.name} fill sizes="52px" className="object-contain p-1" loading="lazy" />
                        </div>
                      ) : (
                        <div className="w-[52px] h-[52px] bg-[var(--color-navy)] flex items-center justify-center text-white mb-3 font-display text-xl" style={{ borderRadius: 0 }}>
                          {s.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <h3 className={`text-[14px] font-bold leading-tight line-clamp-2 transition-colors ${isSelected ? 'text-[var(--color-navy)]' : 'text-[var(--color-navy)]'}`}>{s.name}</h3>
                        <p className="text-[11px] text-[var(--color-teal)] mt-1">{s.area || s.city || 'City not specified'}</p>
                      </div>
                   </div>
                </motion.button>
              );
            })}
          </motion.div>
        ) : (
          <EmptySchools />
        )}
      </div>
    </motion.div>
  );
}
