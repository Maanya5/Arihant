"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle } from "lucide-react";

export type ToastType = "success" | "error";

export interface ToastProps {
  message: string;
  type: ToastType;
  onDismiss: () => void;
  duration?: number;
}

export default function AdminToast({ message, type, onDismiss, duration = 3000 }: ToastProps) {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        onDismiss();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [message, duration, onDismiss]);

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.25 }}
          className="fixed top-6 right-6 z-[100]"
        >
          <div
            className={`flex items-center gap-3 px-4 py-3 min-w-[280px] shadow-[0_4px_12px_rgba(0,0,0,0.1)] border ${
              type === "success" 
                ? "bg-[#F0FDF4] border-[#BBF7D0] text-[#166534]" 
                : "bg-[#FEF2F2] border-[#FECDD3] text-[#991B1B]"
            }`}
          >
            {type === "success" ? (
              <CheckCircle2 size={18} className="text-[#16A34A]" />
            ) : (
              <XCircle size={18} className="text-[#DC2626]" />
            )}
            <span className="text-sm font-medium">{message}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
