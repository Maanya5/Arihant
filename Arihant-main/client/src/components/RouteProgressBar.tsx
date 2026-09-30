"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";

const ROUTE_CHANGE_START = "route-change-start";
const ROUTE_CHANGE_END = "route-change-end";

function isLocalLink(anchor: HTMLAnchorElement): boolean {
  const href = anchor.getAttribute("href");
  if (!href) return false;

  // Ignore external links
  if (href.startsWith("http://") || href.startsWith("https://") || href.startsWith("//")) {
    try {
      const url = new URL(href);
      if (url.origin !== window.location.origin) return false;
    } catch {
      return false;
    }
  }

  // Ignore non-navigation schemes
  if (
    href.startsWith("#") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:") ||
    href.startsWith("javascript:")
  ) {
    return false;
  }

  // Ignore download links or new tabs
  if (anchor.hasAttribute("download") || anchor.target === "_blank") {
    return false;
  }

  // Check if it's the exact same pathname and search params
  try {
    const targetUrl = new URL(href, window.location.href);
    const currentUrl = new URL(window.location.href);
    if (targetUrl.pathname === currentUrl.pathname && targetUrl.search === currentUrl.search) {
      return false;
    }
  } catch {
    return false;
  }

  return true;
}

export default function RouteProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const [useReducedMotion, setUseReducedMotion] = useState(false);

  const isRunningRef = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Check for prefers-reduced-motion
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setUseReducedMotion(mediaQuery.matches);

    const listener = (e: MediaQueryListEvent) => {
      setUseReducedMotion(e.matches);
    };

    mediaQuery.addEventListener("change", listener);
    return () => mediaQuery.removeEventListener("change", listener);
  }, []);

  const startProgress = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    isRunningRef.current = true;
    setProgress(70); // Declarative target for the crawl
    setIsVisible(true);
  };

  const completeProgress = () => {
    if (!isRunningRef.current) return;
    isRunningRef.current = false;

    if (timerRef.current) clearTimeout(timerRef.current);
    setProgress(100);

    // Keep bar visible at 100% for a brief duration so the user sees it complete
    timerRef.current = setTimeout(() => {
      setIsVisible(false);
      // Wait for opacity fade-out animation to complete before resetting width to 0%
      timerRef.current = setTimeout(() => {
        setProgress(0);
      }, useReducedMotion ? 50 : 200);
    }, useReducedMotion ? 50 : 200);
  };

  // Listen to navigation completion via pathname/searchParams updates
  useEffect(() => {
    completeProgress();
  }, [pathname, searchParams]);

  // Hook into route transition events
  useEffect(() => {
    const handleStart = () => startProgress();
    const handleEnd = () => completeProgress();

    window.addEventListener(ROUTE_CHANGE_START, handleStart);
    window.addEventListener(ROUTE_CHANGE_END, handleEnd);

    return () => {
      window.removeEventListener(ROUTE_CHANGE_START, handleStart);
      window.removeEventListener(ROUTE_CHANGE_END, handleEnd);
    };
  }, [useReducedMotion]);

  // Intercept click and popstate events
  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a");

      if (!anchor) return;

      if (!isLocalLink(anchor)) return;

      window.dispatchEvent(new CustomEvent(ROUTE_CHANGE_START));
    };

    const handlePopState = () => {
      window.dispatchEvent(new CustomEvent(ROUTE_CHANGE_START));
    };

    document.addEventListener("click", handleAnchorClick);
    window.addEventListener("popstate", handlePopState);

    return () => {
      document.removeEventListener("click", handleAnchorClick);
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  // Patch window.fetch to capture programmatic Next.js navigations (RSC fetches)
  useEffect(() => {
    const originalFetch = window.fetch;

    window.fetch = async function (input, init) {
      let isRscFetch = false;
      let isPrefetch = false;

      if (init && init.headers) {
        const headers = new Headers(init.headers);
        if (headers.get("rsc") === "1" || headers.get("RSC") === "1") {
          isRscFetch = true;
        }
        if (
          headers.get("purpose") === "prefetch" ||
          headers.get("x-next-router-prefetch") === "1"
        ) {
          isPrefetch = true;
        }
      }

      if (isRscFetch && !isPrefetch) {
        window.dispatchEvent(new CustomEvent(ROUTE_CHANGE_START));
      }

      try {
        const response = await originalFetch.apply(this, [input, init]);
        if (isRscFetch && !isPrefetch) {
          window.dispatchEvent(new CustomEvent(ROUTE_CHANGE_END));
        }
        return response;
      } catch (error) {
        if (isRscFetch && !isPrefetch) {
          window.dispatchEvent(new CustomEvent(ROUTE_CHANGE_END));
        }
        throw error;
      }
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  const widthVal = progress === 0 ? "0%" : progress === 100 ? "100%" : "70%";

  return (
    <motion.div
      initial={{ width: "0%", opacity: 0 }}
      animate={{
        width: widthVal,
        opacity: isVisible ? 1 : 0,
      }}
      transition={{
        width:
          progress === 100
            ? { duration: useReducedMotion ? 0.05 : 0.2, ease: "easeOut" }
            : { duration: useReducedMotion ? 0.1 : 8, ease: "easeOut" },
        opacity: { duration: useReducedMotion ? 0.05 : 0.2 },
      }}
      className="fixed top-0 left-0 h-[3px] bg-[#567C8D] z-[99999] pointer-events-none"
    />
  );
}
