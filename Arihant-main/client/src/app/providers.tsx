"use client";

import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import SmoothScrollProvider from "@/components/SmoothScrollProvider";
import { MotionConfig } from "framer-motion";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CartProvider>
        <MotionConfig reducedMotion="user">
          <SmoothScrollProvider>{children}</SmoothScrollProvider>
        </MotionConfig>
      </CartProvider>
    </AuthProvider>
  );
}

