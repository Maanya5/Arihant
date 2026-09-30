"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useCheckoutStore } from "@/store/checkoutStore";
import { useUniformStore } from "@/store/uniformStore";
import { useFilterStore } from "@/store/filterStore";
import { useCart } from "@/context/CartContext";
import { Loader2, Eye, EyeOff } from "lucide-react";

/** Loading Spinner */
function Loader({ size = 20, className = "" }: { size?: number; className?: string }) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <Loader2 size={size} className="animate-spin text-current opacity-20" />
      <div
        className="absolute inset-0 animate-pulse rounded-full bg-current opacity-10"
        style={{ width: size, height: size }}
      />
      <Loader2
        size={size}
        className="absolute animate-spin text-current"
        style={{ animationDuration: '1.5s' }}
      />
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 384 512" fill="currentColor">
      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
    </svg>
  );
}

function TwitterIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 512 512" fill="currentColor">
      <path d="M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8L200.7 275.5 26.8 48H172.4L272.9 180.9 389.2 48zM364.4 421.8h39.1L151.1 88h-42L364.4 421.8z"/>
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { loginWithGoogle, loading: authLoading } = useAuth();

  const login = useAuthStore((state) => state.login);
  const resetCheckout = useCheckoutStore((state) => state.resetCheckout);
  const resetUniformFlow = useUniformStore((state) => state.resetUniformFlow);
  const clearFilters = useFilterStore((state) => state.clearFilters);
  const { clearCart } = useCart();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  /* ── Google OAuth via Firebase ────────────────────────────────── */
  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError("");
    try {
      await loginWithGoogle();
      // AuthContext handles the sync with backend and redirection
    } catch (err: any) {
      console.error("Google sign-in error:", err);
      setError("Google sign-in failed. Please try again.");
      setGoogleLoading(false);
    }
  };

  /* ── Email / Password ──────────────────────────── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      clearCart();
      resetCheckout();
      resetUniformFlow();
      clearFilters();

      const res = await api.post("/auth/login", { email, password });
      login(res.data.user, res.data.token);
      router.push("/");
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || "Invalid credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen w-full flex items-center justify-center p-4 bg-cover bg-center bg-no-repeat bg-fixed relative"
      style={{ backgroundImage: "url('/images/malik-hammad-1AHq3ktxXqk-unsplash.jpg')" }}
    >
      {/* Container matching screenshot styling */}
      <div className="w-full max-w-[900px] min-h-[550px] rounded-3xl overflow-hidden flex flex-col md:flex-row relative z-10 shadow-2xl">
        
        {/* LEFT PANEL - Solid Dark */}
        <div className="w-full md:w-[480px] bg-[#161616] flex-shrink-0 p-10 flex flex-col justify-center">
          
         

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-white text-3xl font-semibold mb-2">Welcome Back</h1>
            <p className="text-gray-400 text-sm">Enter your credentials to jump in right now.</p>
          </div>

          {error && (
            <div className="bg-red-500/10 text-red-500 p-3 rounded-lg mb-6 text-sm font-medium border border-red-500/20">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3.5 bg-[#202020] border-none text-white text-sm rounded-xl focus:ring-1 focus:ring-gray-600 outline-none transition-all placeholder:text-gray-500"
                placeholder="Input Email"
              />
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3.5 pr-12 bg-[#202020] border-none text-white text-sm rounded-xl focus:ring-1 focus:ring-gray-600 outline-none transition-all placeholder:text-gray-500"
                placeholder="Choose Password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Checkbox */}
            <div className="flex items-center gap-3 pt-1 pb-3">
              <div className="relative flex items-center">
                <input 
                  type="checkbox" 
                  id="agree" 
                  required
                  className="peer appearance-none w-4 h-4 rounded border border-gray-600 bg-transparent checked:bg-[#FF4C3B] checked:border-[#FF4C3B] transition-colors cursor-pointer"
                />
                <svg className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 pointer-events-none opacity-0 peer-checked:opacity-100 text-white" viewBox="0 0 14 14" fill="none">
                  <path d="M1 7.5L4.5 11L13 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <label htmlFor="agree" className="text-[12px] text-gray-400 cursor-pointer">
                I Agree On The <span className="text-white hover:underline">Rules & Privacy Notice</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-white text-black rounded-xl font-bold text-sm hover:bg-gray-100 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader size={18} className="text-black" />
              ) : (
                "Launch Account"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-[#333]" />
            <span className="text-[11px] text-gray-500">or join us via</span>
            <div className="flex-1 h-px bg-[#333]" />
          </div>

          {/* Social Buttons */}
          <div className="grid grid-cols-3 gap-3 ">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading || authLoading}
              className="flex items-center justify-center gap-2 py-3 bg-[#202020] rounded-xl text-xs font-medium text-white hover:bg-[#2A2A2A] transition-colors disabled:opacity-50"
            >
              <GoogleIcon /> Google
            </button>
          
          </div>

          {/* Footer Text */}
          <div className="mt-8 text-center">
            <p className="text-[11px] text-gray-500">
              Don't Hold An Account?{" "}
              <Link href="/register" className="text-white font-medium hover:underline">
                Register
              </Link>
            </p>
          </div>

        </div>

        {/* RIGHT PANEL - Glassmorphic Overlay */}
        <div className="hidden md:flex flex-1 bg-white/5 backdrop-blur-md relative border-l border-white/10 flex-col items-center justify-center p-12 text-center">
          <div className="w-28 h-28 rounded-full bg-white/10 border border-white/20 flex items-center justify-center mb-8 backdrop-blur-xl shadow-[0_0_40px_rgba(255,255,255,0.1)]">
            <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-lg overflow-hidden p-2">
              <Image 
                src="/logo.png" 
                alt="Arihant Logo" 
                width={80} 
                height={80} 
                className="w-full h-full object-contain" 
              />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-white mb-4 tracking-wide font-display">Arihant Store</h2>
          <p className="text-white/70 text-sm leading-relaxed max-w-sm">
            Your trusted partner for premium school uniforms and accessories. We deliver comfort, durability, and style straight to your doorstep.
          </p>
        </div>

      </div>
    </div>
  );
}
