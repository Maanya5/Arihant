import { create } from 'zustand';

interface UniformState {
  schoolId: string | null;
  gender: string | null;
  classRange: string | null;
  
  setSchoolId: (id: string) => void;
  setGender: (gender: string) => void;
  setClassRange: (classRange: string) => void;
  resetUniformFlow: () => void;
}

const initialState = {
  schoolId: null as string | null,
  gender: null as string | null,
  classRange: null as string | null,
};

// Load from sessionStorage on init
function loadFromSession(): typeof initialState {
  if (typeof window === 'undefined') return initialState;
  try {
    const raw = sessionStorage.getItem('arihant-uniform-flow');
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return initialState;
}

function saveToSession(state: typeof initialState) {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem('arihant-uniform-flow', JSON.stringify(state));
  } catch { /* ignore */ }
}

export const useUniformStore = create<UniformState>((set, get) => ({
  ...loadFromSession(),

  setSchoolId: (schoolId) => {
    set({ schoolId });
    saveToSession({ ...get(), schoolId });
  },
  
  setGender: (gender) => {
    set({ gender });
    saveToSession({ ...get(), gender });
  },
  
  setClassRange: (classRange) => {
    set({ classRange });
    saveToSession({ ...get(), classRange });
  },
  
  resetUniformFlow: () => {
    set(initialState);
    sessionStorage.removeItem('arihant-uniform-flow');
  },
}));
