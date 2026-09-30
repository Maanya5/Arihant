import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-[var(--color-navy)] text-white py-24 mt-auto border-t border-[var(--color-teal)]/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-16">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-3 mb-8">
              <span className="text-2xl font-display font-bold tracking-tight text-white flex items-center">
                <Image src="/logo.png" alt="Arihant Store" width={140} height={40} className="h-10 w-auto object-contain brightness-0 invert" />
              </span>
            </div>
            <p className="text-xs uppercase tracking-widest leading-relaxed opacity-60 max-w-md">
              A slender luxury editorial experience for the modern student. Your trusted partner for school uniforms for decades, now bringing quality and convenience to your doorstep.
            </p>
          </div>
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--color-sky)] mb-8">Navigation</h3>
            <ul className="space-y-4 text-[10px] font-bold uppercase tracking-widest">
              <li><a href="/uniform/select-school" className="hover:text-white transition-colors">Shop Uniforms</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Sizing Guide</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Shipping Policy</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--color-sky)] mb-8">Contact</h3>
            <ul className="space-y-4 text-[10px] font-bold uppercase tracking-widest">
              <li className="opacity-60">WA: +91 00000 00000</li>
              <li className="opacity-60">EM: contact@arihantstore.com</li>
              <li className="opacity-60">HQ: Shop No. 123, Main Market</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/5 mt-20 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[9px] uppercase tracking-[0.2em] opacity-40">
            © {new Date().getFullYear()} Arihant Store. Crafted for excellence.
          </p>
          <div className="flex gap-8 opacity-40 text-[9px] uppercase tracking-[0.2em]">
            <a href="#" className="hover:opacity-100">Privacy</a>
            <a href="#" className="hover:opacity-100">Terms</a>
            <a href="#" className="hover:opacity-100">Accessibility</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
