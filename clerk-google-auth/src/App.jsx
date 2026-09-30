// src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'

import LandingPage   from './pages/LandingPage'
import LoginPage     from './pages/LoginPage'
import RegisterPage  from './pages/RegisterPage'
import Dashboard     from './pages/Dashboard'
import Profile       from './pages/Profile'
import Settings      from './pages/Settings'
import NotFound      from './pages/NotFound'
import ProtectedRoute from './components/ProtectedRoute'
import PublicOnlyRoute from './components/PublicOnlyRoute'
import Layout        from './components/Layout'

export default function App() {
  const { isLoaded } = useAuth()

  // Wait for Clerk to finish loading before rendering routes.
  // Prevents flash of wrong page on refresh.
  if (!isLoaded) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a0a0a',
      }}>
        <div className="spinner" />
      </div>
    )
  }

  return (
    <Routes>
      {/* Public routes — anyone can visit */}
      <Route path="/" element={<LandingPage />} />

      {/* Public-only routes — redirect to /dashboard if already signed in */}
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Protected routes — redirect to /login if not signed in */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile"   element={<Profile />} />
          <Route path="/settings"  element={<Settings />} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
