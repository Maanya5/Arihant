// server/index.js
import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { clerkMiddleware, requireAuth, clerkClient } from '@clerk/express'

const app  = express()
const PORT = process.env.PORT ?? 5000

/* ── Middleware ─────────────────────────────────────────────── */

// Allow requests from the Vite dev server
app.use(cors({ origin: 'http://localhost:5173', credentials: true }))

app.use(express.json())

// Validates the Bearer token on every request and populates req.auth
// Does NOT reject unauthenticated requests — requireAuth() does that per-route
app.use(clerkMiddleware())

/* ── Routes ─────────────────────────────────────────────────── */

// Public — no auth required
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Protected — returns full Clerk user profile
app.get('/api/me', requireAuth(), async (req, res, next) => {
  try {
    const user = await clerkClient.users.getUser(req.auth.userId)

    res.json({
      id:               user.id,
      email:            user.emailAddresses[0]?.emailAddress,
      firstName:        user.firstName,
      lastName:         user.lastName,
      picture:          user.imageUrl,
      authProvider:     user.externalAccounts[0]?.provider ?? 'email',
      googleConnected:  user.externalAccounts.some(a => a.provider === 'google'),
    })
  } catch (err) {
    next(err)
  }
})

// Protected — minimal auth check demo
app.get('/api/protected', requireAuth(), (req, res) => {
  res.json({
    message:  'You are authenticated',
    userId:   req.auth.userId,
  })
})

/* ── Global error handler ───────────────────────────────────── */
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(err.status ?? 500).json({ message: err.message ?? 'Server error' })
})

/* ── Start ──────────────────────────────────────────────────── */
app.listen(PORT, () => {
  console.log(`🚀  Server running at http://localhost:${PORT}`)
  console.log(`🔗  Health: http://localhost:${PORT}/api/health`)
})
