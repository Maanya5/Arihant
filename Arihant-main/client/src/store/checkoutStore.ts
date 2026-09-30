import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Address {
  fullName: string;
  phone: string;
  addressLine1: string;
  city: string;
  state: string;
  zipCode: string;
}

interface CheckoutState {
  step: number; // 1: Address, 2: Payment, 3: Confirmation
  shippingAddress: Address;
  paymentMethod: string;
  
  setStep: (step: number) => void;
  setShippingAddress: (address: Partial<Address>) => void;
  setPaymentMethod: (method: string) => void;
  resetCheckout: () => void;
}

const initialAddress: Address = {
  fullName: '',
  phone: '',
  addressLine1: '',
  city: '',
  state: '',
  zipCode: '',
};

const initialState = {
  step: 1,
  shippingAddress: initialAddress,
  paymentMethod: 'UPI',
};

export const useCheckoutStore = create<CheckoutState>()(
  persist(
    (set) => ({
      ...initialState,

      setStep: (step) => set({ step }),

      setShippingAddress: (address) => set((state) => ({
        shippingAddress: { ...state.shippingAddress, ...address }
      })),

      setPaymentMethod: (paymentMethod) => set({ paymentMethod }),

      resetCheckout: () => {
        set(initialState);
        // Also clear the persisted storage
        localStorage.removeItem('arihant-checkout-storage');
      },
    }),
    {
      name: 'arihant-checkout-storage',
    }
  )
);
