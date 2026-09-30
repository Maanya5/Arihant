import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function UniformLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg)] overflow-x-hidden">
      <Navbar />
      <div className="flex-grow pt-24 pb-16 w-full max-w-[1100px] mx-auto px-4 md:px-6">
        {children}
      </div>
      <Footer />
    </div>
  );
}
