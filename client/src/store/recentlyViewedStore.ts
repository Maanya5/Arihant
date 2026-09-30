import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const MAX_ITEMS = 8;

interface RecentlyViewedState {
  ids: string[]; // ordered list of product IDs (newest first)
  addItem: (id: string) => void;
  clear: () => void;
}

export const useRecentlyViewedStore = create<RecentlyViewedState>()(
  persist(
    (set, get) => ({
      ids: [],

      addItem: (id: string) =>
        set(state => {
          const filtered = state.ids.filter(i => i !== id); // remove if already present
          return { ids: [id, ...filtered].slice(0, MAX_ITEMS) }; // add to front, cap at 8
        }),

      clear: () => set({ ids: [] }),
    }),
    {
      name: 'arihant-recently-viewed',
      partialize: (state) => ({ ids: state.ids }),
    }
  )
);
