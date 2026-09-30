"use client";

import { motion } from "framer-motion";

interface StepIndicatorProps {
  currentStep: number;
}

export default function StepIndicator({ currentStep }: StepIndicatorProps) {
  const steps = [
    { num: 1, label: "School" },
    { num: 2, label: "Gender" },
    { num: 3, label: "Class" },
    { num: 4, label: "Kit" }
  ];

  const fillPercentage = ((currentStep - 1) / (steps.length - 1)) * 100;

  return (
    <div className="w-full max-w-xl mx-auto mb-10 px-4 pt-4">
      <div className="relative">
        {/* Background Track */}
        <div className="absolute top-[3px] left-0 w-full h-[2px] bg-[#C8D9E6]" />
        
        {/* Animated Fill Track */}
        <motion.div 
          className="absolute top-[3px] left-0 h-[2px] bg-[var(--color-teal)]"
          initial={{ width: 0 }}
          animate={{ width: `${fillPercentage}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />

        {/* Step Nodes */}
        <div className="relative flex justify-between">
          {steps.map((step) => {
            const isCompleted = currentStep > step.num;
            const isCurrent = currentStep === step.num;
            
            return (
              <div key={step.num} className="flex flex-col items-center">
                <motion.div 
                  initial={false}
                  animate={{
                    backgroundColor: isCompleted ? "#567C8D" : (isCurrent ? "#FFFFFF" : "#C8D9E6"),
                    borderColor: (isCurrent || isCompleted) ? "#567C8D" : "#C8D9E6"
                  }}
                  transition={{ duration: 0.3 }}
                  className="w-2 h-2 rounded-full border-2 relative z-10"
                />
                <span 
                  className={`absolute top-5 text-[10px] uppercase tracking-widest font-bold transition-colors duration-300 ${
                    (isCurrent || isCompleted) ? "text-[var(--color-ink)]" : "text-[var(--color-ink-muted)]/60"
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
