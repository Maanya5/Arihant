import axios, { AxiosResponse } from 'axios';
import { useAuthStore } from '@/store/authStore';

// TypeScript augmentation to allow custom 'meta' property on Axios responses
declare module 'axios' {
  export interface AxiosResponse<T = any, D = any> {
    meta?: {
      page?: number;
      limit?: number;
      total?: number;
      nextCursor?: string | null;
    };
  }
}

const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5051/api';
console.log('[API] Using baseURL:', baseURL);

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add interceptor for auth token
api.interceptors.request.use(async (config) => {
  // Get token from Zustand store
  const token = useAuthStore.getState().token;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
api.interceptors.response.use(
  (response) => {
    // Optimization: Automatically unwrap the standardized response envelope
    // This maintains backward compatibility with frontend code expecting raw data
    if (response.data && response.data.success === true && 'data' in response.data) {
      // Attach meta to the response object for optional use in pagination components
      response.meta = response.data.meta;
      // Overwrite response.data with the actual payload
      response.data = response.data.data;
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        // Clear all state using the new fullLogout logic
        useAuthStore.getState().fullLogout();
        
        // Prevent redirect loops if already on login
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
