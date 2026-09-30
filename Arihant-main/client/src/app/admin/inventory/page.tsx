"use client";

import { useEffect, useState, useRef } from "react";
import { Upload, AlertTriangle, Download, Check } from "lucide-react";
import Image from "next/image";
import api from "@/lib/api";

export default function InventoryPage() {
  const [lowStock, setLowStock] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchLowStock();
  }, []);

  const fetchLowStock = async () => {
    try {
      const res = await api.get("/admin/stats");
      // The API doesn't return the raw array of low stock items yet, but we can list all products and filter locally for now
      const prodRes = await api.get("/products?limit=1000");
      const low = prodRes.data.products.filter((p: any) => 
        p.variants?.some((v: any) => v.stock_qty < 10)
      );
      setLowStock(low);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append("file", file);
    setUploading(true); setUploadMsg("");
    
    try {
      const res = await api.post("/admin/inventory/bulk-import", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setUploadMsg(`Success: ${res.data.message}`);
      fetchLowStock();
    } catch (err: any) {
      setUploadMsg(`Error: ${err.response?.data?.message || "Upload failed"}`);
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  const downloadCSVTemplate = (e: React.MouseEvent) => {
    e.preventDefault();
    const csvContent = "data:text/csv;charset=utf-8,itemId,size,newStock\n6a0731da3f318e959b5cbfd0,M,50\n";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "inventory_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <span className="section-eyebrow">Stock Management</span>
      <h1 className="text-4xl font-display font-bold text-[var(--color-ink)] mt-2 mb-10">Inventory</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Bulk Update Panel */}
        <div className="border border-[var(--color-navy)]/10 bg-white p-6 self-start">
          <h2 className="text-lg font-display font-bold text-[var(--color-ink)] mb-4">Bulk Update CSV</h2>
          <p className="text-[10px] text-[var(--color-ink-muted)] mb-6 leading-relaxed">
            Upload a CSV file to update stock levels. Required headers: <code className="bg-[var(--color-navy)]/5 px-1 py-0.5 text-[var(--color-ink)] font-mono">itemId</code>, <code className="bg-[var(--color-navy)]/5 px-1 py-0.5 text-[var(--color-ink)] font-mono">size</code>, <code className="bg-[var(--color-navy)]/5 px-1 py-0.5 text-[var(--color-ink)] font-mono">newStock</code>.
          </p>
          
          <input type="file" accept=".csv" className="hidden" ref={fileInput} onChange={handleUpload} />
          <button 
            onClick={() => fileInput.current?.click()} 
            disabled={uploading}
            className="w-full border border-[var(--color-navy)] border-dashed p-8 flex flex-col items-center justify-center text-[var(--color-ink)]/60 hover:bg-[var(--color-navy)]/5 hover:text-[var(--color-ink)] transition-all disabled:opacity-50"
          >
            <Upload size={24} className="mb-3" />
            <span className="text-[10px] font-bold uppercase tracking-widest">{uploading ? "Processing..." : "Select CSV File"}</span>
          </button>
          
          {uploadMsg && (
            <div className={`mt-4 p-3 text-xs font-bold border ${uploadMsg.startsWith("Success") ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}`}>
              {uploadMsg.startsWith("Success") ? <Check size={14} className="inline mr-1" /> : <AlertTriangle size={14} className="inline mr-1" />}
              {uploadMsg}
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-[var(--color-navy)]/10">
            <a 
              href="#" 
              onClick={downloadCSVTemplate}
              className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[var(--color-teal)] hover:text-[var(--color-ink)] transition-colors"
            >
              <Download size={14} /> Download CSV Template
            </a>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="lg:col-span-2 border border-[var(--color-navy)]/10 bg-white p-6">
          <div className="flex items-center gap-2 mb-6">
            <AlertTriangle size={18} className="text-red-500" />
            <h2 className="text-lg font-display font-bold text-[var(--color-ink)]">Low Stock Alerts (&lt; 10 items)</h2>
          </div>

          {loading ? (
             <div className="space-y-4">{[...Array(5)].map((_,i) => <div key={i} className="h-16 bg-[#C8D9E6] animate-shimmer" />)}</div>
          ) : lowStock.length === 0 ? (
             <div className="text-center py-12 border border-dashed border-[var(--color-navy)]/10">
               <Check size={32} className="text-green-500 mx-auto mb-3" />
               <p className="text-sm text-[var(--color-ink-muted)]">All stock levels are healthy.</p>
             </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--color-navy)]/10">
                    <th className="py-3 font-bold text-[var(--color-ink)]">Product</th>
                    <th className="py-3 font-bold text-[var(--color-ink)]">Item ID</th>
                    <th className="py-3 font-bold text-[var(--color-ink)]">School</th>
                    <th className="py-3 font-bold text-[var(--color-ink)] text-right">Low Sizes</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStock.map(p => {
                    const badVariants = p.variants.filter((v:any) => v.stock_qty < 10);
                    return (
                      <tr key={p._id} className="border-b border-[var(--color-navy)]/5 last:border-0 hover:bg-[var(--color-navy)]/5 transition-colors">
                        <td className="py-3 flex items-center gap-3">
                          <div className="w-8 h-8 border border-[var(--color-navy)]/10 bg-white flex-shrink-0 relative">
                            {p.primary_image && <Image src={p.primary_image || '/fallback-product.jpg'} alt={p.name} fill sizes="32px" className="object-cover" loading="lazy" />}
                          </div>
                          <span className="font-bold text-[var(--color-ink)] line-clamp-1">{p.name}</span>
                        </td>
                        <td className="py-3 font-mono text-[9px] text-[var(--color-ink-muted)]">{p._id}</td>
                        <td className="py-3 text-[10px] text-[var(--color-ink-muted)]">{p.school?.name || "N/A"}</td>
                        <td className="py-3 text-right">
                          <div className="flex flex-wrap justify-end gap-1">
                            {badVariants.map((v:any) => (
                              <span key={v.size} className={`px-1.5 py-0.5 text-[9px] font-bold border ${v.stock_qty === 0 ? "bg-red-50 text-red-600 border-red-200" : "bg-amber-50 text-amber-600 border-amber-200"}`}>
                                {v.size}: {v.stock_qty}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
