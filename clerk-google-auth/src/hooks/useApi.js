// src/hooks/useApi.js
// A thin wrapper around fetch that automatically attaches
// the Clerk JWT as a Bearer token on every request.
//
// Usage:
//   const { apiFetch } = useApi()
//   const data = await apiFetch('/api/me')

import { useAuth } from '@clerk/clerk-react'

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:5001'

export function useApi() {
  const { getToken } = useAuth()

  async function apiFetch(path, options = {}) {
    const token = await getToken()

    const res = await fetch(`${BASE}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(options.headers ?? {}),
      },
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }))
      throw new Error(err.message ?? 'Request failed')
    }

    return res.json()
  }

  return { apiFetch }
}
