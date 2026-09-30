// src/pages/Dashboard.jsx
// Protected page. Demonstrates reading user data from Clerk
// and making an authenticated API call with useApi().

import { useUser } from '@clerk/clerk-react'
import { useState } from 'react'
import { useApi } from '../hooks/useApi'

export default function Dashboard() {
  const { user } = useUser()
  const { apiFetch } = useApi()
  const [apiResult, setApiResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Demo: call a protected backend endpoint
  async function testApiCall() {
    setLoading(true)
    setError(null)
    try {
      // Replace with your real API endpoint
      const data = await apiFetch('/api/me')
      setApiResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const isGoogleUser = user?.externalAccounts?.some(
    (a) => a.provider === 'google'
  )

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-sub">Welcome back, {user?.firstName ?? 'there'}.</p>
      </div>

      <div className="card-grid">
        {/* User info card */}
        <div className="card">
          <h2 className="card-title">Your account</h2>
          <div className="user-detail-row">
            {user?.imageUrl
              ? <img src={user.imageUrl} alt="" className="avatar avatar-lg" />
              : <div className="avatar avatar-lg avatar-fallback">
                  {user?.firstName?.[0] ?? '?'}
                </div>
            }
            <div>
              <p className="detail-name">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="detail-email">
                {user?.emailAddresses[0]?.emailAddress}
              </p>
              {isGoogleUser && (
                <span className="badge badge-google">
                  Signed in with Google
                </span>
              )}
            </div>
          </div>
          <dl className="detail-list">
            <div>
              <dt>User ID</dt>
              <dd className="monospace">{user?.id}</dd>
            </div>
            <div>
              <dt>Created</dt>
              <dd>{user?.createdAt
                ? new Date(user.createdAt).toLocaleDateString()
                : '—'}
              </dd>
            </div>
            <div>
              <dt>Last sign-in</dt>
              <dd>{user?.lastSignInAt
                ? new Date(user.lastSignInAt).toLocaleDateString()
                : '—'}
              </dd>
            </div>
          </dl>
        </div>

        {/* API call demo card */}
        <div className="card">
          <h2 className="card-title">API call demo</h2>
          <p className="card-desc">
            Click below to make an authenticated request to your backend.
            The <code>useApi()</code> hook attaches the Clerk JWT automatically.
          </p>
          <button
            className="btn btn-primary"
            onClick={testApiCall}
            disabled={loading}
          >
            {loading ? 'Calling…' : 'Call /api/me →'}
          </button>

          {error && (
            <div className="result result-error">
              <strong>Error:</strong> {error}
              <p style={{ marginTop: 6, fontSize: 12, opacity: 0.7 }}>
                Start your backend server and make sure <code>/api/me</code> exists.
              </p>
            </div>
          )}
          {apiResult && (
            <pre className="result result-success">
              {JSON.stringify(apiResult, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </div>
  )
}
