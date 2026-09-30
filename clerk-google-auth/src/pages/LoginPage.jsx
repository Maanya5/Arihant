// src/pages/LoginPage.jsx
// Clerk's <SignIn /> automatically shows the Google button
// if Google is enabled in your Clerk dashboard.

import { SignIn } from '@clerk/clerk-react'
import { Link } from 'react-router-dom'

export default function LoginPage() {
  return (
    <div className="auth-page">
      <div className="auth-left">
        <Link to="/" className="auth-logo">
          <span className="logo-mark">◈</span>
          <span className="logo-text">myapp</span>
        </Link>
        <div className="auth-quote">
          <blockquote>"The fastest way to ship auth."</blockquote>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-form-wrap">
          <SignIn
            appearance={{
              elements: {
                rootBox: 'clerk-root',
                card: 'clerk-card',
              },
            }}
            // After sign-in, redirect to dashboard
            afterSignInUrl="/dashboard"
            // If user clicks "sign up" inside the Clerk UI
            signUpUrl="/register"
          />
        </div>
      </div>
    </div>
  )
}
