"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Check } from "lucide-react";
import { InlineSpinner } from "../PageSpinner"; // Or use a custom spinner if needed

interface ButtonWithFeedbackProps {
  onClick: () => Promise<void> | void;
  disabled?: boolean;
  className?: string;
  defaultText?: string;
  successText?: string;
  successDuration?: number;
  icon?: React.ReactNode;
  successIcon?: React.ReactNode;
}

export default function ButtonWithFeedback({
  onClick,
  disabled = false,
  className = "",
  defaultText = "Add to Cart",
  successText = "Added ✓",
  successDuration = 2000,
  icon = <ShoppingBag size={14} />,
  successIcon = <Check size={14} />
}: ButtonWithFeedbackProps) {
  const [buttonState, setButtonState] = useState<"idle" | "loading" | "success">("idle");

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled || buttonState !== "idle") return;

    setButtonState("loading");
    
    try {
      await onClick();
      setButtonState("success");
    } catch (error) {
      setButtonState("idle");
    }
  };

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (buttonState === "success") {
      timeout = setTimeout(() => {
        setButtonState("idle");
      }, successDuration);
    }
    return () => clearTimeout(timeout);
  }, [buttonState, successDuration]);

  // Determine styles based on state
  const isSuccess = buttonState === "success";
  
  return (
    <motion.button
      whileTap={disabled ? undefined : { scale: 0.99 }} // scale(0.99) for full-width buttons as per rules
      onClick={handleClick}
      disabled={disabled || buttonState === "loading"}
      className={`
        relative overflow-hidden flex items-center justify-center font-bold uppercase tracking-widest transition-colors duration-300
        ${isSuccess
          ? "bg-[var(--color-teal)] text-white border-2 border-[var(--color-teal)]" 
          : className || "btn-primary" // Use className or fallback to btn-primary
        }
        ${disabled && buttonState !== "success" ? "opacity-50 cursor-not-allowed" : ""}
      `}
      style={{ borderRadius: 0 }}
    >
      {/* CSS-only sweep highlight shine (only when idle and not disabled) */}
      {!disabled && buttonState === "idle" && (
        <span className="absolute top-0 left-[-100%] w-1/2 h-full bg-white/20 skew-x-[-20deg] group-hover:animate-[sweep_0.6s_ease-in-out_forwards]" />
      )}

      <div className="relative z-10 flex items-center justify-center h-full w-full pointer-events-none">
        <AnimatePresence mode="wait">
          {buttonState === "idle" && (
            <motion.span
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2"
            >
              {icon} {defaultText}
            </motion.span>
          )}

          {buttonState === "loading" && (
            <motion.span
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2"
            >
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </motion.span>
          )}

          {buttonState === "success" && (
            <motion.span
              key="success"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2 text-white"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.05 }}
              >
                {successIcon}
              </motion.div>
              {successText}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </motion.button>
  );
}
