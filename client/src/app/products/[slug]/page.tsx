"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Truck, Heart, ShoppingCart, X, Ruler } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import api from "@/lib/api";
import { useCart } from "@/context/CartContext";
import { useWishlistStore } from "@/store/wishlistStore";
import { useRecentlyViewedStore } from "@/store/recentlyViewedStore";
import ProductImageGallery from "@/components/ProductImageGallery";
import ButtonWithFeedback from "@/components/ui/ButtonWithFeedback";

const fmt = (p: number) => `₹${(p / 100).toLocaleString("en-IN")}`;

interface Variant { _id: string; size: string; stock_qty: number; is_available: boolean; }
interface Product {
  _id: string; name: string; item_type: string;
  price_paisa: number; mrp_paisa?: number | null;
  primary_image?: string; images?: Array<{ url: string }>;
  itemSlug?: string; school_id?: { _id: string; name: string; city: string; logo?: string };
  standard_id?: { _id: string; class_name: string; gender: string };
  variants?: Variant[];
}

// ─── Accordion ───────────────────────────────────────────────────────────────
function Accordion({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-t border-[#C8D9E6]">
      <button onClick={() => setOpen(o => !o)} className="w-full flex justify-between items-center py-4 text-[14px] font-[600] text-[#2F4156]">
        {title}
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.3, ease: 'easeInOut' }}>
          <ChevronDown size={14} />
        </motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }} 
            animate={{ height: "auto", opacity: 1 }} 
            exit={{ height: 0, opacity: 0 }} 
            transition={{ duration: 0.3, ease: 'easeInOut' }} 
            style={{ overflow: 'hidden' }}
          >
            <div className="pb-4 text-[14px] text-[#567C8D] leading-[1.7]">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Delivery Estimator ───────────────────────────────────────────────────────
