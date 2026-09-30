# 🏛️ Arihant Store — Luxury School Uniform Marketplace

Arihant Store is a premium, enterprise-grade e-commerce marketplace dedicated to official school uniform retailing. It connects parents and partner schools, enabling frictionless browsing by school classes (Standards), uniform categories, and sizes. It includes optimized MongoDB index structures, Redis caching for heavy catalogues, secure Firebase Google OAuth synced with custom JWT tokens, and an administrative inventory system for bulk stock management via CSV files.

---

## 🏗️ 1. Core Architecture & Tech Stack

The application follows a decoupled **MERN (MongoDB, Express, React/Next.js, Node)** stack with modern state management, high security standards, and luxury editorial styling.

### Client-Side (Next.js Application)
*   **Framework:** Next.js (App Router, Server & Client Components)
*   **Styling & Theme:** Tailwind CSS & Vanilla CSS styled with a curated luxury editorial HSL theme (vibrant and harmonized palette including deep brand inks, bone white backgrounds, and soft accents; see [globals.css](file:///Users/rishi/Arihant/client/src/app/globals.css)).
*   **Animations:** `framer-motion` for subtle micro-interactions, smooth sliding transitions, and premium page fade-ins.
*   **Global State Managers:** 
    *   **Zustand:** Multi-store architecture for fast, modular, in-memory client state ([authStore](file:///Users/rishi/Arihant/client/src/store/authStore.ts), [checkoutStore](file:///Users/rishi/Arihant/client/src/store/checkoutStore.ts), [uniformStore](file:///Users/rishi/Arihant/client/src/store/uniformStore.ts), [filterStore](file:///Users/rishi/Arihant/client/src/store/filterStore.ts), [wishlistStore](file:///Users/rishi/Arihant/client/src/store/wishlistStore.ts), and [recentlyViewedStore](file:///Users/rishi/Arihant/client/src/store/recentlyViewedStore.ts)).
    *   **React Context API:** Used for complex provider-level state interpolation like [CartContext](file:///Users/rishi/Arihant/client/src/context/CartContext.tsx) and [AuthContext](file:///Users/rishi/Arihant/client/src/context/AuthContext.tsx).

### Server-Side (Express.js API Node Server)
*   **Runtime:** Node.js with Express framework.
*   **Database ODM:** Mongoose (MongoDB object modeling).
*   **In-Memory Caching:** Redis (via `ioredis` with high-performance request retry overrides, fallback-to-database modes, and zero-overhead non-blocking cache sets; see [cacheService.js](file:///Users/rishi/Arihant/server/services/cacheService.js)).
*   **Background Jobs:** `node-cron` schedules daily tasks for low stock alerting.
*   **Mailer Service:** Integration with `Resend` service API for professional e-commerce notifications.
*   **Payment Gateway:** Razorpay API for Indian payment routing.

---

## 🗄️ 2. Database Models & Schema Design

All schemas are declared under `/server/models/` and utilize indexing strategy to speed up production queries.

```
       ┌────────────────────────┐
       │         User           │
       └────────────────────────┘
                   │
                   ▼ (1:N)
 ┌──────────────┐     ┌──────────────┐
 │   Address    │◄────┼    Order     │
 └──────────────┘     └──────────────┘
                             │
                             ▼ (contains items linking to)
 ┌──────────────┐     ┌──────────────┐
 │    School    │◄────┼   Product    │
 └──────────────┘     └──────────────┘
    │           \            │
    │ (1:N)      \ (1:N)     ▼ (1:N)
    ▼             \   ┌──────────────┐
 ┌──────────────┐  └──┼ProductVariant│
 │SchoolStandard│     └──────────────┘
 └──────────────┘
```

### 🏫 School (`School.js`)
Stores partnered educational institutions.
*   **Fields:** `name` (String, Unique), `area` (String), `city` (String), `state` (String), `board` (String), `logo` (String), `banner` (String), `is_active` (Boolean), `created_at` (Date).

### 🏫 SchoolStandard / Class (`Standard.js`)
Defines the divisions and classes available per school, filtered by gender.
*   **Fields:** `school_id` (ObjectId -> School), `class_name` (String), `gender` ('boy', 'girl'), `division` ('primary', 'secondary', 'higher'), `is_active` (Boolean).
*   **Index:** Compound unique index `{ school_id: 1, class_name: 1, gender: 1 }` prevents double definitions.

### 👕 Product (`Product.js`)
Unified school uniform listing.
*   **Fields:** `standard_id` (ObjectId -> SchoolStandard), `school_id` (ObjectId -> School), `name` (String), `item_type` (Enum of 17 apparel categories like shirt, pant, blazer, blazer), `uniform_type` ('regular', 'sports', 'house'), `price_paisa` (Number), `mrp_paisa` (Number), `tags` (Array of Strings), `itemSlug` (String), `image_url` (Legacy String), `images` (Gallery Array), `primary_image` (String), `is_active` (Boolean).
*   **Indexes:**
    *   `{ school_id: 1, standard_id: 1, item_type: 1 }` — Catalogue search optimization.
    *   `{ uniform_type: 1 }` — Quick uniform filter searches.
    *   `{ name: 'text' }` — Full-text search support.
    *   `{ itemSlug: 1 }` — Unique, PDP URL optimization.

### 📏 ProductVariant (`ProductVariant.js`)
Represents stock availability at SKU-level for each uniform size.
*   **Fields:** `product_id` (ObjectId -> Product), `size` (String), `stock_qty` (Number), `is_available` (Boolean).
*   **Index:** `{ product_id: 1, size: 1 }` (Compound unique) prevents size duplications and speeds up SKU checks.

### 📝 Other Models
*   **User (`User.js`):** Integrates standard MERN logins or Firebase `uid` parameters, names, roles, and emails.
*   **Address (`Address.js`):** Saved client coordinates.
*   **Cart (`Cart.js`):** Server-side cart persistence.
*   **Wishlist (`Wishlist.js`):** User curated items.
*   **Order (`Order.js`):** Complete order logs, totals, payment details, shipping markers, and a state tracking history array.
*   **Coupon (`Coupon.js`):** E-commerce promo configurations.
*   **Inquiry (`Inquiry.js`):** Business-to-business school uniform order requests.

---

## 🔒 3. Authentication & Security Layer

We use a dual hybrid auth flow combining **Firebase Client Authentication** and **Custom Backend JWT Session Management** in [AuthContext.tsx](file:///Users/rishi/Arihant/client/src/context/AuthContext.tsx):

1.  **Client Signs In:** The frontend opens the Firebase Google Authentication popup via `signInWithPopup(auth, googleProvider)`.
2.  **Verification Token Handshake:** On auth state changes, the client retrieves a temporary Firebase security token (`getIdToken(firebaseUser)`).
3.  **Backend Issuance:** The client posts this Firebase ID token to the backend endpoint `POST /api/auth/google`. 
4.  **Admin Verification:** The backend parses the token using `firebase-admin` tools, normalization rules are applied to sanitize fields, and the server generates a custom, secure backend JWT.
5.  **Synchronization:** The client receives this JWT and saves the signed session in [authStore.ts](file:///Users/rishi/Arihant/client/src/store/authStore.ts). Subsequent API requests carry the JWT as a `Bearer` token inside the `Authorization` header intercepted automatically by [api.ts](file:///Users/rishi/Arihant/client/src/lib/api.ts).

---

## ⚡ 4. Enterprise Optimization Strategies

### 1. Redis Caching Pipeline
Instead of querying heavy catalogues (School info + Standards + Products) repeatedly, the backend utilizes `getCachedOrFetch` in [cacheService.js](file:///Users/rishi/Arihant/server/services/cacheService.js). It keeps catalogues cached for **600 seconds**.
*   **Graceful Retries:** If Redis goes down, it disconnects immediately and routes database requests transparently, preventing database queries from stalling.
*   **Write-Through Eviction:** School mutations automatically invalidate corresponding catalog keys.

### 2. High-Performance MongoDB Aggegations
*   **Aggregation Facets:** Routes like `/api/products` execute single-trip aggregations using `$facet` to retrieve both paginated arrays and count documents at once.
*   **Lean Queries:** Detailed endpoints utilize `.lean()` to directly return raw JSON records, bypassing heavy Mongoose overhead.

---

## 📦 5. Core E-Commerce Operations

### A. Dynamic Cart Management
The shopping cart uses [CartContext.tsx](file:///Users/rishi/Arihant/client/src/context/CartContext.tsx) to achieve instant UI responsiveness. It runs entirely local to the browser's storage and normalizes backend keys (`item_id` / `image_url`) into client-friendly keys (`id` / `image`) on the fly. 

### B. Bulk Inventory Stock Upload (CSV)
Administrators manage inventory stock levels in bulk without having to update individual sizes on the web panel:
*   **Template Download:** Generates a pre-formatted CSV template:
    `itemId,size,newStock`
*   **Bulk Database Execution:** The uploaded CSV is parsed on the server by [adminAnalytics.js](file:///Users/rishi/Arihant/server/routes/adminAnalytics.js#L407-L468) using `csvtojson` and submitted as a single Mongoose **`bulkWrite()`** update array. This minimizes database connections and executes thousands of stock adjustments in milliseconds.

---

## 🛠️ 6. Deployment & Settings

### Backend Environment Variables (`server/.env`)
```env
PORT=5051
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_jwt_secret
FRONTEND_URL=https://arihant-uniforms.vercel.app
REDIS_URL=redis://...
RAZORPAY_KEY_ID=rzp_live_...
RAZORPAY_KEY_SECRET=...
RESEND_API_KEY=re_...
OWNER_EMAIL=orders@arihantuniform.com
```

### Frontend Environment Variables (`client/.env.local`)
```env
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com/api
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_...
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```
