"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutTemplate, Image as ImageIcon, Plus, Trash2, 
  ArrowUp, ArrowDown, ExternalLink, Loader2, Save 
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import api from "@/lib/api";
import ImageUploader from "@/components/admin/ImageUploader";
import AdminToast, { ToastType } from "@/components/admin/AdminToast";

type SectionType = "men" | "women" | "kids";

export default function AdminHomepage() {
  const [activeTab, setActiveTab] = useState<SectionType>("men");
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const showToast = (message: string, type: ToastType = "success") => {
    setToast({ message, type });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold text-[var(--color-ink)] flex items-center gap-2">
          <LayoutTemplate size={24} className="text-[var(--color-teal)]" />
          Home Page Content
        </h1>
        <p className="text-sm text-[var(--color-ink-muted)] mt-1">
          Manage the hero images, headlines, and category tiles for the main landing page.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Tabs */}
        <div className="w-full md:w-48 flex flex-row md:flex-col gap-2 shrink-0 overflow-x-auto md:overflow-x-visible">
          {(["men", "women", "kids"] as SectionType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 md:flex-none text-left px-4 py-3 text-xs font-bold uppercase tracking-widest transition-all ${
                activeTab === tab
                  ? "bg-[var(--color-navy)]/5 border-l-4 border-[var(--color-teal)] text-[var(--color-ink)]"
                  : "border-l-4 border-transparent text-[var(--color-ink-muted)] hover:bg-[var(--color-navy)]/5 hover:text-[var(--color-ink)]"
              }`}
            >
              {tab === "kids" ? "Kids & Schools" : `${tab}'s Section`}
            </button>
          ))}
        </div>

        {/* Main Panel */}
        <div className="flex-1 min-w-0">
          <SectionManager 
            key={activeTab} // Forces remount when tab changes
            sectionName={activeTab} 
            showToast={showToast} 
          />
        </div>
      </div>

      {toast && (
        <AdminToast
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast(null)}
        />
      )}
    </div>
  );
}

