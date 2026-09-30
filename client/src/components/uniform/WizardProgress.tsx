"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";

interface WizardProgressProps {
  currentStep: number;
}

export default function WizardProgress({ currentStep }: WizardProgressProps) {
  const steps = [
    { num: 1, label: "School" },
    { num: 2, label: "Gender" },
    { num: 3, label: "Class" },
    { num: 4, label: "Kit" }
  ];

  const totalSteps = steps.length;
  // Width from 0% to 100% depending on current step
  const fillPercentage = ((currentStep - 1) / (totalSteps - 1)) * 100;

  return (
    <div className="w-full max-w-[500px] mx-auto py-8">
      <div className="relative">
        
        {/* Progress Track Background */}
        <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-[var(--color-sky)] -translate-y-1/2 z-0" />
        
        {/* Animated Fill Track */}
        <motion.div 
          className="absolute top-1/2 left-0 h-[2px] bg-[var(--color-teal)] -translate-y-1/2 z-0"
          initial={{ width: 0 }}
          animate={{ width: `${fillPercentage}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />

        {/* Step Nodes */}
        <div className="relative flex justify-between z-10">
          {steps.map((step) => {
            const isCompleted = currentStep > step.num;
            const isCurrent = currentStep === step.num;
            const isUpcoming = currentStep < step.num;
            
            return (
              <div key={step.num} className="flex flex-col items-center relative">
                <div className="relative flex items-center justify-center w-8 h-8">
                  {/* Current step pulse ring */}
                  {isCurrent && (
                    <div className="absolute inset-0 rounded-full border-2 border-[var(--color-teal)] animate-[ring-pulse_2s_ease-in-out_infinite]" />
                  )}

                  <motion.div 
                    initial={false}
                    animate={{
                      backgroundColor: isCompleted ? "var(--color-navy)" : "#FFFFFF",
                      borderColor: isCompleted ? "var(--color-navy)" : isCurrent ? "var(--color-teal)" : "var(--color-sky)",
                      borderWidth: isCompleted ? 0 : 2
                    }}
                    transition={{ duration: 0.3 }}
                    className="w-8 h-8 rounded-full flex items-center justify-center relative z-10"
                    style={{ borderRadius: "50%" }} // explicit override if needed, though instructions said 0px globally, "circle" usually stays round. The instructions say "Step dots: 32x32... circle". 
                  >
                    <AnimatePresence mode="wait">
                      {isCompleted ? (
                        <motion.div
                          key="check"
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        >
                          <Check size={14} className="text-white" strokeWidth={3} />
                        </motion.div>
                      ) : (
                        <motion.div
                          key="number"
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ type: "spring", stiffness: 300, damping: 20 }}
                          className="flex items-center justify-center"
                        >
                          {isCurrent ? (
                            <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-teal)]" />
                          ) : (
                            <span className="text-xs font-bold text-[var(--color-ink-subtle)]">{step.num}</span>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </div>

                <span 
                  className={`absolute top-10 text-[11px] uppercase tracking-[0.1em] font-bold transition-colors duration-300 whitespace-nowrap ${
                    (isCurrent || isCompleted) ? "text-[var(--color-ink)]" : "text-[var(--color-ink-subtle)]"
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <style jsx>{`
        @keyframes ring-pulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.5); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
