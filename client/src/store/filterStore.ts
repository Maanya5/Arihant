import { create } from 'zustand';

interface FilterState {
  category: string;
  priceRange: [number, number];
  size: string;
  setCategory: (category: string) => void;
  setPriceRange: (range: [number, number]) => void;
  setSize: (size: string) => void;
  clearFilters: () => void;
}

const initialState = {
  category: 'all',
  priceRange: [0, 10000] as [number, number],
  size: 'all',
};

export const useFilterStore = create<FilterState>((set) => ({
  ...initialState,
  
  setCategory: (category) => set({ category }),
  
  setPriceRange: (priceRange) => set({ priceRange }),
  
  setSize: (size) => set({ size }),
  
  clearFilters: () => set(initialState),
}));