function DeliveryEstimator() {
  const [pincode, setPincode] = useState("");
  const [result, setResult]   = useState<{ estimatedDate: string; days: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const check = async () => {
    if (!/^\d{6}$/.test(pincode)) { setError("Enter a valid 6-digit pincode."); return; }
    setError(""); setLoading(true);
    try {
      const { data } = await api.post("/delivery/estimate", { pincode });
      setResult(data);
    } catch { setError("Could not check delivery."); }
    finally { setLoading(false); }
  };

  return (
    <div className="mt-8 mb-6">
      <p className="text-[12px] font-bold uppercase tracking-widest text-[#2F4156] mb-3 flex items-center gap-2">
        <Truck size={14} /> Delivery Estimate
      </p>
      <div className="flex gap-3 items-end">
        <div className="flex-1 relative">
          <input
            type="text" maxLength={6} value={pincode} onChange={e => setPincode(e.target.value.replace(/\D/, ""))}
            placeholder="Enter Pincode"
            className="w-full border-b-[1.5px] border-[#C8D9E6] px-1 py-2 text-sm bg-transparent focus:outline-none focus:border-[#567C8D] focus:shadow-[0_4px_6px_-2px_rgba(86,124,141,0.15)] transition-all duration-200"
            style={{ borderRadius: 0 }}
          />
        </div>
        <button onClick={check} disabled={loading}
          className="btn-ghost !px-4 !py-2 !text-[11px]">
          {loading ? "..." : "Check"}
        </button>
      </div>
      <AnimatePresence mode="wait">
        {error && (
          <motion.div key="error" variants={{ shake: { x: [0, -6, 6, -4, 4, 0] } }} animate="shake" transition={{ duration: 0.35 }} className="mt-3 text-[12px] text-red-500">
            {error}
          </motion.div>
        )}
        {result && !error && (
          <motion.p key="result" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="text-[12px] text-[#567C8D] font-[600] mt-3 flex items-center gap-1.5">
            <Truck size={12} /> Estimated delivery by {result.estimatedDate}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Bulk Inquiry Modal ───────────────────────────────────────────────────────
function BulkModal({ product, onClose }: { product: Product; onClose: () => void }) {
  const [form, setForm] = useState({ name: "", phone: "", quantity: "5", message: "" });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      await api.post("/inquiries", { ...form, quantity: parseInt(form.quantity), item: product._id, school: product.school_id?._id });
      setSent(true);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
        className="absolute inset-0 bg-[#2F4156]/60 backdrop-blur-sm" onClick={onClose} 
      />
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} transition={{ duration: 0.3, ease: "easeOut" }}
        className="relative bg-[#FFFFFF] w-full max-w-md border border-[#C8D9E6] p-8 shadow-2xl"
        style={{ borderRadius: 0 }}
      >
        <button onClick={onClose} className="absolute top-4 right-4"><X size={16} className="text-[#8AAABB] hover:text-[#2F4156]" /></button>
        {sent ? (
          <div className="text-center py-6">
            <div className="text-3xl mb-4 text-[#567C8D]">✓</div>
            <h3 className="font-display text-xl font-bold text-[#2F4156] mb-2">Inquiry Submitted!</h3>
            <p className="text-sm text-[#567C8D]">Our team will contact you within 24 hours.</p>
          </div>
        ) : (
          <>
            <h3 className="font-display text-xl font-bold text-[#2F4156] mb-1">Bulk Order Inquiry</h3>
            <p className="text-xs text-[#567C8D] mb-6">For 5+ students — get school pricing</p>
            <form onSubmit={submit} className="space-y-3">
              {[["name","Name*","text"],["phone","Phone*","tel"],["quantity","Quantity*","number"]].map(([k,p,t]) => (
                <input key={k} type={t} placeholder={p} required value={(form as any)[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
                  className="w-full border border-[#C8D9E6] px-4 py-3 text-sm bg-transparent focus:outline-none focus:border-[#567C8D] transition-colors" style={{ borderRadius: 0 }} />
              ))}
              <textarea placeholder="Additional notes" value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} rows={3}
                className="w-full border border-[#C8D9E6] px-4 py-3 text-sm bg-transparent focus:outline-none focus:border-[#567C8D] transition-colors resize-none" style={{ borderRadius: 0 }} />
              <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? "Submitting..." : "Submit Inquiry"}</button>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
}

// ─── Product Details ────────────────────────────────────────────────────────
function ProductDetails({ product }: { product: Product }) {
  return (
    <div className="mt-16 max-w-3xl">
      <h2 className="text-2xl font-display font-bold text-[#2F4156] mb-6">Product Details</h2>
      <Accordion title="Description">
        <p>This premium {product.name} is designed to meet strict school standards while providing all-day comfort. Made from durable materials that withstand regular washing and daily active use.</p>
      </Accordion>
      <Accordion title="Fabric & Material">
        <p>Premium breathable cotton-polyester blend. Wrinkle-resistant, color-fast, and easy to iron. Ideal for year-round school wear.</p>
      </Accordion>
      <Accordion title="Washing Care">
        <p>Machine wash cold (30°C). Do not bleach. Tumble dry low. Iron on medium heat. Do not dry clean.</p>
      </Accordion>
      <Accordion title="Size Guide">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse mt-2">
            <thead>
              <tr className="border-b border-[#C8D9E6]">
                {["Size","Chest (cm)","Length (cm)"].map(h => <th key={h} className="text-left py-3 font-[600] text-[#2F4156] pr-4">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {[["S","80-85","68"],["M","86-91","71"],["L","92-97","74"],["XL","98-103","77"],["XXL","104-109","80"]].map(row => (
                <tr key={row[0]} className="border-b border-[#C8D9E6]/40">
                  {row.map((c,i) => <td key={i} className="py-3 pr-4 text-[#567C8D]">{c}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Accordion>
      <Accordion title="Return Policy">
        <p>Easy 10-day returns on all unwashed, unworn, and unaltered items with original tags. Contact support for a free pickup request.</p>
      </Accordion>
    </div>
  );
}

// ─── Product Info Panel ──────────────────────────────────────────────────────
function ProductInfo({ product, onBulkClick }: { product: Product, onBulkClick: () => void }) {
  const [selectedSize, setSize] = useState("");
  const [addedMsg, setAddedMsg] = useState("");
  const { addItem } = useCart();
  const { isWishlisted, toggleItem } = useWishlistStore();

  const variants = product.variants ?? [];
  const disc = product.mrp_paisa && product.mrp_paisa > product.price_paisa ? Math.round(((product.mrp_paisa - product.price_paisa) / product.mrp_paisa) * 100) : 0;
  const selStock = variants.find(v => v.size === selectedSize)?.stock_qty ?? 0;

  const handleAddToCart = async () => {
    if (!selectedSize) { 
      setAddedMsg("Please select a size first."); 
      setTimeout(() => setAddedMsg(""), 2000); 
      throw new Error("No size");
    }
    
    // Simulate slight API delay for premium feel
    await new Promise(r => setTimeout(r, 400));
    
    addItem({ 
      id: product._id, 
      name: product.name, 
      price: product.price_paisa / 100, 
      image: product.primary_image || "", 
      size: selectedSize, 
      quantity: 1, 
      schoolName: product.school_id?.name 
    });
  };

  const wishlisted = isWishlisted(product._id);

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>
        <p className="text-[#567C8D] text-[11px] uppercase tracking-[0.12em] mb-3">
          {product.item_type || "Uniform"}
        </p>
        <h1 className="font-display text-[#2F4156] text-[clamp(1.8rem,3vw,2.6rem)] leading-tight mb-4">
          {product.name}
        </h1>
        {product.standard_id && (
          <p className="text-[13px] text-[#567C8D] mb-6">
            {product.standard_id.class_name} · {product.standard_id.gender === "boy" ? "Boys" : product.standard_id.gender === "girl" ? "Girls" : "Unisex"}
            {product.school_id ? ` · ${product.school_id.name}` : ""}
          </p>
        )}
      </motion.div>

      {/* Price */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }} className="flex items-center gap-3 mb-8">
        <span className="text-[#2F4156] text-2xl font-[700]">{fmt(product.price_paisa)}</span>
        {product.mrp_paisa && product.mrp_paisa > product.price_paisa && (
          <span className="text-[#8AAABB] text-base line-through ml-2">{fmt(product.mrp_paisa)}</span>
        )}
        {disc > 0 && <span className="bg-[#C8D9E6] text-[#2F4156] text-[11px] px-2 py-0.5 font-[600] uppercase">{disc}% OFF</span>}
      </motion.div>

      <div className="h-[1px] w-full bg-[#C8D9E6] mb-8" />

      {/* Size selector */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.4 }} className="mb-8">
        <p className="text-[#2F4156] text-[12px] uppercase tracking-wider font-[600] mb-4">Select Size</p>
        <div className="flex flex-wrap gap-2">
          {variants.map(v => (
            <motion.button
              key={v.size}
              onClick={() => v.is_available && setSize(v.size)}
              disabled={!v.is_available}
              title={!v.is_available ? "Out of stock" : `${v.stock_qty} left`}
              whileTap={v.is_available ? { scale: 0.92 } : undefined}
              className={`relative min-w-[48px] h-10 px-3 text-[13px] font-[700] border-[1.5px] transition-colors duration-150 overflow-hidden ${
                selectedSize === v.size
                  ? "bg-[#2F4156] text-[#FFFFFF] border-[#2F4156]"
                  : v.is_available
                    ? "bg-[#FFFFFF] text-[#2F4156] border-[#C8D9E6] hover:border-[#567C8D] hover:bg-[#EEF4F8]"
                    : "bg-[#F5EFEB] text-[#8AAABB] border-[#C8D9E6] cursor-not-allowed"
              }`}
              style={{ borderRadius: 0 }}
            >
              {v.size}
              {!v.is_available && (
                <span className="absolute inset-0 block pointer-events-none before:absolute before:top-1/2 before:left-[-10%] before:w-[120%] before:h-[1px] before:bg-[#8AAABB] before:-rotate-[25deg]" />
              )}
            </motion.button>
          ))}
        </div>
        {selectedSize && selStock > 0 && selStock <= 3 && (
          <p className="text-[12px] font-[600] text-[#567C8D] mt-3">Only {selStock} left in this size!</p>
        )}
        
        {/* Size Guide Link */}
        <div className="mt-4">
          <button className="flex items-center gap-1.5 text-[#567C8D] text-[12px] group">
            <Ruler size={14} />
            <span className="link-animated font-[600]">Size Guide &rarr;</span>
          </button>
        </div>
      </motion.div>

      {/* Add to cart feedback */}
      <AnimatePresence>
        {addedMsg && (
          <motion.p initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={`text-[12px] font-[600] mb-3 ${addedMsg.includes("select") ? "text-red-500" : "text-[#567C8D]"}`}>
            {addedMsg}
          </motion.p>
        )}
      </AnimatePresence>

      {/* CTAs */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.5 }} className="flex flex-col gap-4 mb-8">
        <ButtonWithFeedback
          onClick={() => handleAddToCart()}
          className="btn-primary w-full py-4 text-[13px]"
          defaultText="Add to Cart"
          successText="Added to Cart!"
          icon={<ShoppingCart size={16} />}
        />
        
        <button onClick={() => toggleItem(product._id)} className="btn-ghost w-full">
          <motion.div
            initial={false}
            animate={{ scale: wishlisted ? [1, 1.35, 1] : 1 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <Heart size={14} fill={wishlisted ? "#567C8D" : "none"} className={wishlisted ? "text-[#567C8D]" : "text-[#567C8D]"} />
          </motion.div>
          {wishlisted ? "Saved to Wishlist" : "Save to Wishlist"}
        </button>
      </motion.div>

      <div className="h-[1px] w-full bg-[#C8D9E6] mb-8" />

      <DeliveryEstimator />

      {/* Bulk CTA */}
      <button onClick={onBulkClick} className="w-full mt-4 bg-[#EEF4F8] border border-[#C8D9E6] text-[#567C8D] text-[12px] font-[600] py-4 hover:bg-[#567C8D] hover:text-[#FFFFFF] transition-colors duration-300">
        Ordering for 5+ students? Get school pricing &rarr;
      </button>
    </div>
  );
}

// ─── PDP Main ─────────────────────────────────────────────────────────────────
export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct]       = useState<Product | null>(null);
  const [loading, setLoading]       = useState(true);
  const [bulkOpen, setBulkOpen]     = useState(false);
  const [related, setRelated]       = useState<Product[]>([]);
  const [freqBought, setFreqBought] = useState<Product[]>([]);
  
  const { addItem: addRecent }      = useRecentlyViewedStore();

  useEffect(() => {
    api.get(`/products/${slug}`).then(({ data }) => {
      setProduct(data);
      setLoading(false);
      addRecent(data._id);
      if (data.school_id?._id)    api.get(`/products/recommendations?schoolId=${data.school_id._id}&exclude=${data._id}&limit=6`).then(r => setRelated(r.data)).catch(() => {});
      if (data.standard_id?._id)  api.get(`/products/frequently-bought?standardId=${data.standard_id._id}&excludeId=${data._id}&limit=3`).then(r => setFreqBought(r.data)).catch(() => {});
    }).catch(() => setLoading(false));
  }, [slug]);

  if (loading) return (
    <div className="min-h-screen flex flex-col bg-[#F5EFEB]">
      <Navbar />
      <div className="max-w-[1200px] mx-auto px-6 md:px-12 pt-24 pb-16 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          <div className="aspect-[4/5] bg-[#C8D9E6] animate-shimmer" />
          <div className="space-y-4 pt-10">
            {[40,24,16,16,32,48].map((h,i) => <div key={i} className={`h-${h > 20 ? "10" : h > 12 ? "6" : "4"} bg-[#C8D9E6] animate-shimmer`} style={{ height: h }} />)}
          </div>
        </div>
      </div>
    </div>
  );

  if (!product) return (
    <div className="min-h-screen flex flex-col bg-[#F5EFEB]"><Navbar />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="font-display text-2xl font-bold text-[#2F4156] mb-4">Product not found.</p>
          <Link href="/products" className="btn-primary">Browse All Products</Link>
        </div>
      </div>
      <Footer />
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#F5EFEB] overflow-x-hidden">
      <Navbar />
      <main className="flex-grow">
        <div className="max-w-[1200px] mx-auto px-6 md:px-12 pt-24 pb-16">
          
          {/* Breadcrumb */}
          <nav className="text-[11px] text-[#567C8D] uppercase tracking-[0.1em] mb-8 flex gap-2">
            <Link href="/" className="hover:text-[#2F4156] transition-colors">Home</Link><span>/</span>
            <Link href="/products" className="hover:text-[#2F4156] transition-colors">Products</Link><span>/</span>
            {product.school_id && (
              <>
                <Link href={`/products?school=${product.school_id._id}`} className="hover:text-[#2F4156] transition-colors">{product.school_id.name}</Link>
                <span>/</span>
              </>
            )}
            <span className="text-[#2F4156] font-[600]">{product.name}</span>
          </nav>
          
          {/* Main 2-col grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
            {/* LEFT: Image gallery */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, ease: "easeOut" }}>
              <ProductImageGallery images={product.images?.filter(i => i.url)} primaryImage={product.primary_image} productName={product.name} />
            </motion.div>
            
            {/* RIGHT: Product info */}
            <div className="lg:sticky lg:top-24 self-start">
              <ProductInfo product={product} onBulkClick={() => setBulkOpen(true)} />
            </div>
          </div>
          
          {/* Full-width below: description, specs, reviews */}
          <ProductDetails product={product} />

          {/* Frequently Bought Together */}
          {freqBought.length > 0 && (
            <section className="mt-20 pt-16 border-t border-[#C8D9E6]">
              <span className="text-[11px] uppercase tracking-[0.12em] font-[600] text-[#567C8D]">Pairs Well With</span>
              <h2 className="text-2xl font-display font-bold text-[#2F4156] mt-2 mb-8">Frequently Bought Together</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {freqBought.map(p => (
                  <Link key={p._id} href={`/products/${p.itemSlug || p._id}`} className="group block bg-[#FFFFFF] border border-[#C8D9E6] card-hover-shadow hover:-translate-y-[3px] transition-all">
                    <div className="aspect-[4/5] bg-[#EEF4F8] border-b border-[#C8D9E6] overflow-hidden relative">
                      {p.primary_image
                        ? <Image src={p.primary_image || '/fallback-product.jpg'} alt={p.name} fill sizes="(max-width: 768px) 50vw, 33vw" className="object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                        : <div className="w-full h-full" />
                      }
                    </div>
                    <div className="p-4">
                      <p className="font-display text-[14px] font-[600] text-[#2F4156] mb-1 line-clamp-1">{p.name}</p>
                      <p className="text-[14px] font-[700] text-[#567C8D]">{fmt(p.price_paisa)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Related Products */}
          {related.length > 0 && (
            <section className="mt-16 pt-16 border-t border-[#C8D9E6]">
              <span className="text-[11px] uppercase tracking-[0.12em] font-[600] text-[#567C8D]">From the Same School</span>
              <h2 className="text-2xl font-display font-bold text-[#2F4156] mt-2 mb-8">You May Also Like</h2>
              <div className="flex gap-6 overflow-x-auto pb-6 custom-scrollbar">
                {related.map(p => (
                  <Link key={p._id} href={`/products/${p.itemSlug || p._id}`} className="flex-shrink-0 w-56 group block bg-[#FFFFFF] border border-[#C8D9E6] card-hover-shadow hover:-translate-y-[3px] transition-all">
                    <div className="aspect-[4/5] bg-[#EEF4F8] border-b border-[#C8D9E6] overflow-hidden relative">
                      {p.primary_image
                        ? <Image src={p.primary_image || '/fallback-product.jpg'} alt={p.name} fill sizes="224px" className="object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                        : <div className="w-full h-full" />
                      }
                    </div>
                    <div className="p-4">
                      <p className="font-display text-[13px] font-[600] text-[#2F4156] mb-1 line-clamp-2">{p.name}</p>
                      <p className="text-[13px] font-[700] text-[#567C8D]">{fmt(p.price_paisa)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      <AnimatePresence>
        {bulkOpen && <BulkModal product={product} onClose={() => setBulkOpen(false)} />}
      </AnimatePresence>
      <Footer />
    </div>
  );
}