// ─── SECTION MANAGER ────────────────────────────────────────────────────────
function SectionManager({ sectionName, showToast }: { sectionName: SectionType; showToast: (m: string, t?: ToastType) => void }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sectionData, setSectionData] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, [sectionName]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/homepage/sections/${sectionName}`);
      setSectionData(res.data);
    } catch (err: any) {
      if (err.response?.status !== 404) {
        showToast("Failed to load section data", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMetadataChange = (field: string, value: any) => {
    setSectionData((prev: any) => ({ ...prev, [field]: value }));
  };

  const saveMetadata = async () => {
    setSaving(true);
    try {
      const payload = {
        headline: sectionData.headline,
        subheadline: sectionData.subheadline,
        cta_label: sectionData.cta_label,
        cta_link: sectionData.cta_link,
        is_active: sectionData.is_active,
      };
      await api.put(`/admin/homepage/sections/${sectionName}`, payload);
      showToast("Section updated successfully");
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to save section", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-[var(--color-teal)]" /></div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* AREA 1: HERO IMAGE MANAGEMENT */}
      <div className="bg-white border border-[var(--color-navy)]/10">
        <div className="px-6 py-4 border-b border-[var(--color-navy)]/10 flex justify-between items-center bg-white/30">
          <h2 className="text-sm font-bold uppercase tracking-widest text-[var(--color-ink)]">Hero Section</h2>
          <div className="flex items-center gap-2">
            <label className="text-xs text-[var(--color-ink-muted)] flex items-center gap-2 cursor-pointer">
              <span>Active</span>
              <input
                type="checkbox"
                checked={sectionData?.is_active ?? true}
                onChange={(e) => handleMetadataChange("is_active", e.target.checked)}
                className="accent-[var(--color-teal)] cursor-pointer w-4 h-4"
              />
            </label>
          </div>
        </div>

        <div className="p-6 flex flex-col xl:flex-row gap-8">
          <div className="w-full xl:w-5/12 flex-shrink-0">
            <ImageUploader
              currentImageUrl={sectionData?.hero_image_url}
              endpoint={`/admin/homepage/sections/${sectionName}/image`}
              label="Hero Background"
              aspectHint={sectionName === "kids" ? "Flexible (Min 100vh)" : "16:9"}
              onUploadSuccess={(url) => {
                setSectionData((prev: any) => ({ ...prev, hero_image_url: url }));
                showToast("Hero image updated successfully");
              }}
              onUploadError={(err) => showToast(err, "error")}
            />
          </div>

          <div className="flex-1 space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-[var(--color-ink)] mb-1">Hero Headline</label>
              <input
                type="text"
                value={sectionData?.headline || ""}
                onChange={(e) => handleMetadataChange("headline", e.target.value)}
                className="w-full px-3 py-2 border border-[var(--color-navy)]/20 focus:border-[var(--color-teal)] focus:outline-none text-sm"
                placeholder="e.g. Crafted for the Modern Man"
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-[var(--color-ink)] mb-1">Supporting Text <span className="text-[var(--color-ink-muted)] font-normal normal-case">(Optional)</span></label>
              <textarea
                value={sectionData?.subheadline || ""}
                onChange={(e) => handleMetadataChange("subheadline", e.target.value)}
                className="w-full px-3 py-2 border border-[var(--color-navy)]/20 focus:border-[var(--color-teal)] focus:outline-none text-sm min-h-[80px]"
                placeholder="Optional text below headline..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-[var(--color-ink)] mb-1">Button Text</label>
                <input
                  type="text"
                  value={sectionData?.cta_label || ""}
                  onChange={(e) => handleMetadataChange("cta_label", e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--color-navy)]/20 focus:border-[var(--color-teal)] focus:outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-[var(--color-ink)] mb-1">Button Link</label>
                <input
                  type="text"
                  value={sectionData?.cta_link || ""}
                  onChange={(e) => handleMetadataChange("cta_link", e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--color-navy)]/20 focus:border-[var(--color-teal)] focus:outline-none text-sm"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                onClick={saveMetadata}
                disabled={saving}
                className="btn-primary py-2.5 px-6 flex items-center gap-2"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Save Metadata
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* AREA 2: CATEGORIES OR SCHOOLS */}
      {sectionName === "kids" ? (
        <KidsSchoolsPanel />
      ) : (
        <CategoriesPanel sectionName={sectionName} showToast={showToast} />
      )}
    </div>
  );
}

// ─── CATEGORIES PANEL ───────────────────────────────────────────────────────
function CategoriesPanel({ sectionName, showToast }: { sectionName: string; showToast: (m: string, t?: ToastType) => void }) {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, [sectionName]);

  const fetchCategories = async () => {
    try {
      const res = await api.get(`/admin/homepage/categories?section=${sectionName}`);
      setCategories(res.data);
    } catch (err) {
      showToast("Failed to load categories", "error");
    } finally {
      setLoading(false);
    }
  };

  const moveTile = async (index: number, direction: -1 | 1) => {
    if (index + direction < 0 || index + direction >= categories.length) return;

    const newCats = [...categories];
    const temp = newCats[index];
    newCats[index] = newCats[index + direction];
    newCats[index + direction] = temp;

    // Update sort_orders based on new index
    const updates = newCats.map((c, i) => ({ id: c._id, sort_order: i + 1 }));

    // Optimistic update
    setCategories(newCats.map((c, i) => ({ ...c, sort_order: i + 1 })));

    try {
      await api.put('/admin/homepage/categories/reorder', { updates });
    } catch (err) {
      showToast("Failed to reorder tiles", "error");
      fetchCategories(); // revert
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
    setCategories(categories.map(c => c._id === id ? { ...c, is_active: !current } : c));
    try {
      await api.put(`/admin/homepage/categories/${id}`, { is_active: !current });
    } catch (err) {
      showToast("Failed to toggle status", "error");
      fetchCategories();
    }
  };

  const deleteTile = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category tile?")) return;
    try {
      await api.delete(`/admin/homepage/categories/${id}`);
      setCategories(categories.filter(c => c._id !== id));
      showToast("Tile deleted successfully");
    } catch (err) {
      showToast("Failed to delete tile", "error");
    }
  };

  const handleInlineEdit = async (id: string, field: string, value: string) => {
    try {
      await api.put(`/admin/homepage/categories/${id}`, { [field]: value });
      showToast("Saved", "success");
    } catch (err) {
      showToast("Failed to update", "error");
      fetchCategories();
    }
  };

  return (
    <div className="bg-white border border-[var(--color-navy)]/10">
      <div className="px-6 py-4 border-b border-[var(--color-navy)]/10 flex justify-between items-center bg-white/30">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-widest text-[var(--color-ink)]">Category Tiles</h2>
          <p className="text-[10px] text-[var(--color-ink-muted)] mt-0.5">{categories.length} tiles</p>
        </div>
        <button
          onClick={() => setIsDrawerOpen(true)}
          className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1"
        >
          <Plus size={14} /> Add New Tile
        </button>
      </div>

      <div className="p-0">
        {loading ? (
          <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-[var(--color-teal)]" /></div>
        ) : categories.length === 0 ? (
          <div className="p-12 text-center text-sm text-[var(--color-ink-muted)]">
            No category tiles created yet.
          </div>
        ) : (
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[var(--color-bg)]/50 border-b border-[var(--color-navy)]/5">
              <tr>
                <th className="px-6 py-3 font-bold uppercase tracking-widest text-[10px] text-[var(--color-ink-muted)] w-16">Image</th>
                <th className="px-6 py-3 font-bold uppercase tracking-widest text-[10px] text-[var(--color-ink-muted)]">Label / Link</th>
                <th className="px-6 py-3 font-bold uppercase tracking-widest text-[10px] text-[var(--color-ink-muted)] w-24 text-center">Status</th>
                <th className="px-6 py-3 font-bold uppercase tracking-widest text-[10px] text-[var(--color-ink-muted)] w-32 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-navy)]/5">
              {categories.map((tile, i) => (
                <tr key={tile._id} className="group">
                  <td className="px-6 py-3">
                    <div className="w-12 h-12 relative bg-white border border-[var(--color-navy)]/10 overflow-hidden group/img">
                      {tile.image_url ? (
                        <Image src={tile.image_url} alt={tile.label} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[var(--color-ink)]/20"><ImageIcon size={16} /></div>
                      )}
                      {/* We don't have inline image changing in the table to keep it simple, they can recreate or we could add a modal */}
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <input
                      type="text"
                      defaultValue={tile.label}
                      onBlur={(e) => { if(e.target.value !== tile.label) handleInlineEdit(tile._id, "label", e.target.value) }}
                      className="font-bold text-[var(--color-ink)] bg-transparent border-none focus:ring-0 p-0 text-sm w-full hover:bg-[var(--color-navy)]/5 focus:bg-[var(--color-navy)]/5 transition-colors"
                      placeholder="Label"
                    />
                    <input
                      type="text"
                      defaultValue={tile.link}
                      onBlur={(e) => { if(e.target.value !== tile.link) handleInlineEdit(tile._id, "link", e.target.value) }}
                      className="text-xs text-[var(--color-ink-muted)] bg-transparent border-none focus:ring-0 p-0 mt-1 w-full hover:bg-[var(--color-navy)]/5 focus:bg-[var(--color-navy)]/5 transition-colors"
                      placeholder="/link"
                    />
                  </td>
                  <td className="px-6 py-3 text-center">
                    <button
                      onClick={() => toggleActive(tile._id, tile.is_active)}
                      className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 ${
                        tile.is_active ? "text-green-700 bg-green-50" : "text-[var(--color-ink-muted)] bg-[var(--color-navy)]/5"
                      }`}
                    >
                      {tile.is_active ? "Active" : "Hidden"}
                    </button>
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button disabled={i === 0} onClick={() => moveTile(i, -1)} className="p-1.5 text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] disabled:opacity-30"><ArrowUp size={16} /></button>
                      <button disabled={i === categories.length - 1} onClick={() => moveTile(i, 1)} className="p-1.5 text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] disabled:opacity-30"><ArrowDown size={16} /></button>
                      <div className="w-px h-4 bg-[var(--color-navy)]/20 mx-1" />
                      <button onClick={() => deleteTile(tile._id)} className="p-1.5 text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <AnimatePresence>
        {isDrawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/40 z-[100]"
              onClick={() => setIsDrawerOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed top-0 right-0 h-full w-full sm:w-[400px] bg-white border-l border-[var(--color-navy)]/10 shadow-2xl z-[110] flex flex-col"
            >
              <AddTileDrawer 
                sectionName={sectionName} 
                onClose={() => setIsDrawerOpen(false)} 
                onAdded={fetchCategories} 
                showToast={showToast} 
                nextSortOrder={categories.length > 0 ? categories[categories.length - 1].sort_order + 1 : 1}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── ADD TILE DRAWER ────────────────────────────────────────────────────────
function AddTileDrawer({ sectionName, onClose, onAdded, showToast, nextSortOrder }: any) {
  const [label, setLabel] = useState("");
  const [link, setLink] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setPreview(URL.createObjectURL(f));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label || !link || !file) {
      showToast("Label, link, and image are required.", "error");
      return;
    }

    setSaving(true);
    try {
      // 1. Create category metadata
      const res = await api.post("/admin/homepage/categories", {
        section: sectionName,
        label,
        link,
        sort_order: nextSortOrder
      });
      const catId = res.data.category._id;

      // 2. Upload image
      const formData = new FormData();
      formData.append("image", file);
      await api.post(`/admin/homepage/categories/${catId}/image`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      showToast("Tile added successfully!");
      onAdded();
      onClose();
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to add tile", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-[var(--color-navy)]/10 flex justify-between items-center bg-white">
        <h3 className="font-display font-bold text-[var(--color-ink)] text-xl">Add New Tile</h3>
      </div>
      <div className="p-6 flex-1 overflow-y-auto">
        <form id="add-tile-form" onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-[var(--color-ink)] mb-1">Label</label>
            <input
              type="text" required value={label} onChange={e => setLabel(e.target.value)}
              className="w-full px-3 py-2 border border-[var(--color-navy)]/20 focus:border-[var(--color-teal)] focus:outline-none text-sm"
              placeholder="e.g. Shirts"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-[var(--color-ink)] mb-1">Link URL</label>
            <input
              type="text" required value={link} onChange={e => setLink(e.target.value)}
              className="w-full px-3 py-2 border border-[var(--color-navy)]/20 focus:border-[var(--color-teal)] focus:outline-none text-sm"
              placeholder="e.g. /products?gender=men&type=shirt"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-[var(--color-ink)] mb-1">Tile Image <span className="text-[var(--color-ink-muted)] normal-case font-normal">(3:4 ratio recommended)</span></label>
            <div className="mt-1 flex items-center gap-4">
              <div className="w-24 h-32 bg-white border border-[var(--color-navy)]/20 flex items-center justify-center relative overflow-hidden flex-shrink-0">
                {preview ? <Image src={preview} alt="preview" fill className="object-cover" unoptimized /> : <ImageIcon size={24} className="text-[var(--color-ink)]/20" />}
              </div>
              <label className="btn-secondary py-2 px-4 cursor-pointer text-xs">
                Select Image
                <input type="file" required accept="image/*" className="hidden" onChange={handleFile} />
              </label>
            </div>
          </div>
        </form>
      </div>
      <div className="p-6 border-t border-[var(--color-navy)]/10 bg-white flex justify-end gap-3">
        <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-[var(--color-ink)] hover:underline">Cancel</button>
        <button type="submit" form="add-tile-form" disabled={saving} className="btn-primary py-2 px-6 flex items-center gap-2">
          {saving && <Loader2 size={16} className="animate-spin" />}
          Add Tile
        </button>
      </div>
    </div>
  );
}

// ─── KIDS SCHOOLS PANEL (READ-ONLY) ──────────────────────────────────────────
function KidsSchoolsPanel() {
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/schools?active=true").then(res => {
      setSchools(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <div className="bg-white border border-[var(--color-navy)]/10">
      <div className="px-6 py-4 border-b border-[var(--color-navy)]/10 flex justify-between items-center bg-white/30">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-widest text-[var(--color-ink)]">Schools Grid</h2>
          <p className="text-[10px] text-[var(--color-ink-muted)] mt-0.5">Dynamically populated</p>
        </div>
        <Link href="/admin/schools" className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-2">
          Manage Schools <ExternalLink size={14} />
        </Link>
      </div>
      
      <div className="p-6">
        <p className="text-sm text-[var(--color-ink)] mb-6">
          The Kids section automatically displays active schools from your database. 
          To add or edit these cards, you must manage them in the Schools section of the admin panel.
        </p>

        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="animate-spin text-[var(--color-teal)]" /></div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 opacity-70 pointer-events-none">
            {schools.slice(0, 8).map(school => (
              <div key={school._id} className="border border-[var(--color-navy)]/10 p-3 flex items-center gap-3 bg-[var(--color-bg)]">
                <div className="w-10 h-10 border border-[var(--color-navy)]/10 bg-white relative flex-shrink-0">
                  {school.logo ? <Image src={school.logo} alt="" fill className="object-contain p-1" sizes="40px" /> : <div className="w-full h-full flex items-center justify-center font-bold text-[var(--color-ink)]/30">{school.name[0]}</div>}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[var(--color-ink)] truncate">{school.name}</p>
                  <p className="text-[9px] text-[var(--color-ink-muted)] truncate">{school.city}</p>
                </div>
              </div>
            ))}
            {schools.length > 8 && (
              <div className="border border-[var(--color-navy)]/10 border-dashed p-3 flex items-center justify-center bg-[var(--color-bg)]">
                <span className="text-xs font-bold text-[var(--color-ink-muted)]">+ {schools.length - 8} more</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
