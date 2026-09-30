"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Minus, Plus, ShoppingBag, Check, AlertTriangle } from "lucide-react";
import { useCart } from "@/context/CartContext";
import ProductImageGallery from "./ProductImageGallery";
import { motion, AnimatePresence } from "framer-motion";
import ButtonWithFeedback from "./ui/ButtonWithFeedback";

interface VariantEntry {
  _id: string;
  size: string;
  stock_qty: number;
  is_available: boolean;
}

interface GalleryImage {
  url: string;
  public_id?: string;
  is_primary?: boolean;
  attribution?: {
    photographer?: string;
    photographer_url?: string;
    source?: string;
  };
}

interface CatalogueItem {
  _id: string;
  name: string;
  item_type: string;
  price_paisa: number;
  image_url?: string;
  primary_image?: string;
  images?: GalleryImage[];
  variants: VariantEntry[];
}

export default function CatalogueItemCard({ item }: { item: CatalogueItem }) {
  const { addToCart } = useCart();

  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(0);
  const prevQuantityRef = useRef(0);
  const direction = quantity > prevQuantityRef.current ? 1 : -1;

  useEffect(() => {
    prevQuantityRef.current = quantity;
  }, [quantity]);

  /* derived */
  const selectedVariant = item.variants?.find((v) => v.size === selectedSize);
  const maxStock = selectedVariant?.stock_qty ?? 0;
  const lowStock = maxStock > 0 && maxStock <= 3;

  /* handlers */
  const handleSizeSelect = useCallback(
    (size: string) => {
      const variant = item.variants?.find((v) => v.size === size);
      if (!variant || variant.stock_qty === 0) return;   // can't select OOS
      setSelectedSize(size);
      setQuantity(variant.stock_qty > 0 ? 1 : 0);        // reset qty to 1 on size change
    },
    [item.variants]
  );

  const handleMinus = () => {
    if (!selectedSize) return;
    setQuantity((q) => Math.max(0, q - 1));
  };

  const handlePlus = () => {
    if (!selectedSize) return;
    setQuantity((q) => Math.min(maxStock, q + 1));
  };

  const handleAddToCart = async () => {
    if (!selectedSize || quantity === 0) return;

    addToCart({
      item_id: item._id,
      item_name: item.name,
      item_type: item.item_type,
      image_url: item.primary_image || item.image_url || '',
      price: item.price_paisa / 100,
      selected_size: selectedSize,
      quantity,
    });

    // We can reset state after feedback
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        setQuantity(0);
        setSelectedSize(null);
        resolve();
      }, 10);
    });
  };

  const canAdd = selectedSize !== null && quantity > 0;

  // Variants for quantity stepper
  const qtyVariants = {
    initial: (dir: number) => ({
      y: dir > 0 ? 8 : -8,
      opacity: 0,
    }),
    animate: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.15 }
    },
    exit: (dir: number) => ({
      y: dir > 0 ? -8 : 8,
      opacity: 0,
      transition: { duration: 0.15 }
    })
  };

  return (
    <div className="flex flex-col bg-white border border-[var(--color-border)] group" style={{ borderRadius: 0 }}>
      {/* ─── Image Gallery ─── */}
      <div className="relative overflow-hidden aspect-[4/3] sm:aspect-square group-hover:[&>div>img]:scale-[1.04] transition-transform duration-400 ease-out bg-[var(--color-surface-alt)]">
        <ProductImageGallery
          images={item.images}
          primaryImage={item.primary_image}
          fallbackUrl={item.image_url}
          productName={item.name}
        />
      </div>

      {/* ─── Body ─── */}
      <div className="p-6 flex flex-col flex-grow gap-6">
        {/* name + price */}
        <div>
          <span className="text-[11px] text-[var(--color-ink-muted)] uppercase tracking-wider block mb-1">
            {item.item_type}
          </span>
          <h3 className="text-[14px] font-sans font-semibold text-[var(--color-ink)] leading-tight line-clamp-2 mb-2">
            {item.name}
          </h3>
          <div className="text-[16px] font-sans font-bold text-[var(--color-ink)] tracking-tight">
            ₹{item.price_paisa > 0 ? (item.price_paisa / 100).toFixed(0) : 'TBD'}
          </div>
        </div>

        {/* ─── Size Selector ─── */}
        <div>
          <span className="text-[9px] uppercase tracking-widest text-[var(--color-ink-muted)] block mb-3">
            Select Size
          </span>
          <div className="flex flex-wrap gap-2">
            {(item.variants || []).map((s) => {
              const outOfStock = s.stock_qty === 0;
              const isSelected = selectedSize === s.size;

              return (
                <motion.button
                  whileTap={!outOfStock ? { scale: 0.92 } : undefined}
                  key={s.size}
                  disabled={outOfStock}
                  onClick={() => handleSizeSelect(s.size)}
                  className={`
                    relative min-w-[48px] h-10 px-3 text-[13px] font-bold border-[1.5px] transition-colors duration-150 overflow-hidden
                    ${outOfStock
                      ? "bg-[var(--color-bg)] text-[var(--color-ink-subtle)] border-[var(--color-border)] cursor-not-allowed"
                      : isSelected
                        ? "bg-[var(--color-navy)] text-white border-[var(--color-navy)]"
                        : "bg-white text-[var(--color-ink)] border-[var(--color-border)] hover:border-[var(--color-ink-muted)] hover:bg-[var(--color-surface-alt)]"
                    }
                  `}
                  style={{ borderRadius: 0 }}
                >
                  {s.size}
                  {outOfStock && (
                    <span className="absolute inset-0 block pointer-events-none before:absolute before:top-1/2 before:left-[-10%] before:w-[120%] before:h-[1px] before:bg-[var(--color-ink-subtle)] before:-rotate-[25deg]" />
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* low stock warning */}
          <AnimatePresence>
            {selectedSize && lowStock && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-1.5 mt-3 text-[var(--color-navy)] text-[10px] font-bold uppercase tracking-widest overflow-hidden"
              >
                <AlertTriangle size={12} />
                Limited Stock: {maxStock} Remaining
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ─── Quantity Selector ─── */}
        <div>
          <span className="text-[9px] uppercase tracking-widest text-[var(--color-ink-muted)] block mb-3">
            Quantity
          </span>
          <div
            className={`inline-flex items-center border border-[var(--color-border)] transition-opacity ${
              !selectedSize ? "opacity-30 pointer-events-none" : ""
            }`}
          >
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={handleMinus}
              disabled={!selectedSize || quantity <= 0}
              className="w-10 h-10 flex items-center justify-center text-[var(--color-ink-muted)] hover:text-[var(--color-navy)] hover:bg-[var(--color-surface-alt)] transition-colors disabled:opacity-30"
            >
              <Minus size={14} />
            </motion.button>
            <div className="w-12 h-10 flex items-center justify-center overflow-hidden">
              <AnimatePresence mode="popLayout" custom={direction}>
                <motion.span 
                  key={quantity}
                  custom={direction}
                  variants={qtyVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="font-bold text-[var(--color-ink)] tabular-nums text-sm block"
                >
                  {quantity}
                </motion.span>
              </AnimatePresence>
            </div>
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={handlePlus}
              disabled={!selectedSize || quantity >= maxStock}
              className="w-10 h-10 flex items-center justify-center text-[var(--color-ink-muted)] hover:text-[var(--color-navy)] hover:bg-[var(--color-surface-alt)] transition-colors disabled:opacity-30"
            >
              <Plus size={14} />
            </motion.button>
          </div>
        </div>

        {/* spacer */}
        <div className="flex-grow" />

        {/* ─── Add to Cart Button ─── */}
        <ButtonWithFeedback
          onClick={handleAddToCart}
          disabled={!canAdd}
          className="btn-primary w-full py-4 text-[11px]"
          defaultText="Add to Collection"
          successText="Added"
        />
      </div>
    </div>
  );
}
