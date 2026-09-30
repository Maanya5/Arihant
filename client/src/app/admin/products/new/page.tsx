"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Upload, Check, AlertTriangle } from "lucide-react";
import api from "@/lib/api";

export default function NewProductPage() {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);

  // States
  const [schools, setSchools] = useState<any[]>([]);
  const [standards, setStandards] = useState<any[]>([]);
  
  const [name, setName] = useState("");
  const [itemType, setItemType] = useState("shirt");
  const [uniformType, setUniformType] = useState("regular");
  const [price, setPrice] = useState("");
  const [selectedSchool, setSelectedSchool] = useState("");
  const [selectedStandard, setSelectedStandard] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState({ text: "", isError: false });

  // Load schools
  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const { data } = await api.get("/schools");
        setSchools(data || []);
        if (data && data.length > 0) {
          setSelectedSchool(data[0]._id);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchSchools();
  }, []);

  // Load standards when school changes
  useEffect(() => {
    const fetchStandards = async () => {
      if (!selectedSchool) return;
      try {
        const { data } = await api.get(`/schools/${selectedSchool}`);
        const catalogue = data.data || data;
        const stds = catalogue.standards || [];
        setStandards(stds);
        if (stds.length > 0) {
          setSelectedStandard(stds[0]._id);
        } else {
          setSelectedStandard("");
        }
      } catch (err) {
        console.error(err);
        setStandards([]);
        setSelectedStandard("");
      }
    };
    fetchStandards();
  }, [selectedSchool]);

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);
    setUploading(true);
    setMsg({ text: "", isError: false });

    try {
      const { data } = await api.post("/admin/up-img", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setImageUrl(data.imageUrl);
      setMsg({ text: "Image uploaded successfully!", isError: false });
    } catch (err: any) {
      console.error(err);
      setMsg({ text: err.response?.data?.message || "Image upload failed.", isError: true });
    } finally {
      setUploading(false);
    }
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setMsg({ text: "Product Name is required.", isError: true });
    if (!price || isNaN(Number(price)) || Number(price) <= 0) {
      return setMsg({ text: "Please enter a valid price.", isError: true });
    }
    if (!selectedSchool) return setMsg({ text: "Please select a school.", isError: true });
    if (!selectedStandard) return setMsg({ text: "Please select a standard/grade.", isError: true });

    setLoading(true);
    setMsg({ text: "", isError: false });

    try {
      const pricePaisa = Math.round(Number(price) * 100);
      await api.post("/admin/p-new", {
        name: name.trim(),
        item_type: itemType,
        uniform_type: uniformType,
        price_paisa: pricePaisa,
        school_id: selectedSchool,
        standard_id: selectedStandard,
        image_url: imageUrl || undefined
      });

      setMsg({ text: "Product created successfully!", isError: false });
      setTimeout(() => {
        router.push("/admin/products");
      }, 1000);
    } catch (err: any) {
      console.error(err);
      setMsg({ text: err.response?.data?.message || "Failed to create product.", isError: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto bg-[var(--color-bg)]">
      <div className="mb-6">
        <Link href="/admin/products" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors">
          <ArrowLeft size={14} /> Back to Products
        </Link>
      </div>

      <div className="border border-[var(--color-navy)]/10 bg-white p-8">
        <h1 className="text-3xl font-display font-bold text-[var(--color-ink)] mb-8">Add New Product</h1>

        {msg.text && (
          <div className={`mb-6 p-4 text-xs font-bold border ${msg.isError ? "bg-red-50 text-red-700 border-red-200" : "bg-green-50 text-green-700 border-green-200"}`}>
            {msg.isError ? <AlertTriangle size={14} className="inline mr-1" /> : <Check size={14} className="inline mr-1" />}
            {msg.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Product Name */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--color-ink-muted)] mb-2">Product Name</label>
            <input 
              type="text" 
              placeholder="e.g. Regular Cotton Shirt"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-4 py-3 border border-[var(--color-navy)]/20 text-xs bg-transparent focus:outline-none focus:border-[var(--color-navy)]"
              style={{ borderRadius: 0 }}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Item Type */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--color-ink-muted)] mb-2">Item Type</label>
              <select 
                value={itemType}
                onChange={e => setItemType(e.target.value)}
                className="w-full border border-[var(--color-navy)]/20 py-3 px-4 text-xs bg-transparent focus:outline-none focus:border-[var(--color-navy)]"
                style={{ borderRadius: 0 }}
              >
                <option value="shirt">Shirt</option>
                <option value="skirt">Skirt</option>
                <option value="pants">Pants</option>
                <option value="shorts">Shorts</option>
                <option value="blazer">Blazer</option>
                <option value="sweater">Sweater</option>
                <option value="socks">Socks</option>
                <option value="shoes">Shoes</option>
                <option value="belt">Belt</option>
                <option value="tie">Tie</option>
              </select>
            </div>

            {/* Uniform Type */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--color-ink-muted)] mb-2">Uniform Type</label>
              <select 
                value={uniformType}
                onChange={e => setUniformType(e.target.value)}
                className="w-full border border-[var(--color-navy)]/20 py-3 px-4 text-xs bg-transparent focus:outline-none focus:border-[var(--color-navy)]"
                style={{ borderRadius: 0 }}
              >
                <option value="regular">Regular</option>
                <option value="house">House</option>
                <option value="sports">Sports</option>
                <option value="winter">Winter</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Price (Rupees) */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--color-ink-muted)] mb-2">Price (₹)</label>
              <input 
                type="number" 
                step="0.01"
                placeholder="0.00"
                value={price}
                onChange={e => setPrice(e.target.value)}
                className="w-full px-4 py-3 border border-[var(--color-navy)]/20 text-xs bg-transparent focus:outline-none focus:border-[var(--color-navy)]"
                style={{ borderRadius: 0 }}
              />
            </div>

            {/* School Selection */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--color-ink-muted)] mb-2">School</label>
              <select 
                value={selectedSchool}
                onChange={e => setSelectedSchool(e.target.value)}
                className="w-full border border-[var(--color-navy)]/20 py-3 px-4 text-xs bg-transparent focus:outline-none focus:border-[var(--color-navy)]"
                style={{ borderRadius: 0 }}
              >
                <option value="" disabled>Select School</option>
                {schools.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>
          </div>

          {/* Standard Selection */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--color-ink-muted)] mb-2">Standard / Grade</label>
            <select 
              value={selectedStandard}
              onChange={e => setSelectedStandard(e.target.value)}
              className="w-full border border-[var(--color-navy)]/20 py-3 px-4 text-xs bg-transparent focus:outline-none focus:border-[var(--color-navy)]"
              style={{ borderRadius: 0 }}
              disabled={standards.length === 0}
            >
              <option value="" disabled>{standards.length === 0 ? "No Grades Found for Selected School" : "Select Grade"}</option>
              {standards.map(s => (
                <option key={s._id} value={s._id}>{s.class_name || s.className} ({s.gender})</option>
              ))}
            </select>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--color-ink-muted)] mb-2">Product Image</label>
            <div className="flex gap-4 items-center">
              {imageUrl && (
                <div className="w-16 h-16 border border-[var(--color-navy)]/10 flex-shrink-0 bg-white relative">
                  <Image src={imageUrl || '/fallback-product.jpg'} fill sizes="64px" className="object-cover" alt="Preview" loading="lazy" />
                </div>
              )}
              <input type="file" accept="image/*" className="hidden" ref={fileInput} onChange={handleImageUpload} />
              <button 
                type="button"
                onClick={() => fileInput.current?.click()}
                disabled={uploading}
                className="px-6 py-3 border border-[var(--color-navy)] text-[10px] font-bold uppercase tracking-widest text-[var(--color-ink)] hover:bg-[var(--color-navy)] hover:text-white transition-colors disabled:opacity-50"
                style={{ borderRadius: 0 }}
              >
                <Upload size={14} className="inline mr-1" /> {uploading ? "Uploading..." : "Upload Image"}
              </button>
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-4">
            <button 
              type="submit" 
              disabled={loading}
              className="w-full btn-primary py-4 disabled:opacity-50"
            >
              {loading ? "Saving Product..." : "Create Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
