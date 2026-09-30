"use client";

import { useEffect, useState } from "react";
import { Plus, Search, Edit, Trash2, ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import api from "@/lib/api";

export default function AdminProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchProducts = async () => {
    try {
      const { data } = await api.get("/products?limit=1000"); // fetch all for admin
      setProducts(data.products || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      await api.delete(`/uniform-items/${id}`); // Legacy route or update to product route
      setProducts(products.filter(p => p._id !== id));
    } catch (err) { alert("Delete failed"); }
  };

  const filtered = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    (p.school?.name || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <span className="section-eyebrow">Catalog Management</span>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2 mb-10">
        <h1 className="text-4xl font-display font-bold text-[var(--color-ink)]">Products</h1>
        <Link href="/admin/products/new" className="btn-primary">
          <Plus size={16} /> Add Product
        </Link>
      </div>

      <div className="relative mb-6">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-muted)]" />
        <input 
          type="text" placeholder="Search by name or school..." 
          value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-[var(--color-navy)]/20 text-xs bg-transparent focus:outline-none focus:border-[var(--color-navy)]"
          style={{ borderRadius: 0 }}
        />
      </div>

      <div className="border border-[var(--color-navy)]/10 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead>
              <tr className="bg-[var(--color-navy)]/5 border-b border-[var(--color-navy)]/10">
                <th className="py-4 px-6 font-bold text-[var(--color-ink)]">Product</th>
                <th className="py-4 px-6 font-bold text-[var(--color-ink)]">Price</th>
                <th className="py-4 px-6 font-bold text-[var(--color-ink)]">School</th>
                <th className="py-4 px-6 font-bold text-[var(--color-ink)] text-center">Variants</th>
                <th className="py-4 px-6 font-bold text-[var(--color-ink)] text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="p-4"><div className="space-y-4">{[...Array(5)].map((_,i) => <div key={i} className="h-12 bg-[#C8D9E6] animate-shimmer" />)}</div></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="py-12 text-center text-[var(--color-ink-muted)]">No products found.</td></tr>
              ) : filtered.map(p => (
                <tr key={p._id} className="border-b border-[var(--color-navy)]/5 hover:bg-[var(--color-navy)]/3 transition-colors group">
                  <td className="py-3 px-6 flex items-center gap-4">
                    <div className="w-10 h-10 border border-[var(--color-navy)]/10 bg-white flex-shrink-0 relative">
                      {p.primary_image && <Image src={p.primary_image || '/fallback-product.jpg'} alt={p.name} fill sizes="40px" className="object-cover" loading="lazy" />}
                    </div>
                    <div>
                      <p className="font-bold text-[var(--color-ink)] line-clamp-1">{p.name}</p>
                      <p className="text-[9px] text-[var(--color-ink-muted)] font-mono">{p._id}</p>
                    </div>
                  </td>
                  <td className="py-4 px-6 font-bold text-[var(--color-ink)]">₹{(p.price_paisa / 100).toLocaleString("en-IN")}</td>
                  <td className="py-4 px-6 text-[var(--color-ink-muted)]">{p.school?.name || "—"}</td>
                  <td className="py-4 px-6 text-center">
                    <span className="text-[10px] font-bold uppercase bg-[var(--color-navy)]/5 px-2 py-1 border border-[var(--color-navy)]/10">
                      {(p.variants || []).length}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex justify-end gap-3">
                      <button className="text-[var(--color-ink-muted)] hover:text-[var(--color-teal)] transition-colors"><Edit size={16} /></button>
                      <button onClick={() => handleDelete(p._id)} className="text-[var(--color-ink-muted)] hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
