"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Users, ArrowLeft, Check } from "lucide-react";
import { useUniformStore } from "@/store/uniformStore";
import { motion, AnimatePresence } from "framer-motion";
import WizardProgress from "@/components/uniform/WizardProgress";

export default function SelectGenderPage() {
  const router = useRouter();
  const { schoolId } = useParams();

  const setGender = useUniformStore((state) => state.setGender);
  const [selectedGender, setSelectedGender] = useState<string | null>(null);

  const handleSelect = (g: string) => {
    setSelectedGender(g);
    setGender(g);
    // Delay routing slightly to allow selection animation to play
    setTimeout(() => {
      router.push(`/uniform/${schoolId}/class`);
    }, 400);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <WizardProgress currentStep={2} />

      <div className="max-w-2xl mx-auto mt-6">
        <motion.button 
          whileHover={{ x: -3 }}
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-[var(--color-teal)] hover:text-[var(--color-navy)] transition-colors duration-150 mb-6 text-sm font-bold uppercase tracking-widest"
        >
          <ArrowLeft size={14} />
          <span>Back</span>
        </motion.button>

        <div className="text-center mb-10">
          <span className="text-[var(--color-teal)] text-[11px] uppercase tracking-widest font-bold mb-2 block">Step 2 of 4</span>
          <h1 className="font-display text-[clamp(1.8rem,3vw,2.5rem)] font-bold text-[var(--color-navy)] mb-2">Choose Gender</h1>
          <p className="font-sans text-[var(--color-teal)] text-sm max-w-sm mx-auto">Select the appropriate category to find the perfect fit.</p>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-6">
          {["Boy", "Girl"].map((g) => {
            const isSelected = selectedGender === g;
            
            return (
              <motion.button
                key={g}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleSelect(g)}
                className={`relative w-full sm:w-[280px] h-[180px] p-6 flex flex-col items-center justify-center transition-all duration-220 ease-out bg-white ${
                  isSelected 
                    ? "border-[2px] border-[var(--color-navy)] bg-[var(--color-surface-alt)] shadow-[0_0_0_3px_rgba(47,65,86,0.08)]" 
                    : "border-[2px] border-[var(--color-border)] hover:border-[var(--color-teal)] hover:bg-[var(--color-surface-alt)] hover:-translate-y-[4px] hover:shadow-[0_12px_28px_rgba(47,65,86,0.12)]"
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
                      className="absolute top-3 right-3 w-7 h-7 rounded-full bg-[var(--color-navy)] flex items-center justify-center text-white shadow-sm z-20"
                    >
                      <Check size={14} strokeWidth={3} />
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="mb-3 flex justify-center">
                  <div className="text-[var(--color-navy)]">
                    <Users size={36} strokeWidth={1.5} />
                  </div>
                </div>
                <span className="font-display text-2xl text-[var(--color-navy)] mb-1">{g}s</span>
                <span className="text-[13px] text-[var(--color-teal)]">Uniform kit for {g.toLowerCase()}s</span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
