"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { ShoppingCart, ArrowRight } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { motion, AnimatePresence } from "framer-motion";

export default function CartSummaryBar() {
  const { totalItems, totalPrice } = useCart();
  const [mounted, setMounted] = useState(false);
  const [showBar, setShowBar] = useState(false);
  const prevTotalRef = useRef(totalPrice);

  useEffect(() => {
    setMounted(true);
    const onScroll = () => {
      setShowBar(window.scrollY > 200 || totalItems > 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [totalItems]);

  const isPriceChanged = mounted && prevTotalRef.current !== totalPrice;
  useEffect(() => {
    if (mounted) {
      prevTotalRef.current = totalPrice;
    }
  }, [totalPrice, mounted]);

  if (!mounted || totalItems === 0) return null;

  return (
    <AnimatePresence>
      {showBar && (
        <motion.div 
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          className="fixed bottom-0 inset-x-0 z-40"
        >
          <div className="bg-[var(--color-navy)] text-white shadow-[0_-10px_40px_rgba(47,65,86,0.15)]">
            <div className="max-w-7xl mx-auto px-6 py-5 md:py-6 flex flex-row items-center justify-between gap-4 md:gap-6">
              
              {/* left: summary */}
              <div className="flex items-center gap-4 md:gap-6">
                <div className="relative shrink-0">
                  <ShoppingCart size={24} className="text-white" />
                  <div className="absolute -top-2 -right-2 h-5 w-5 bg-[var(--color-sky)] rounded-full flex items-center justify-center overflow-hidden border border-[var(--color-navy)]">
                    <AnimatePresence mode="popLayout">
                      <motion.span 
                        key={totalItems}
                        initial={{ y: 12, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -12, opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="text-[var(--color-navy)] text-[10px] font-bold absolute"
                      >
                        {totalItems}
                      </motion.span>
                    </AnimatePresence>
                  </div>
                </div>
                
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-widest text-white/60 font-bold mb-0.5 hidden sm:block">
                    {totalItems} {totalItems === 1 ? "Item" : "Items"} in Selection
                  </span>
                  {/* Animated total price flash */}
                  <motion.div 
                    animate={isPriceChanged ? { backgroundColor: ["rgba(200,217,230,0.3)", "rgba(200,217,230,0)"] } : {}}
                    transition={{ duration: 0.4 }}
                    className="px-2 py-0.5 -ml-2 rounded"
                  >
                    <span className="text-xl md:text-2xl font-display font-bold inline-block text-white">
                      ₹{totalPrice.toLocaleString("en-IN")}
                    </span>
                  </motion.div>
                </div>
              </div>

              {/* right: CTA */}
              <Link
                href="/cart"
                className="bg-white text-[var(--color-navy)] px-6 md:px-10 py-3.5 md:py-4 font-bold uppercase tracking-widest text-[10px] md:text-xs flex items-center gap-2 hover:bg-[var(--color-sky)] transition-colors duration-200 shrink-0"
              >
                Review Cart
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
