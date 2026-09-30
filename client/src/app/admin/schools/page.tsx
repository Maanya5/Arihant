"use client";

import { useEffect, useState } from "react";
import { Plus, Search, Edit, Trash2, School } from "lucide-react";
import Image from "next/image";
import api from "@/lib/api";

export default function AdminSchools() {
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchSchools = async () => {
    try {
      const { data } = await api.get("/schools");
      setSchools(data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchSchools(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this school?")) return;
    try {
      await api.delete(`/schools/${id}`);
      setSchools(schools.filter(s => s._id !== id));
    } catch (err) { alert("Delete failed"); }
  };

  const filtered = schools.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    (s.city || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <span className="section-eyebrow">Institutions</span>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2 mb-10">
        <h1 className="text-4xl font-display font-bold text-[var(--color-ink)]">Manage Schools</h1>
        <button className="btn-primary">
          <Plus size={16} /> Add School
        </button>
      </div>

      <div className="relative mb-6">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-ink-muted)]" />
        <input 
          type="text" placeholder="Search by name or city..." 
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
                <th className="py-4 px-6 font-bold text-[var(--color-ink)]">School Info</th>
                <th className="py-4 px-6 font-bold text-[var(--color-ink)]">Location</th>
                <th className="py-4 px-6 font-bold text-[var(--color-ink)]">Status</th>
                <th className="py-4 px-6 font-bold text-[var(--color-ink)] text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="p-4"><div className="space-y-4">{[...Array(4)].map((_,i) => <div key={i} className="h-12 bg-[#C8D9E6] animate-shimmer" />)}</div></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={4} className="py-12 text-center text-[var(--color-ink-muted)]">No schools found.</td></tr>
              ) : filtered.map(s => (
                <tr key={s._id} className="border-b border-[var(--color-navy)]/5 hover:bg-[var(--color-navy)]/3 transition-colors group">
                  <td className="py-3 px-6 flex items-center gap-4">
                    <div className="w-10 h-10 border border-[var(--color-navy)]/10 bg-white flex-shrink-0 flex items-center justify-center overflow-hidden relative">
                      {s.logo ? <Image src={s.logo || '/fallback-product.jpg'} alt={s.name} fill sizes="40px" className="object-contain" loading="lazy" /> : <School size={16} className="text-[var(--color-ink)]/20" />}
                    </div>
                    <div>
                      <p className="font-bold text-[var(--color-ink)] line-clamp-1">{s.name}</p>
                      <p className="text-[9px] text-[var(--color-ink-muted)] font-mono">{s._id}</p>
                    </div>
                  </td>
                  <td className="py-4 px-6 font-bold text-[var(--color-ink)]">{s.city || "—"}</td>
                  <td className="py-4 px-6">
                    <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-1 border ${s.is_active ? "bg-green-50 text-green-700 border-green-200" : "bg-[var(--color-navy)]/5 text-[var(--color-ink-muted)] border-[var(--color-navy)]/10"}`}>
                      {s.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex justify-end gap-3">
                      <button className="text-[var(--color-ink-muted)] hover:text-[var(--color-teal)] transition-colors"><Edit size={16} /></button>
                      <button onClick={() => handleDelete(s._id)} className="text-[var(--color-ink-muted)] hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
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
