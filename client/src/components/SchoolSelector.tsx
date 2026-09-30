/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronRight, School, GraduationCap, Users, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import api from "@/lib/api";

export default function SchoolSelector() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [schools, setSchools] = useState<any[]>([]);
  const [selection, setSelection] = useState({
    school: "",
    class: "",
    gender: "",
  });

  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const res = await api.get("/schools");
        setSchools(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchSchools();
  }, []);

  const handleSelect = (key: string, value: string) => {
    setSelection({ ...selection, [key]: value });
    if (step < 3) setStep(step + 1);
  };

  const finishSelection = () => {
    router.push(`/uniform/${selection.school}/gender`);
  };

  const steps = [
    { title: "Select School", icon: School },
    { title: "Select Class", icon: GraduationCap },
    { title: "Select Gender", icon: Users },
  ];

  return (
    <div className="w-full max-w-2xl mx-auto card-editorial p-12">
      {/* Progress Bar */}
      <div className="flex justify-between mb-16 relative">
        <div className="absolute top-1/2 left-0 w-full h-px bg-[var(--color-teal)]/10 -translate-y-1/2" />
        {steps.map((s, i) => (
          <div key={i} className="relative z-10 flex flex-col items-center gap-3">
            <div className={`w-12 h-12 flex items-center justify-center transition-all duration-500 border ${step > i + 1 ? 'bg-[var(--color-teal)] text-white border-[var(--color-teal)]' : step === i + 1 ? 'bg-[var(--color-teal)] text-white border-[var(--color-teal)] scale-110' : 'bg-white text-[var(--color-teal)]/40 border-[var(--color-teal)]/10'}`} style={{ borderRadius: 0 }}>
              {step > i + 1 ? <Check size={20} /> : <s.icon size={20} />}
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-[0.2em] ${step === i + 1 ? 'text-[var(--color-teal)]' : 'text-[var(--color-teal)]/30'}`}>{s.title}</span>
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5, ease: [0.215, 0.61, 0.355, 1] }}
        >
          {step === 1 && (
            <div>
              <h2 className="text-3xl font-display text-[var(--color-teal)] mb-10 text-center tracking-tight">Which school do you belong to?</h2>
              <div className="grid grid-cols-1 gap-2">
                {schools.length > 0 ? schools.map((s) => (
                  <button
                    key={s._id}
                    onClick={() => handleSelect("school", s._id)}
                    className="w-full p-6 text-left bg-white border border-[var(--color-teal)]/5 hover:border-[var(--color-teal)]/30 hover:bg-white transition-all flex justify-between items-center group"
                  >
                    <div className="flex items-center gap-6">
                      {s.logo && (
                        <div className="w-14 h-14 bg-white border border-[var(--color-teal)]/5 flex items-center justify-center p-2 relative">
                          <Image src={s.logo || '/fallback-product.jpg'} alt={s.name} width={40} height={40} className="object-contain" loading="lazy" />
                        </div>
                      )}
                      <span className="text-xs font-bold uppercase tracking-widest text-[var(--color-teal)] group-hover:text-[var(--color-teal)] transition-colors">{s.name}</span>
                    </div>
                    <ChevronRight size={18} className="text-[var(--color-teal)] opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0" />
                  </button>
                )) : (
                  <div className="text-center py-20 section-eyebrow animate-pulse">Initializing school list...</div>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-3xl font-display text-[var(--color-teal)] mb-10 text-center tracking-tight">Choose your class</h2>
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: 12 }, (_, i) => `Class ${i + 1}`).map((c) => (
                  <button
                    key={c}
                    onClick={() => handleSelect("class", c)}
                    className="p-6 bg-white border border-[var(--color-teal)]/5 hover:border-[var(--color-teal)] hover:bg-white transition-all text-center text-xs font-bold uppercase tracking-widest text-[var(--color-teal)]"
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="text-3xl font-display text-[var(--color-teal)] mb-10 text-center tracking-tight">Final step: Gender</h2>
              <div className="grid grid-cols-2 gap-2">
                {["Boy", "Girl"].map((g) => (
                  <button
                    key={g}
                    onClick={() => {
                        setSelection({ ...selection, gender: g });
                    }}
                    className={`p-12 border transition-all duration-500 text-center group ${selection.gender === g ? 'bg-[var(--color-teal)] text-white border-[var(--color-teal)]' : 'bg-white border-[var(--color-teal)]/5 hover:border-[var(--color-teal)] text-[var(--color-teal)]'}`}
                    style={{ borderRadius: 0 }}
                  >
                    <div className="mb-6 flex justify-center">
                        <Users size={48} className={selection.gender === g ? 'text-white' : 'text-[var(--color-teal)]/40 group-hover:text-[var(--color-teal)] transition-colors'} />
                    </div>
                    <span className="text-xl font-display font-bold uppercase tracking-tight">{g}</span>
                  </button>
                ))}
              </div>
              <button
                onClick={finishSelection}
                disabled={!selection.gender}
                className="btn-primary w-full mt-12 !py-6 !text-base"
              >
                Proceed to Collection <ArrowRight size={20} />
              </button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {step > 1 && (
        <button 
          onClick={() => setStep(step - 1)}
          className="mt-12 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-teal)]/40 hover:text-[var(--color-teal)] transition-colors flex items-center gap-2"
        >
          <ChevronRight size={14} className="rotate-180" /> Go Back
        </button>
      )}
    </div>
  );
}
