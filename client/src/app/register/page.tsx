"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useCheckoutStore } from "@/store/checkoutStore";
import { useUniformStore } from "@/store/uniformStore";
import { useFilterStore } from "@/store/filterStore";
import { useCart } from "@/context/CartContext";
import { UserPlus, User } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const resetCheckout = useCheckoutStore((state) => state.resetCheckout);
  const resetUniformFlow = useUniformStore((state) => state.resetUniformFlow);
  const clearFilters = useFilterStore((state) => state.clearFilters);
  const { clearCart } = useCart();
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      return setError("Passwords do not match");
    }

    setLoading(true);

    try {
      // Clear any previous user's stale state
      clearCart();
      resetCheckout();
      resetUniformFlow();
      clearFilters();

      const res = await api.post("/auth/register", {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password
      });
      // Auto-login after register
      login(res.data.user, res.data.token);
      router.push("/");
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-grow flex items-center justify-center p-4">
        <div className="bg-white p-8 sm:p-12 rounded-[40px] shadow-xl shadow-[var(--color-teal)]/5 border border-[var(--color-teal)]/10 w-full max-w-md my-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-[var(--color-teal)]/10 rounded-2xl flex items-center justify-center text-[var(--color-teal)] mx-auto mb-4">
              <UserPlus size={32} />
            </div>
            <h1 className="text-3xl font-heading text-[var(--color-teal)]">Create Account</h1>
            <p className="text-gray-500 mt-2">Join Arihant Store to checkout easily</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-500 p-4 rounded-xl mb-6 text-sm font-semibold border border-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-600 mb-1 ml-1">Full Name</label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[var(--color-teal)]/20 outline-none transition-all"
                placeholder="Enter full name"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-600 mb-1 ml-1">Email</label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[var(--color-teal)]/20 outline-none transition-all"
                placeholder="Enter email"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-600 mb-1 ml-1">Phone Number</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[var(--color-teal)]/20 outline-none transition-all"
                placeholder="Optional"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-600 mb-1 ml-1">Password</label>
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[var(--color-teal)]/20 outline-none transition-all"
                placeholder="Create a password"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-600 mb-1 ml-1">Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[var(--color-teal)]/20 outline-none transition-all"
                placeholder="Confirm password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 mt-6 bg-[var(--color-teal)] text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-[var(--color-teal)]/90 transition-all disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Account"}
            </button>
          </form>

          <p className="text-center text-gray-500 mt-8 text-sm">
            Already have an account?{" "}
            <Link href="/login" className="text-[var(--color-teal)] font-bold hover:underline">
              Log In
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
