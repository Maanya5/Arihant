/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, ImageOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

interface ImageAttribution {
  photographer?: string;
  photographer_url?: string;
  source?: string;
}

interface GalleryImage {
  url: string;
  public_id?: string;
  is_primary?: boolean;
  attribution?: ImageAttribution;
}

interface ProductImageGalleryProps {
  images?: GalleryImage[];
  primaryImage?: string;
  fallbackUrl?: string;
  productName?: string;
}

export default function ProductImageGallery({
  images,
  primaryImage,
  fallbackUrl,
  productName = "Uniform item"
}: ProductImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  // If no gallery images, show single image or placeholder
  if (!images || images.length === 0) {
    const singleUrl = primaryImage || fallbackUrl || "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80&w=800";
    
    if (singleUrl) {
      return (
        <div className="relative aspect-[4/5] bg-white overflow-hidden group border border-[#C8D9E6]" style={{ borderRadius: 0 }}>
          <Image
            src={singleUrl}
            alt={productName}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover group-hover:scale-[1.06] transition-transform duration-[400ms] ease-out"
          />
        </div>
      );
    }
    return (
      <div className="aspect-[4/5] bg-white flex flex-col items-center justify-center text-[var(--color-ink-muted)] border border-[#C8D9E6]" style={{ borderRadius: 0 }}>
        <ImageOff size={48} className="mb-3 opacity-20" />
        <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">Image coming soon</span>
      </div>
    );
  }

  const activeImage = images[activeIndex];

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative aspect-[4/5] bg-white overflow-hidden group border border-[#C8D9E6] flex items-center justify-center" style={{ borderRadius: 0 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeIndex}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1.0 }}
            exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.12 } }}
            transition={{ 
              opacity: { duration: 0.22 },
              scale: { duration: 0.22, ease: "easeOut" }
            }}
            className="absolute inset-0"
          >
            <Image
              src={activeImage.url || '/fallback-product.jpg'}
              alt={`${productName} - view ${activeIndex + 1}`}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover group-hover:scale-[1.06] transition-transform duration-[400ms] ease-out"
              priority={activeIndex === 0}
            />
          </motion.div>
        </AnimatePresence>

        {/* Navigation arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 flex items-center justify-center text-[var(--color-ink)] opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-[var(--color-teal)] hover:text-white border border-[#C8D9E6] z-10"
              style={{ borderRadius: 0 }}
              aria-label="Previous Image"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 flex items-center justify-center text-[var(--color-ink)] opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-[var(--color-teal)] hover:text-white border border-[#C8D9E6] z-10"
              style={{ borderRadius: 0 }}
              aria-label="Next Image"
            >
              <ChevronRight size={16} />
            </button>
          </>
        )}

        {/* Unsplash attribution — required by TOS */}
        {activeImage.attribution?.photographer && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/40 to-transparent p-3 pt-8 opacity-0 group-hover:opacity-100 transition-opacity z-10">
            <p className="text-[10px] text-white/80">
              Photo by{" "}
              <a
                href={`${activeImage.attribution.photographer_url}?utm_source=arihant_store&utm_medium=referral`}
                target="_blank"
                rel="noreferrer"
                className="underline text-white/90 hover:text-white"
              >
                {activeImage.attribution.photographer}
              </a>
              {" "}on{" "}
              <a
                href="https://unsplash.com/?utm_source=arihant_store&utm_medium=referral"
                target="_blank"
                rel="noreferrer"
                className="underline text-white/90 hover:text-white"
              >
                Unsplash
              </a>
            </p>
          </div>
        )}
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
          {images.map((img, index) => {
            const isActive = index === activeIndex;
            return (
              <button
                key={index}
                onClick={() => setActiveIndex(index)}
                className={`w-16 h-16 flex-shrink-0 bg-white transition-all duration-150 ease-out border ${
                  isActive
                    ? "border-[2px] border-[#2F4156] scale-[1.04] z-10"
                    : "border-[#C8D9E6] hover:border-[#567C8D]"
                }`}
                style={{ borderRadius: 0 }}
              >
                <div className="relative w-full h-full">
                  <Image
                    src={img.url || '/fallback-product.jpg'}
                    alt={`View ${index + 1}`}
                    fill
                    sizes="64px"
                    className="object-cover"
                    loading="lazy"
                  />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
