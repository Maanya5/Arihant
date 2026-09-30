import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useState, useEffect } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  fullLogout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      
      login: (user, token) => set({ user, token, isAuthenticated: true }),
      
      logout: () => set({ user: null, token: null, isAuthenticated: false }),

      fullLogout: () => {
        // 1. Reset auth state
        set({ user: null, token: null, isAuthenticated: false });

        // 2. Clear all persisted Zustand stores from localStorage
        localStorage.removeItem('arihant-auth-storage');
        localStorage.removeItem('arihant-checkout-storage');

        // 3. Clear any cart keys (guest or user-specific)
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('arihant-cart-')) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(k => localStorage.removeItem(k));

        // 4. Clear sessionStorage (uniform flow, filters)
        sessionStorage.clear();

        // 5. Reset other Zustand stores (in-memory)
        //    These imports are dynamic to avoid circular deps
        const { useCheckoutStore } = require('./checkoutStore');
        const { useUniformStore } = require('./uniformStore');
        const { useFilterStore } = require('./filterStore');
        useCheckoutStore.getState().resetCheckout();
        useUniformStore.getState().resetUniformFlow();
        useFilterStore.getState().clearFilters();
      },
    }),
    {
      name: 'arihant-auth-storage',
    }
  )
);

export function useAuth() {
  const store = useAuthStore();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  return {
    ...store,
    isLoaded: hydrated && useAuthStore.persist.hasHydrated()
  };
}
