/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, Suspense } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import api from "@/lib/api";
import { Filter } from "lucide-react";
import { useParams } from "next/navigation";

function CategoryContent() {
  const params = useParams();
  const category = params.category as string;
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await api.get("/uniform-items", {
          params: { itemType: category }
        });
        setItems(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (category) {
      fetchItems();
    }
  }, [category]);

  const displayCategory = category ? category.charAt(0).toUpperCase() + category.slice(1) : "Category";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-heading text-[var(--color-teal)]">
            {displayCategory}
          </h1>
          <p className="text-sm text-gray-500 mt-1">Found {items.length} items</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-white border border-[var(--color-teal)]/10 rounded-2xl text-sm font-bold shadow-lg shadow-black/5 hover:bg-[var(--color-teal)]/5 transition-all">
          <Filter size={18} /> Filters
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse">
                <div className="bg-gray-200 aspect-[4/5] rounded-3xl mb-4" />
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2" />
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-6 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : items.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {items.map((p) => (
            <ProductCard key={p._id} product={p} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
          <p className="text-gray-500">No items found for {displayCategory}.</p>
        </div>
      )}
    </div>
  );
}

export default function CategoryPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-grow">
        <Suspense fallback={<div>Loading...</div>}>
          <CategoryContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
