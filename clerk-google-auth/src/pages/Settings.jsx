// src/pages/Settings.jsx
import { useUser } from '@clerk/clerk-react'
import { useState } from 'react'

export default function Settings() {
  const { user, isLoaded } = useUser()
  const [firstName, setFirstName] = useState(user?.firstName ?? '')
  const [lastName,  setLastName]  = useState(user?.lastName  ?? '')
  const [saving, setSaving]       = useState(false)
  const [saved, setSaved]         = useState(false)
  const [error, setError]         = useState(null)

  if (!isLoaded) return null

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      // Clerk's user.update() patches name fields directly
      await user.update({ firstName, lastName })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err.errors?.[0]?.message ?? err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-sub">Update your display name and preferences.</p>
      </div>

      <div className="card" style={{ maxWidth: 480 }}>
        <h2 className="card-title">Display name</h2>
        <form onSubmit={handleSave} className="settings-form">
          <div className="field">
            <label htmlFor="first-name">First name</label>
            <input
              id="first-name"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              autoComplete="given-name"
            />
          </div>
          <div className="field">
            <label htmlFor="last-name">Last name</label>
            <input
              id="last-name"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              autoComplete="family-name"
            />
          </div>

          {error && <p className="form-error">{error}</p>}
          {saved && <p className="form-success">Saved successfully.</p>}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving}
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      </div>

      <div className="card" style={{ maxWidth: 480, marginTop: '1.5rem' }}>
        <h2 className="card-title">Connected accounts</h2>
        {user?.externalAccounts?.length > 0 ? (
          <ul className="connected-list">
            {user.externalAccounts.map((acct) => (
              <li key={acct.id} className="connected-item">
                <span className="connected-provider">{acct.provider}</span>
                <span className="connected-email">{acct.emailAddress}</span>
                <span className="badge badge-google">Connected</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="card-desc">No external accounts connected.</p>
        )}
      </div>
    </div>
  )
}
