// src/pages/LandingPage.jsx
import { Link } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'

export default function LandingPage() {
  const { isSignedIn } = useAuth()

  return (
    <div className="landing">
      <header className="landing-header">
        <span className="logo-mark">◈</span>
        <span className="logo-text">myapp</span>
        <div className="landing-header-actions">
          {isSignedIn ? (
            <Link to="/dashboard" className="btn btn-primary">
              Go to dashboard →
            </Link>
          ) : (
            <>
              <Link to="/login"    className="btn btn-ghost">Sign in</Link>
              <Link to="/register" className="btn btn-primary">Get started</Link>
            </>
          )}
        </div>
      </header>

      <section className="landing-hero">
        <p className="hero-eyebrow">Clerk + Google OAuth</p>
        <h1 className="hero-title">
          Auth that just<br />
          <em>works.</em>
        </h1>
        <p className="hero-sub">
          Email, password, and Google Sign-In — all handled.<br />
          Protected routes, user profiles, JWT-ready API calls.
        </p>
        <Link to="/register" className="btn btn-primary btn-lg">
          Start for free →
        </Link>
      </section>

      <section className="features-grid">
        {[
          { icon: '◉', title: 'Google OAuth', desc: 'One click sign-in with Google. No credentials to manage.' },
          { icon: '⚿', title: 'Protected routes', desc: 'Automatic redirects for unauthenticated users.' },
          { icon: '⊞', title: 'User dashboard', desc: 'Profile, settings, and session management built-in.' },
          { icon: '⬡', title: 'JWT for APIs', desc: 'useApi() hook attaches Bearer tokens on every request.' },
        ].map(({ icon, title, desc }) => (
          <div className="feature-card" key={title}>
            <span className="feature-icon">{icon}</span>
            <h3>{title}</h3>
            <p>{desc}</p>
          </div>
        ))}
      </section>
    </div>
  )
}
