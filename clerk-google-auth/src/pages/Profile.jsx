// src/pages/Profile.jsx
// Uses Clerk's pre-built <UserProfile /> component.
// Lets users update name, email, password, connected accounts (Google), etc.

import { UserProfile } from '@clerk/clerk-react'

export default function Profile() {
  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Profile</h1>
        <p className="page-sub">Manage your account details and connected sign-in methods.</p>
      </div>

      <UserProfile
        appearance={{
          elements: {
            rootBox: 'clerk-root clerk-profile-root',
            card: 'clerk-card',
          },
        }}
      />
    </div>
  )
}
