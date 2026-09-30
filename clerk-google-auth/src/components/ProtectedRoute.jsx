// src/components/ProtectedRoute.jsx
// Redirects unauthenticated users to /login.
// Wraps any route that requires a signed-in user.

import { useAuth } from '@clerk/clerk-react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'

export default function ProtectedRoute() {
  const { isSignedIn } = useAuth()
  const location = useLocation()

  if (!isSignedIn) {
    // Pass the attempted URL so we can redirect back after login
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <Outlet />
}
