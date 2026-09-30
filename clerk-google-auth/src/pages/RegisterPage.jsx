// src/pages/RegisterPage.jsx
import { SignUp } from '@clerk/clerk-react'
import { Link } from 'react-router-dom'

export default function RegisterPage() {
  return (
    <div className="auth-page">
      <div className="auth-left">
        <Link to="/" className="auth-logo">
          <span className="logo-mark">◈</span>
          <span className="logo-text">myapp</span>
        </Link>
        <div className="auth-quote">
          <blockquote>"Sign up in seconds."</blockquote>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-form-wrap">
          <SignUp
            appearance={{
              elements: {
                rootBox: 'clerk-root',
                card: 'clerk-card',
              },
            }}
            afterSignUpUrl="/dashboard"
            signInUrl="/login"
          />
        </div>
      </div>
    </div>
  )
}
