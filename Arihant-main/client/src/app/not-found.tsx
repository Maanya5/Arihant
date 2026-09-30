import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Home, Search, ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page Not Found | Arihant Store",
  description: "The page you are looking for does not exist.",
};

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow flex items-center justify-center py-20 px-4">
        <div className="text-center max-w-lg mx-auto">
          {/* Big 404 */}
          <div className="relative mb-8">
            <div className="text-[10rem] font-heading font-bold text-[var(--color-teal)]/10 leading-none select-none">
              404
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-24 h-24 bg-[var(--color-teal)]/10 rounded-full flex items-center justify-center">
                <Search size={40} className="text-[var(--color-teal)]" />
              </div>
            </div>
          </div>

          <h1 className="text-4xl font-heading text-[var(--color-teal)] mb-4">
            Page Not Found
          </h1>
          <p className="text-gray-500 text-lg mb-10 leading-relaxed">
            Oops! The page you&apos;re looking for doesn&apos;t exist or may have been moved.
            Let&apos;s get you back on track.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="flex items-center justify-center gap-2 px-8 py-4 bg-[var(--color-teal)] text-white rounded-2xl font-bold hover:bg-[var(--color-teal)]/90 transition-all shadow-lg shadow-[var(--color-teal)]/20"
            >
              <Home size={18} /> Go to Homepage
            </Link>
            <Link
              href="/uniform/select-school"
              className="flex items-center justify-center gap-2 px-8 py-4 bg-white text-[var(--color-teal)] border-2 border-[var(--color-teal)]/20 rounded-2xl font-bold hover:border-[var(--color-teal)]/50 transition-all"
            >
              <ArrowLeft size={18} /> Browse Uniforms
            </Link>
          </div>

          <p className="mt-8 text-sm text-gray-400">
            Need help? Call us:{" "}
            <a href="tel:+919876543210" className="text-[var(--color-teal)] font-semibold hover:underline">
              +91 98765 43210
            </a>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
