"use client";

import { useCart } from "@/context/CartContext";
import { useAuthStore } from "@/store/authStore";
import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import CardNav from "./CardNav";

export default function Navbar() {
  const { totalItems, isHydrated: cartHydrated } = useCart();
  const { isAuthenticated, fullLogout, user } = useAuthStore();
  const { logout: firebaseLogout } = useAuth();
  const { clearCart } = useCart();
  const router = useRouter();
  const pathname = usePathname();
  const isHome = pathname === "/";

  const handleLogout = async () => {
    try {
      await firebaseLogout();
      clearCart();
      fullLogout();
      router.push("/");
    } catch {}
  };

  const shopLinks = [
    { label: "Home", href: "/", ariaLabel: "Home" },
    { label: "School Uniforms", href: "/uniform/select-school", ariaLabel: "School Uniforms" },
    { label: "All Products", href: "/products", ariaLabel: "All Products" },
  ];

  const accountLinks = isAuthenticated
    ? [
        { label: `Profile (${user?.name?.split(' ')[0] || 'User'})`, href: "/account", ariaLabel: "Profile" },
        ...(user?.role === 'admin' ? [{ label: "Admin Panel", href: "/admin", ariaLabel: "Admin Panel" }] : []),
        { label: "Orders", href: "/account/orders", ariaLabel: "Orders" },
        { label: "Wishlist", href: "/account?tab=wishlist", ariaLabel: "Wishlist" },
      ]
    : [
        { label: "Login", href: "/login", ariaLabel: "Login" },
        { label: "Register", href: "/register", ariaLabel: "Register" },
      ];

  const moreLinks = [
    { label: `Cart (${cartHydrated ? totalItems : 0})`, href: "/cart", ariaLabel: "Cart" },
    ...(isAuthenticated ? [{ label: "Logout", onClick: handleLogout, ariaLabel: "Logout" }] : []),
  ];

  const items = [
    {
      label: "Shop",
      bgColor: "var(--color-navy)",
      textColor: "#fff",
      links: shopLinks
    },
    {
      label: "Account",
      bgColor: "var(--color-teal)",
      textColor: "#fff",
      links: accountLinks
    },
    {
      label: "More",
      bgColor: "#C8D9E6",
      textColor: "var(--color-navy)",
      links: moreLinks
    }
  ];

  return (
    <>
      <div 
        className="fixed top-0 w-full z-50 bg-[var(--color-navy)] text-[var(--color-sky)] overflow-hidden flex items-center"
        style={{ height: 36 }}
      >
        <div className="w-full relative whitespace-nowrap">
          <div className="animate-marquee inline-block font-sans text-[12px] tracking-[0.08em] uppercase">
            {/* The content is repeated to ensure continuous scrolling */}
            <span className="mx-8">Free delivery on orders above ₹999</span>
            <span className="mx-8">|</span>
            <span className="mx-8">New Session 2025-26 Uniforms Now Available</span>
            <span className="mx-8">|</span>
            <span className="mx-8">10-Day Easy Returns</span>
            <span className="mx-8">|</span>
            <span className="mx-8">Free delivery on orders above ₹999</span>
            <span className="mx-8">|</span>
            <span className="mx-8">New Session 2025-26 Uniforms Now Available</span>
            <span className="mx-8">|</span>
            <span className="mx-8">10-Day Easy Returns</span>
          </div>
        </div>
      </div>

      <div style={{ paddingTop: '36px' }}>
        <CardNav
          logo="/logo.png"
          logoAlt="Arihant Store Logo"
          items={items}
          baseColor="#fff"
          menuColor="var(--color-ink)"
          buttonBgColor="var(--color-navy)"
          buttonTextColor="#fff"
          ease="power3.out"
          className="fixed top-0"
        />
      </div>

      {/* Global spacer to push page content down below the fixed navbar */}
      {!isHome && <div style={{ height: '108px' }} className="w-full flex-shrink-0" />}
    </>
  );
}
