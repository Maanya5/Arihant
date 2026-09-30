"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { useWishlistStore } from "@/store/wishlistStore";

const fmt = (p: number) => `Rs.${(p / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const disc = (price: number, mrp: number | null) =>
  mrp && mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;

export interface Product {
  _id: string; name: string; item_type: string;
  price_paisa: number; mrp_paisa?: number | null;
  primary_image?: string; images?: Array<{ url: string }>;
  itemSlug?: string; is_active: boolean;
  school?: { _id: string; name: string; city: string; logo?: string };
  standard?: { _id: string; class_name: string; gender: string };
  variants?: Array<{ size: string; stock_qty: number; is_available: boolean; _id: string }>;
}

export const cardVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.6, ease: "easeOut" } }
};

export default function ProductCard({ product }: { product: Product }) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const { isWishlisted, toggleItem } = useWishlistStore();
  
  const wishlisted = isWishlisted(product._id);
  const pct = disc(product.price_paisa, product.mrp_paisa ?? null);
  const img2 = product.images?.[1]?.url;
  const inStock = (product.variants ?? []).some(v => v.stock_qty > 0);

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleItem(product._id);
  };

  return (
    <motion.div
      variants={cardVariants}
      className="group relative flex flex-col w-full cursor-pointer"
    >
      <Link href={`/products/${product.itemSlug || product._id}`} className="block relative aspect-[3/4] w-full overflow-hidden bg-[#F4F4F4] mb-3">
        {/* Skeleton loading background */}
        {!imgLoaded && <div className="absolute inset-0 animate-pulse bg-[#E5E5E5] z-[5]" />}
        
        {/* Out of Stock Overlay */}
        {!inStock && (
          <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center">
            <span className="text-[10px] font-medium uppercase tracking-widest text-black bg-white/90 px-3 py-1">
              Sold Out
            </span>
          </div>
        )}

        {/* Product Images */}
        {product.primary_image ? (
          <>
            <Image
              src={product.primary_image || '/fallback-product.jpg'}
              alt={product.name}
              onLoad={() => setImgLoaded(true)}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
              className={`object-cover transition-opacity duration-700 ease-out ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
              loading="lazy"
            />
            {img2 && (
              <Image
                src={img2 || '/fallback-product.jpg'}
                alt={product.name}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
                className="absolute inset-0 object-cover transition-opacity duration-500 opacity-0 md:group-hover:opacity-100"
                loading="lazy"
              />
            )}
          </>
        ) : (
          <div className="w-full h-full bg-[#E5E5E5]" />
        )}

        {/* Badges - Inside Image */}
        {pct > 0 && (
          <span className="absolute bottom-2 left-2 z-20 bg-black text-white text-[9px] font-medium px-1.5 py-0.5 tracking-wider">
            -{pct}%
          </span>
        )}

        {/* Wishlist Heart - Inside Image (Bottom Right) */}
        <button
          onClick={handleWishlist}
          className="absolute bottom-2 right-2 z-20 p-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200"
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart size={18} strokeWidth={1.5} fill={wishlisted ? "#000" : "none"} className={wishlisted ? "text-black" : "text-black"} />
        </button>
      </Link>

      {/* Product Details (Below Image) */}
      <div className="px-1 flex flex-col gap-0.5 relative z-20">
        <Link href={`/products/${product.itemSlug || product._id}`} className="group-hover:underline decoration-1 underline-offset-2">
          <p className="text-[11px] uppercase tracking-wide text-black font-medium line-clamp-1">
            {product.name}
          </p>
        </Link>

        <div className="flex items-center gap-1.5 mt-0.5">
          <span className={`text-[11px] font-medium ${pct > 0 ? 'text-[#D02E2E]' : 'text-black'}`}>
            {fmt(product.price_paisa)}
          </span>
          {pct > 0 && product.mrp_paisa && (
            <span className="text-[10px] text-gray-500 line-through decoration-gray-400">
              {fmt(product.mrp_paisa)}
            </span>
          )}
        </div>

        {/* Color Swatches / Sizes (Mimicking H&M swatches with available sizes if actual colors aren't present) */}
        {(product.variants ?? []).length > 0 && (
          <div className="flex gap-1 flex-wrap mt-1.5 items-center">
            {(product.variants ?? []).slice(0, 3).map((v: any, idx: number) => {
              // Creating a pseudo color-swatch effect using predefined neutral colors to mimic the screenshot
              const pseudoColors = ["#1A1A1A", "#888888", "#EFEFEF", "#2A3B4C"];
              const color = pseudoColors[idx % pseudoColors.length];
              return (
                <div 
                  key={v.size} 
                  className={`w-2.5 h-2.5 ${v.stock_qty > 0 ? '' : 'opacity-30 relative after:content-[""] after:absolute after:top-1/2 after:left-[-10%] after:w-[120%] after:h-[1px] after:bg-black after:-rotate-45'}`}
                  style={{ backgroundColor: color, border: color === '#EFEFEF' ? '1px solid #D1D1D1' : 'none' }}
                  title={v.size}
                />
              )
            })}
            {(product.variants ?? []).length > 3 && (
              <span className="text-[9px] text-gray-500 ml-0.5">
                +{(product.variants ?? []).length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
