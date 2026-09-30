import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WishlistItem {
  _id: string;
  name: string;
  item_type: string;
  price_paisa: number;
  mrp_paisa?: number | null;
  primary_image?: string;
  itemSlug?: string;
  school_id?: { _id: string; name: string; city: string };
  standard_id?: { _id: string; class_name: string; gender: string };
}

interface WishlistState {
  items: string[]; // local set of product IDs for instant UI feedback
  isLoading: boolean;
  hydrate: (ids: string[]) => void;
  addItem: (id: string) => void;
  removeItem: (id: string) => void;
  toggleItem: (id: string) => void;
  isWishlisted: (id: string) => boolean;
  clearWishlist: () => void;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,

      hydrate: (ids: string[]) => set({ items: ids }),

      addItem: (id: string) =>
        set(state => ({
          items: state.items.includes(id) ? state.items : [...state.items, id]
        })),

      removeItem: (id: string) =>
        set(state => ({ items: state.items.filter(i => i !== id) })),

      toggleItem: (id: string) => {
        const { items, addItem, removeItem } = get();
        items.includes(id) ? removeItem(id) : addItem(id);
      },

      isWishlisted: (id: string) => get().items.includes(id),

      clearWishlist: () => set({ items: [] }),
    }),
    {
      name: 'arihant-wishlist',
      partialize: (state) => ({ items: state.items }),
    }
  )
);
