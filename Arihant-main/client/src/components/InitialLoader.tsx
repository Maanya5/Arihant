"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import PageSpinner from "@/components/PageSpinner";

export default function InitialLoader() {
  const { loading: authLoading } = useAuth();
  const [showSpinner, setShowSpinner] = useState(true);
  const mountTimeRef = useRef<number | null>(null);

  if (mountTimeRef.current === null) {
    mountTimeRef.current = Date.now();
  }

  useEffect(() => {
    if (!authLoading) {
      const elapsed = Date.now() - (mountTimeRef.current ?? Date.now());
      const delay = Math.max(0, 400 - elapsed);

      const t = setTimeout(() => {
        setShowSpinner(false);
      }, delay);

      return () => clearTimeout(t);
    }
  }, [authLoading]);

  if (!showSpinner) return null;
  return <PageSpinner />;
}

