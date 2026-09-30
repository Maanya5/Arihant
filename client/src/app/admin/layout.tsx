"use client";

import Link from "next/link";
import { LayoutDashboard, Package, ShoppingCart, School, ArrowLeft, LogOut, Menu, X, BarChart3, Database, LayoutTemplate } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, fullLogout } = useAuthStore();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== "admin") {
      router.push("/");
    } else {
      setIsAuthorized(true);
    }
  }, [isAuthenticated, user, router]);

  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  const navItems = [
    { name: "Overview", href: "/admin", icon: LayoutDashboard },
    { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
    { name: "Orders", href: "/admin/orders", icon: ShoppingCart },
    { name: "Inventory", href: "/admin/inventory", icon: Database },
    { name: "Products", href: "/admin/products", icon: Package },
    { name: "Schools", href: "/admin/schools", icon: School },
    { name: "Home Page", href: "/admin/homepage", icon: LayoutTemplate },
  ];

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
        <div className="w-8 h-8 border-2 border-[var(--color-navy)] border-t-transparent animate-spin" />
      </div>
    );
  }

  const handleLogout = () => { fullLogout(); router.push("/"); };

  const SidebarContent = () => (
    <>
      <div className="p-6 border-b border-[var(--color-navy)]/10">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 bg-[var(--color-navy)] text-white flex items-center justify-center font-bold text-lg font-display">A</div>
          <span className="font-display font-bold text-[var(--color-ink)] text-xl">Arihant Store</span>
        </Link>
        <div className="mt-2 text-[9px] uppercase tracking-widest text-[var(--color-ink-muted)] font-bold">Admin Console</div>
      </div>

      <nav className="flex-grow py-6 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3 px-6 py-3 text-xs font-bold uppercase tracking-widest transition-all ${
                isActive 
                  ? "bg-[#567C8D]/12 text-[var(--color-ink)] border-l-[3px] border-[#567C8D]" 
                  : "text-[var(--color-ink)]/70 hover:bg-[var(--color-navy)]/5 hover:text-[var(--color-ink)] border-l-[3px] border-transparent"
              }`}
            >
              <div className="transition-transform duration-150 ease-out group-hover:scale-110 group-hover:translate-x-[2px] flex items-center gap-3">
                <Icon size={16} />
                <span>{item.name}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-6 border-t border-[var(--color-navy)]/10 bg-white">
        <div className="mb-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-[var(--color-navy)] text-white flex items-center justify-center font-bold text-lg">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-[var(--color-ink)] truncate">{user?.name}</div>
            <div className="text-[10px] text-[var(--color-ink-muted)] truncate">{user?.email}</div>
          </div>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-red-600 hover:text-red-700 w-full p-2 border border-red-200 bg-red-50 hover:bg-red-100 transition-colors justify-center">
          <LogOut size={14} /> Logout
        </button>
      </div>
    </>
  );

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[var(--color-bg)]">
      <aside className="hidden md:flex w-64 bg-white border-r border-[var(--color-navy)]/10 flex-shrink-0 flex-col z-10 sticky top-0 h-screen">
        <SidebarContent />
      </aside>

      <div className="md:hidden flex items-center justify-between bg-[var(--color-navy)] text-white px-4 py-3 sticky top-0 z-40">
        <Link href="/" className="font-display font-bold text-lg flex items-center gap-2">
          <ArrowLeft size={16} /> Admin
        </Link>
        <button onClick={() => setSidebarOpen(true)} className="p-2 border border-white/20 hover:bg-white/10"><Menu size={18} /></button>
      </div>

      {sidebarOpen && <div className="fixed inset-0 bg-[var(--color-navy)]/50 z-50 md:hidden" onClick={() => setSidebarOpen(false)} />}

      <div className={`fixed top-0 left-0 h-full w-72 bg-white border-r border-[var(--color-navy)]/10 z-[60] flex flex-col transform transition-transform duration-300 md:hidden ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-navy)]/10">
          <span className="font-display font-bold text-[var(--color-ink)] text-lg">Admin</span>
          <button onClick={() => setSidebarOpen(false)} className="p-2 text-[var(--color-ink)] hover:bg-[var(--color-navy)]/5"><X size={18} /></button>
        </div>
        <SidebarContent />
      </div>

      <main className="flex-grow overflow-x-hidden min-h-screen relative">
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes pulse-dot {
            0% { opacity: 1; }
            50% { opacity: 0.3; }
            100% { opacity: 1; }
          }
          .low-stock-dot {
            display: inline-block;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background-color: #C8D9E6;
            animation: pulse-dot 1.2s infinite;
          }
          /* Global Admin Table Row Hover */
          main table tbody tr {
            transition: background-color 150ms ease, border-left-color 150ms ease !important;
            border-left: 4px solid transparent !important;
          }
          main table tbody tr:hover {
            background-color: rgba(68, 161, 148, 0.06) !important;
          }
          main table tbody tr.active-row {
            background-color: rgba(68, 161, 148, 0.12) !important;
            border-left-color: #567C8D !important;
          }
        `}} />
        {children}
      </main>
    </div>
  );
}
