"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useAuthStore } from "@/store/authStore";

/* ───────────────── types ───────────────── */
export interface CartItem {
  item_id: string;
  item_name: string;
  item_type: string;
  image_url: string;
  price: number;
  selected_size: string;
  quantity: number;
  subtotal: number;
  school_id?: string | null;
  schoolName?: string | null; // alias for new pages
  is_kit_item?: boolean;
  // Normalized aliases (read-only, computed in useCart)
  id?: string;
  name?: string;
  image?: string;
  size?: string;
}

interface AddItemPayload {
  id: string; name: string; price: number; image: string;
  size: string; quantity: number; schoolName?: string; item_type?: string;
}

interface CartContextValue {
  items: CartItem[];
  addToCart: (entry: Omit<CartItem, "subtotal">) => void;
  removeFromCart: (item_id: string, selected_size: string) => void;
  updateQuantity: (item_id: string, selected_size: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  isHydrated: boolean;
  // Simplified API for new pages
  addItem: (payload: AddItemPayload) => void;
  removeItem: (id: string, size: string) => void;
}

/* ───────────────── helpers ───────────────── */
function getCartKey(userId: string | null): string {
  return userId ? `arihant-cart-${userId}` : 'arihant-cart-guest';
}

function loadCartFromStorage(userId: string | null): CartItem[] {
  try {
    const key = getCartKey(userId);
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.error("Cart hydration failed:", err);
  }
  return [];
}

function saveCartToStorage(userId: string | null, items: CartItem[]) {
  const key = getCartKey(userId);
  if (items.length === 0) {
    localStorage.removeItem(key);
  } else {
    localStorage.setItem(key, JSON.stringify(items));
  }
}

/* ───────────────── context ───────────────── */
const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Watch auth store for user changes
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // Detect user change and reload cart
  useEffect(() => {
    const newUserId = isAuthenticated && user ? user.id : null;

    // If user changed, load new user's cart
    if (newUserId !== currentUserId) {
      // If we had a previous user, save their cart first
      if (isHydrated && currentUserId !== null) {
        saveCartToStorage(currentUserId, items);
      }

      setCurrentUserId(newUserId);

      // Load the new user's cart (or guest cart)
      const newCart = loadCartFromStorage(newUserId);
      setItems(newCart);
    }

    if (!isHydrated) {
      // Initial hydration
      const initialUserId = isAuthenticated && user ? user.id : null;
      setCurrentUserId(initialUserId);
      setItems(loadCartFromStorage(initialUserId));
      setIsHydrated(true);
    }
  }, [user, isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  // Persist to localStorage on change (only after hydration)
  useEffect(() => {
    if (isHydrated) {
      saveCartToStorage(currentUserId, items);
    }
  }, [items, isHydrated, currentUserId]);

  const addToCart = useCallback((entry: Omit<CartItem, "subtotal">) => {
    setItems((prev) => {
      const entryId = String(entry.item_id);
      
      const idx = prev.findIndex(
        (i) => String(i.item_id) === entryId && i.selected_size === entry.selected_size
      );
      
      const price = Number(entry.price) || 0;
      const quantity = Number(entry.quantity) || 0;

      if (idx >= 0) {
        const updated = [...prev];
        const existing = updated[idx];
        const newQty = existing.quantity + quantity;
        updated[idx] = { 
          ...existing, 
          quantity: newQty, 
          subtotal: price * newQty 
        };
        return updated;
      }
      
      return [...prev, { 
        ...entry, 
        item_id: entryId,
        price,
        quantity,
        subtotal: price * quantity 
      }];
    });
  }, []);

  const removeFromCart = useCallback((item_id: string, selected_size: string) => {
    const stringId = String(item_id);
    setItems((prev) => prev.filter((i) => !(String(i.item_id) === stringId && i.selected_size === selected_size)));
  }, []);

  const updateQuantity = useCallback((item_id: string, selected_size: string, quantity: number) => {
    const stringId = String(item_id);
    const newQty = Math.max(1, Number(quantity) || 1);
    
    setItems((prev) =>
      prev.map((i) =>
        String(i.item_id) === stringId && i.selected_size === selected_size
          ? { 
              ...i, 
              quantity: newQty, 
              subtotal: i.price * newQty 
            }
          : i
      )
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    const key = getCartKey(currentUserId);
    localStorage.removeItem(key);
  }, [currentUserId]);

  // Simplified adapter for new-style pages
  const addItem = useCallback((payload: AddItemPayload) => {
    addToCart({
      item_id:       payload.id,
      item_name:     payload.name,
      item_type:     payload.item_type || "",
      image_url:     payload.image,
      price:         payload.price,
      selected_size: payload.size,
      quantity:      payload.quantity,
      school_id:     null,
      schoolName:    payload.schoolName,
    });
  }, [addToCart]);

  const removeItem = useCallback((id: string, size: string) => {
    removeFromCart(id, size);
  }, [removeFromCart]);

  // Normalize items to expose unified API surface
  const normalizedItems: CartItem[] = items.map(i => ({
    ...i,
    id:    i.item_id,
    name:  i.item_name,
    image: i.image_url,
    size:  i.selected_size,
  }));

  const totalItems = items.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0);
  const totalPrice = items.reduce((sum, i) => sum + (Number(i.subtotal) || 0), 0);

  return (
    <CartContext.Provider value={{
      items: normalizedItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      totalItems,
      totalPrice,
      isHydrated,
      addItem,
      removeItem,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
