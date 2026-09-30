"use client";

import { MessageCircle } from "lucide-react";

export default function WhatsAppButton() {
  const openWhatsApp = () => {
    window.open("https://wa.me/910000000000?text=Hello, I need help with my uniform order.", "_blank");
  };

  return (
    <div className="fixed bottom-12 right-12 z-50 flex items-center group">
      <button
        onClick={openWhatsApp}
        className="w-16 h-16 bg-[var(--color-navy)] text-white border border-[var(--color-teal)]/20 flex items-center justify-center transition-all duration-500 hover:bg-[var(--color-teal)] group-active:scale-95"
        aria-label="Contact on WhatsApp"
        style={{ borderRadius: 0 }}
      >
        <MessageCircle size={28} />
      </button>
      <div className="absolute right-16 overflow-hidden pointer-events-none">
        <div className="bg-white border border-[var(--color-teal)]/10 px-6 py-4 translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out border-r-0">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-teal)] whitespace-nowrap">
            Personal Concierge
          </span>
        </div>
      </div>
    </div>
  );
}
