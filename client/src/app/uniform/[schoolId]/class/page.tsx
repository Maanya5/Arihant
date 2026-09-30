"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useUniformStore } from "@/store/uniformStore";
import api from "@/lib/api";
import { motion, Variants } from "framer-motion";
import WizardProgress from "@/components/uniform/WizardProgress";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.04 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  show: { 
    opacity: 1, 
    scale: 1,
    transition: { type: "spring", stiffness: 300, damping: 24 } 
  }
};

export default function SelectClassPage() {
  const router = useRouter();
  const { schoolId } = useParams();
  const setClassRange = useUniformStore((state) => state.setClassRange);
  const gender = useUniformStore((state) => state.gender);

  const [availableClasses, setAvailableClasses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await api.get(`/standards?school=${schoolId}`);
        const genderMap: Record<string, string> = { Boy: 'boy', Girl: 'girl' };
        const genderVal = genderMap[gender || ''] || 'boy';

        const filtered = res.data.filter(
          (s: any) => s.gender === genderVal
        );

        const uniqueClasses = Array.from(
          new Set(filtered.map((s: any) => s.class_name))
        ) as string[];

        setAvailableClasses(uniqueClasses as string[]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (schoolId) fetchClasses();
  }, [schoolId, gender]);

  const handleSelect = (classNum: string) => {
    setSelectedClass(classNum);
    setClassRange(classNum);
    // Delay routing slightly to allow pulse/select animation
    setTimeout(() => {
      router.push(`/uniform/${schoolId}/kit`);
    }, 400);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <WizardProgress currentStep={3} />

      <div className="max-w-3xl mx-auto mt-6">
        <motion.button 
          whileHover={{ x: -3 }}
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-[var(--color-teal)] hover:text-[var(--color-navy)] transition-colors duration-150 mb-6 text-sm font-bold uppercase tracking-widest"
        >
          <ArrowLeft size={14} />
          <span>Back</span>
        </motion.button>

        <div className="text-center mb-10">
          <span className="text-[var(--color-teal)] text-[11px] uppercase tracking-widest font-bold mb-2 block">Step 3 of 4</span>
          <h1 className="font-display text-[clamp(1.8rem,3vw,2.5rem)] font-bold text-[var(--color-navy)] mb-2">Select Your Class</h1>
          <p className="font-sans text-[var(--color-teal)] text-sm max-w-sm mx-auto">Choose the class to see the required uniform checklist.</p>
        </div>

        <div className="bg-white p-6 md:p-10 border border-[var(--color-border)] shadow-sm" style={{ borderRadius: 0 }}>
          {loading ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(80px,1fr))] gap-2">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="h-[52px] bg-[var(--color-sky)]/30 animate-pulse" style={{ borderRadius: 0 }} />
              ))}
            </div>
          ) : availableClasses.length > 0 ? (
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid grid-cols-[repeat(auto-fill,minmax(80px,1fr))] gap-2"
            >
              {availableClasses.map((c) => {
                const isSelected = selectedClass === c;
                return (
                  <motion.button
                    key={c}
                    variants={itemVariants}
                    animate={isSelected ? { scale: [1, 1.07, 1] } : {}}
                    transition={{ duration: 0.3 }}
                    whileTap={{ scale: 0.94 }}
                    onClick={() => handleSelect(c)}
                    className={`h-[52px] w-full flex items-center justify-center text-[13px] font-semibold transition-colors duration-150 ${
                      isSelected 
                        ? "bg-[var(--color-navy)] text-white border-[1.5px] border-[var(--color-navy)]" 
                        : "bg-white text-[var(--color-navy)] border-[1.5px] border-[var(--color-border)] hover:bg-[var(--color-surface-alt)] hover:border-[var(--color-teal)]"
                    }`}
                    style={{ borderRadius: 0 }}
                  >
                    {c}
                  </motion.button>
                );
              })}
            </motion.div>
          ) : (
            <div className="text-center py-10 text-[var(--color-ink-subtle)]">No classes found.</div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
