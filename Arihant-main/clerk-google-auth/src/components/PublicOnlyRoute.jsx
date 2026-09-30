// src/components/PublicOnlyRoute.jsx
// Redirects already-authenticated users away from login/register pages.
// Prevents signed-in users from seeing the login screen on back-navigation.

import { useAuth } from '@clerk/clerk-react'
import { Navigate, Outlet } from 'react-router-dom'

export default function PublicOnlyRoute() {
  const { isSignedIn } = useAuth()

  if (isSignedIn) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
