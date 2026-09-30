// src/components/Layout.jsx
// Persistent sidebar + topbar shown on all authenticated pages.

import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useUser, useClerk } from '@clerk/clerk-react'

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: '⊞' },
  { to: '/profile',   label: 'Profile',   icon: '◎' },
  { to: '/settings',  label: 'Settings',  icon: '⚙' },
]

export default function Layout() {
  const { user } = useUser()
  const { signOut } = useClerk()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span className="logo-mark">◈</span>
          <span className="logo-text">myapp</span>
        </div>

        <nav className="sidebar-nav">
          {NAV.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                'nav-link' + (isActive ? ' nav-link--active' : '')
              }
            >
              <span className="nav-icon">{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-row">
            {user?.imageUrl
              ? <img src={user.imageUrl} alt="" className="avatar" />
              : <div className="avatar avatar-fallback">
                  {user?.firstName?.[0] ?? '?'}
                </div>
            }
            <div className="user-info">
              <span className="user-name">
                {user?.firstName} {user?.lastName}
              </span>
              <span className="user-email">
                {user?.emailAddresses[0]?.emailAddress}
              </span>
            </div>
          </div>
          <button className="sign-out-btn" onClick={handleSignOut}>
            Sign out
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}
