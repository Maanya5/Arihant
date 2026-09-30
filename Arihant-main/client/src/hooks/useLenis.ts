"use client";

import { useContext } from "react";
import { LenisContext } from "@/components/SmoothScrollProvider";

export const useLenis = () => {
  const context = useContext(LenisContext);
  if (context === undefined) {
    throw new Error("useLenis must be used within a SmoothScrollProvider");
  }
  return context;
};
