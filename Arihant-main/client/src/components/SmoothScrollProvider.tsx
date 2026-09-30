"use client";

import React, { createContext, useEffect, useRef, useState } from "react";
import Lenis from "lenis";

interface LenisContextType {
  lenis: Lenis | null;
  pause: () => void;
  resume: () => void;
}

export const LenisContext = createContext<LenisContextType>({
  lenis: null,
  pause: () => { },
  resume: () => { },
});

export default function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  const [lenisInstance, setLenisInstance] = useState<Lenis | null>(null);
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    // Disable smooth scroll on mobile devices (width < 768px) for native scroll performance
    const isMobile = window.innerWidth < 768;
    if (isMobile) return;

    // Initialize Lenis with optimized settings
    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      smoothWheel: true,
      touchMultiplier: 2,
    });

    lenisRef.current = lenis;
    setLenisInstance(lenis);

    // Run Lenis frame updates via requestAnimationFrame loop
    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    // Removed manual native scroll event dispatch to prevent infinite loop.
    // Lenis and Framer Motion sync naturally since Lenis updates the native scroll position.

    // Auto-detect when body is scroll-locked (e.g. modals/drawers open) and stop Lenis scroll
    const observer = new MutationObserver(() => {
      const isLocked =
        document.body.style.overflow === "hidden" ||
        document.body.classList.contains("overflow-hidden") ||
        document.documentElement.style.overflow === "hidden" ||
        document.documentElement.classList.contains("overflow-hidden");

      if (isLocked) {
        lenis.stop();
      } else {
        lenis.start();
      }
    });

    observer.observe(document.body, { attributes: true, attributeFilter: ["style", "class"] });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["style", "class"] });

    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
      lenis.destroy();
    };
  }, []);

  const pause = () => {
    if (lenisRef.current) {
      lenisRef.current.stop();
    }
  };

  const resume = () => {
    if (lenisRef.current) {
      lenisRef.current.start();
    }
  };

  return (
    <LenisContext.Provider value={{ lenis: lenisInstance, pause, resume }}>
      {children}
    </LenisContext.Provider>
  );
}
