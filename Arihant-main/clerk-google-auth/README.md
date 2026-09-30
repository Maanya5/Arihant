# React + Clerk + Google Auth

Full project with routing, protected pages, and Google Sign-In via Clerk.

## Project structure

```
src/
├── main.jsx                    # Entry: ClerkProvider + BrowserRouter
├── App.jsx                     # All routes defined here
├── index.css                   # Global styles
│
├── components/
│   ├── ProtectedRoute.jsx      # Redirects to /login if not signed in
│   ├── PublicOnlyRoute.jsx     # Redirects to /dashboard if already signed in
│   └── Layout.jsx              # Sidebar + nav for authenticated pages
│
├── pages/
│   ├── LandingPage.jsx         # Public home page
│   ├── LoginPage.jsx           # Clerk <SignIn /> (includes Google button)
│   ├── RegisterPage.jsx        # Clerk <SignUp /> (includes Google button)
│   ├── Dashboard.jsx           # Protected — user info + API call demo
│   ├── Profile.jsx             # Protected — Clerk <UserProfile /> component
│   ├── Settings.jsx            # Protected — custom name/account settings
│   └── NotFound.jsx            # 404 fallback
│
└── hooks/
    └── useApi.js               # fetch() wrapper that auto-attaches Clerk JWT
```

## Quick start

### 1. Install dependencies
```bash
npm install
```

### 2. Create .env
```bash
cp .env.example .env
```
Then fill in your Clerk publishable key from https://dashboard.clerk.com

### 3. Enable Google in Clerk Dashboard
- Go to dashboard.clerk.com → your app
- User & Authentication → Social connections → enable Google
- In dev, Clerk provides shared OAuth credentials automatically

### 4. Run
```bash
npm run dev
```

## Route map

| Path         | Auth required | Description                        |
|--------------|---------------|------------------------------------|
| /            | No            | Landing page                       |
| /login       | No (redirects if signed in) | Clerk SignIn with Google  |
| /register    | No (redirects if signed in) | Clerk SignUp with Google  |
| /dashboard   | Yes           | User info + API demo               |
| /profile     | Yes           | Clerk UserProfile component        |
| /settings    | Yes           | Name update + connected accounts   |

## Making authenticated API calls

```js
import { useApi } from '../hooks/useApi'

function MyComponent() {
  const { apiFetch } = useApi()

  async function loadData() {
    const data = await apiFetch('/api/some-endpoint')
    console.log(data)
  }
}
```

The `useApi` hook automatically attaches the Clerk session JWT as a Bearer token.
On your backend, verify it with `@clerk/express` middleware.

## Production: use your own Google credentials

1. Go to console.cloud.google.com → Credentials → Create OAuth 2.0 Client ID
2. Set Authorized JavaScript Origins: https://yourdomain.com
3. Copy Client ID + Secret into Clerk Dashboard → SSO Connections → Google
