# Arihant Store — Database & Backend Architecture Reference Manual

This document provides a highly technical, end-to-end breakdown of the database schemas, API routing architectures, authentication mechanisms, and external integrations (Razorpay, Firebase, Resend, Cloudinary) that power the Arihant Store backend.

---

## 1. System Architecture Overview

The Arihant Store backend is structured as a decoupled, high-performance Node.js / Express.js REST API. It interfaces with MongoDB for persistent storage, uses Redis for catalog caching, and integrates with Firebase for federated login.

```mermaid
graph TD
    %% Clients
    Client[Next.js 15 Client App] -->|HTTPS Requests| ExpressAPI[Express.js Server Node]
    
    %% Middleware Layer
    subgraph ExpressAPI ["Express.js Server (Node.js)"]
        Router[Router Layer]
        AuthMW[Auth / Admin Middleware]
        RateLimit[Rate Limiters / Helmet / XSS]
        CronJob[Cron Scheduler]
        
        Router --> AuthMW
        AuthMW --> Controllers[Controller / Transaction Layer]
    end
    
    %% Cache & DB
    Controllers -->|Cache Lookup| Redis[(Redis Cache)]
    Controllers -->|Read/Write Operations| MongoDB[(MongoDB Database)]
    
    %% External Integrations
    AuthMW -->|Verify ID Tokens| Firebase[Firebase Admin SDK]
    Controllers -->|Initiate/Verify Payment| Razorpay[Razorpay Payment API]
    Controllers -->|Deliver Transactions| Resend[Resend Mailer API]
    Controllers -->|Upload Assets| Cloudinary[Cloudinary Media Storage]
    CronJob -->|Check Low Stock| Resend
```

---

## 2. Database Design & Schema Reference

All entities are managed via **Mongoose (MongoDB)**. The schema is optimized for fast catalog indexing, transaction safety (using native sessions/transactions during checkout), and automatic cleanup of inactive items.

### Entity-Relationship Diagram

```
                 +-------------------+
                 |      School       |
                 +-------------------+
                           | 1
                           |
                           | N
                 +-------------------+
                 |  SchoolStandard   |
                 +-------------------+
                           | 1
                           |
                           | N
                 +-------------------+
                 |      Product      | <=========+
                 +-------------------+           |
                           | 1                   |
                           |                     |
                           | N                   | N
                 +-------------------+     +-----------+
                 |  ProductVariant   |     | Wishlist  |
                 +-------------------+     +-----------+
                           ^                     ^
                           | 1                   |
                           |                     |
                           | N                   |
    +--------+ 1         +-----------+ 1   1 +---+---+
    |  User  | --------> |   Cart    | ----> | User  |
    +--------+           +-----------+       +-------+
        | 1                     |
        |                       | (checkout)
        | N                     v
    +--------+ 1         +-----------+ 1     +-----------+
    | Address| <-------- |   Order   | ----> |  Payment  |
    +--------+           +-----------+       +-----------+
```

---

### Collection Specifications

#### 1. `schools`
Stores information about school units. Catalogs are scoped per school.

* **Collection Name**: `schools`
* **Mongoose Model File**: `server/models/School.js`

| Field | Type | Required | Unique | Indexes / Notes |
| :--- | :--- | :---: | :---: | :--- |
| `_id` | `ObjectId` | Yes | Yes | MongoDB Primary Key |
| `name` | `String` | Yes | Yes | Index. e.g. *"St. Xavier's School"* |
| `area` | `String` | Yes | No | Neighborhood / Area |
| `city` | `String` | Yes | No | e.g. *"Ahmedabad"* |
| `state` | `String` | Yes | No | e.g. *"Gujarat"* |
| `board` | `String` | No | No | e.g. *"CBSE"*, *"ICSE"*, *"State"* |
| `logo` | `String` | No | No | URL to Cloudinary hosted school crest |
| `banner` | `String` | No | No | URL to Cloudinary banner |
| `is_active` | `Boolean`| Yes | No | Default: `true`. Deactivating hides school from frontend |
| `created_at` | `Date` | Yes | No | Default: `Date.now` |

---

#### 2. `schoolstandards`
Represents uniform classes/grades for a particular school, including gender scoping.

* **Collection Name**: `schoolstandards`
* **Mongoose Model File**: `server/models/Standard.js`

| Field | Type | Required | Unique | Indexes / Notes |
| :--- | :--- | :---: | :---: | :--- |
| `_id` | `ObjectId` | Yes | Yes | MongoDB Primary Key |
| `school_id` | `ObjectId` | Yes | No | Ref: `School` |
| `class_name`| `String` | Yes | No | e.g. *"Grade 5"*, *"LKG"* |
| `gender` | `String` | Yes | No | Enum: `['boy', 'girl']` |
| `division` | `String` | Yes | No | Enum: `['primary', 'secondary', 'higher']` |
| `is_active` | `Boolean` | Yes | No | Default: `true` |

* **Indices**:
  * **Compound Unique Index**: `{ school_id: 1, class_name: 1, gender: 1 }` (enforced via DB schema to prevent duplicate standards per school).

---

#### 3. `products`
Defines uniform and clothing inventory details. Note that sizes and pricing are split into variants for stock scalability.

* **Collection Name**: `products`
* **Mongoose Model File**: `server/models/Product.js`

| Field | Type | Required | Unique | Indexes / Notes |
| :--- | :--- | :---: | :---: | :--- |
| `_id` | `ObjectId` | Yes | Yes | MongoDB Primary Key |
| `school_id` | `ObjectId` | Yes | No | Ref: `School` |
| `standard_id`| `ObjectId` | Yes | No | Ref: `SchoolStandard` |
| `name` | `String` | Yes | No | Text Search Index. Name of item. |
| `item_type` | `String` | Yes | No | Enum: `['shirt', 'pant', 'shoes', 't-shirt', 'top', ...]` |
| `uniform_type`| `String` | Yes | No | Enum: `['regular', 'sports', 'house']`. Default: `regular` |
| `price_paisa`| `Number` | Yes | No | Current retail price in Paise (e.g. 59900 = ₹599.00) |
| `mrp_paisa` | `Number` | No | No | Max Retail Price in Paise (for strikethrough styling; null if no discount) |
| `tags` | `[String]` | Yes | No | Default: `[]`. e.g. `['best-seller', 'new-arrival']` |
| `itemSlug` | `String` | Yes | Yes | Sparse Index. URL slug generated via pre-save hook |
| `image_url` | `String` | No | No | Legacy image URL (deprecated, fallback) |
| `images` | `Array` | Yes | No | Array of schema objects containing Cloudinary image URLs and Unsplash attributions |
| `primary_image`|`String` | No | No | First item image URL. Auto-synced from `images[0]` before saving. |
| `is_active` | `Boolean` | Yes | No | Default: `true` |
| `created_at` | `Date` | Yes | No | Default: `Date.now` |

* **Indices**:
  * `{ school_id: 1, standard_id: 1, item_type: 1 }` (Speed up catalogue retrieval filtering).
  * `{ uniform_type: 1 }` (Categorical filtering).
  * `{ name: 'text' }` (For MongoDB fuzzy full-text searches).
  * `{ itemSlug: 1 }` (Unique PDP direct lookups).

---

#### 4. `productvariants`
Manages product SKU-level variables (e.g. standard product sizes and their separate stock levels).

* **Collection Name**: `productvariants`
* **Mongoose Model File**: `server/models/ProductVariant.js`

| Field | Type | Required | Unique | Indexes / Notes |
| :--- | :--- | :---: | :---: | :--- |
| `_id` | `ObjectId` | Yes | Yes | MongoDB Primary Key |
| `product_id`| `ObjectId` | Yes | No | Ref: `Product` |
| `size` | `String` | Yes | No | e.g. *"24"*, *"28"*, *"XL"* |
| `stock_qty` | `Number` | Yes | No | Current quantity available in store. Default: `0` |
| `is_available`|`Boolean` | Yes | No | Default: `true`. Updated to `false` when stock hits `0`. |

* **Indices**:
  * **Compound Unique Index**: `{ product_id: 1, size: 1 }` (ensures size integrity per product SKU and accelerates inventory checks).

---

#### 5. `users`
Represents accounts (customers and admins). Built to support both local password login and Google Single Sign-On (SSO).

* **Collection Name**: `users`
* **Mongoose Model File**: `server/models/User.js`

| Field | Type | Required | Unique | Indexes / Notes |
| :--- | :--- | :---: | :---: | :--- |
| `_id` | `ObjectId` | Yes | Yes | MongoDB Primary Key |
| `name` | `String` | Yes | No | Full Name |
| `email` | `String` | Yes | Yes | Unique, lowercased, trimmed index |
| `phone` | `String` | No | No | Customer phone number |
| `password` | `String` | No | No | Hashed using `bcryptjs` (salt: 10). Optional for Google SSO. |
| `firebaseUid`|`String` | No | Yes | Sparse index. Populated for Google users. |
| `role` | `String` | Yes | No | Enum: `['customer', 'admin']`. Default: `customer` |
| `image` | `String` | No | No | User profile image URL |
| `provider` | `String` | Yes | No | Default: `local`. Values: `local`, `google` |
| `createdAt` | `Date` | Yes | No | Default: `Date.now` |

---

#### 6. `addresses`
User delivery addresses.

* **Collection Name**: `addresses`
* **Mongoose Model File**: `server/models/Address.js`

| Field | Type | Required | Unique | Indexes / Notes |
| :--- | :--- | :---: | :---: | :--- |
| `_id` | `ObjectId` | Yes | Yes | MongoDB Primary Key |
| `user` | `ObjectId` | Yes | No | Ref: `User` |
| `street` | `String` | Yes | No | Street address details |
| `city` | `String` | Yes | No | City |
| `pincode` | `String` | Yes | No | Pincode / ZIP |
| `state` | `String` | Yes | No | State |
| `isDefault` | `Boolean` | Yes | No | Default: `false`. If true, automatically loaded during checkout. |
| `createdAt` | `Date` | Yes | No | Default: `Date.now` |

---

#### 7. `carts`
Temporary storage for shopping baskets. Features auto-expiring documents.

* **Collection Name**: `carts`
* **Mongoose Model File**: `server/models/Cart.js`

| Field | Type | Required | Unique | Indexes / Notes |
| :--- | :--- | :---: | :---: | :--- |
| `_id` | `ObjectId` | Yes | Yes | MongoDB Primary Key |
| `user` | `ObjectId` | Yes | Yes | Ref: `User` (1-to-1 relationship) |
| `items` | `Array` | Yes | No | Array of objects: `[{ product (ref), variant (ref), size, quantity }]` |
| `updatedAt` | `Date` | Yes | No | Default: `Date.now`. Updated on item updates. |

* **Indices**:
  * **TTL Index**: `{ updatedAt: 1 }` with `{ expireAfterSeconds: 2592000 }` (Automatically clears inactive shopping carts after 30 days to optimize DB size).

---

#### 8. `orders`
Defines sales orders, storing snapshots of product details at checkout to protect history from catalog changes.

* **Collection Name**: `orders`
* **Mongoose Model File**: `server/models/Order.js`

| Field | Type | Required | Unique | Indexes / Notes |
| :--- | :--- | :---: | :---: | :--- |
| `_id` | `ObjectId` | Yes | Yes | MongoDB Primary Key |
| `user` | `ObjectId` | Yes | No | Ref: `User` |
| `school` | `ObjectId` | No | No | Ref: `School` |
| `standard` | `ObjectId` | No | No | Ref: `SchoolStandard` |
| `items` | `Array` | Yes | No | Snapshots of products: `[{ product, variant, itemName, itemType, schoolName, standardName, imageUrl, size, quantity, price_paisa }]` |
| `totalAmount`| `Number` | Yes | No | Net payable total in Paisa |
| `paymentStatus`|`String` | Yes | No | Enum: `['pending', 'paid', 'failed']`. Default: `pending` |
| `orderStatus`| `String` | Yes | No | Enum: `['pending', 'processing', 'confirmed', 'packed', 'shipped', 'out-for-delivery', 'delivered', 'cancelled', 'returned']` |
| `tracking` | `Array` | Yes | No | Tracking milestones list: `[{ status, timestamp, note }]` |
| `estimatedDelivery`|`Date`| No | No | Rules-based estimated arrival |
| `couponCode`| `String` | No | No | Discount code applied |
| `discountAmount`|`Number`| Yes | No | Value of discount deducted in Paisa. Default: `0` |
| `paymentId` | `ObjectId` | No | No | Ref: `Payment` record |
| `razorpay_order_id`|`String`| No | No | Razorpay order generation ID |
| `razorpay_payment_id`|`String`| No | No | Razorpay payment confirmation ID |
| `shippingAddress`|`Object`| Yes | No | Copy of target address fields at order time |
| `trackingNumber`|`String` | No | No | Shipping carrier tracking code |
| `createdAt` | `Date` | Yes | No | Default: `Date.now` |

* **Indices**:
  * `{ user: 1, createdAt: -1 }` (Fast loading of customer history profiles).
  * `{ paymentStatus: 1, orderStatus: 1 }` (Accelerates admin dashboards).

---

#### 9. `payments`
Details payment gateway events.

* **Collection Name**: `payments`
* **Mongoose Model File**: `server/models/Payment.js`

| Field | Type | Required | Unique | Indexes / Notes |
| :--- | :--- | :---: | :---: | :--- |
| `_id` | `ObjectId` | Yes | Yes | MongoDB Primary Key |
| `order` | `ObjectId` | Yes | No | Ref: `Order` |
| `gatewayReferenceId`|`String`| No | No | Razorpay Order ID |
| `amount` | `Number` | Yes | No | Total amount charged in Paisa |
| `method` | `String` | Yes | No | Enum: `['UPI', 'Card', 'NetBanking', 'COD']` |
| `status` | `String` | Yes | No | Enum: `['pending', 'success', 'failed']`. Default: `pending` |
| `timestamp` | `Date` | Yes | No | Default: `Date.now` |
| `refundId` | `String` | No | No | Gateway refund identification code |
| `refundStatus`|`String` | Yes | No | Enum: `['none', 'pending', 'processed']`. Default: `none` |

---

#### 10. `coupons`
Store discount codes.

* **Collection Name**: `coupons`
* **Mongoose Model File**: `server/models/Coupon.js`

| Field | Type | Required | Unique | Indexes / Notes |
| :--- | :--- | :---: | :---: | :--- |
| `_id` | `ObjectId` | Yes | Yes | MongoDB Primary Key |
| `code` | `String` | Yes | Yes | Code string (uppercased, trimmed index) |
| `discountType`|`String` | Yes | No | Enum: `['flat', 'percent']` |
| `value` | `Number` | Yes | No | Discount value (Paise for flat; 0-100 for percent) |
| `minOrder` | `Number` | Yes | No | Minimum cart order total required in Paisa. Default: `0` |
| `maxUses` | `Number` | No | No | Max capacity of redeems allowed (null = infinite) |
| `usedCount` | `Number` | Yes | No | Count of redeems completed. Default: `0` |
| `expiry` | `Date` | Yes | No | Timestamp of expiry |
| `active` | `Boolean` | Yes | No | Default: `true` |

---

#### 11. `wishlists`
Stores user wishlists.

* **Collection Name**: `wishlists`
* **Mongoose Model File**: `server/models/Wishlist.js`

| Field | Type | Required | Unique | Indexes / Notes |
| :--- | :--- | :---: | :---: | :--- |
| `_id` | `ObjectId` | Yes | Yes | MongoDB Primary Key |
| `user` | `ObjectId` | Yes | Yes | Ref: `User` (1-to-1 relationship) |
| `items` | `Array` | Yes | No | List of items: `[{ item (ref: Product), addedAt }]` |
| `updatedAt` | `Date` | Yes | No | Default: `Date.now` |

* **Indices**:
  * `{ 'items.item': 1 }` (Enables analytics to find which users wishlisted specific products).

---

#### 12. `inquiries`
Handles school queries and custom uniform requests from institutions.

* **Collection Name**: `inquiries`
* **Mongoose Model File**: `server/models/Inquiry.js`

| Field | Type | Required | Unique | Indexes / Notes |
| :--- | :--- | :---: | :---: | :--- |
| `_id` | `ObjectId` | Yes | Yes | MongoDB Primary Key |
| `name` | `String` | Yes | No | Contact person |
| `phone` | `String` | Yes | No | Phone contact |
| `email` | `String` | No | No | Email address |
| `school` | `ObjectId` | No | No | Ref: `School` (if query is about a registered school) |
| `item` | `ObjectId` | No | No | Ref: `Product` |
| `quantity` | `Number` | Yes | No | Bulk quantity requested |
| `message` | `String` | No | No | Text description of inquiry |
| `status` | `String` | Yes | No | Enum: `['new', 'contacted', 'closed']`. Default: `new` |
| `createdAt` | `Date` | Yes | No | Default: `Date.now` |

---

## 3. Authentication & Security Layer

The API enforces safety policies, standard data validators, and a **Double-Token Federated OAuth Strategy** combining Firebase and custom Local tokens.

```
+------------------+                   +--------------------+                  +----------------------+
|  React Client    |                   |   Express Server   |                  |  Firebase Auth API   |
+------------------+                   +--------------------+                  +----------------------+
         |                                       |                                         |
         | 1. Authenticate & Obtain ID Token     |                                         |
         |-------------------------------------------------------------------------------->|
         | 2. ID Token returned                  |                                         |
         |<--------------------------------------------------------------------------------|
         |                                       |                                         |
         | 3. POST /api/auth/google {idToken}    |                                         |
         |-------------------------------------->|                                         |
         |                                       | 4. Verify ID Token using SDK            |
         |                                       |---------------------------------------->|
         |                                       | 5. Token verified (UID, Email, Name)    |
         |                                       |<----------------------------------------|
         |                                       |                                         |
         |                                       | 6. Find or Create User in MongoDB       |
         |                                       | 7. Sign custom backend JWT (7d expiry)  |
         | 8. Respond with custom JWT & Profile  |                                         |
         |<--------------------------------------|                                         |
         |                                       |                                         |
         | 9. GET /api/orders/my-orders (Header: Bearer JWT)                               |
         |-------------------------------------->|                                         |
         |                                       | 10. Decode JWT -> Attach user to req    |
         |                                       | 11. Send orders JSON                    |
         |<--------------------------------------|                                         |
```

### Rate Limiting Configurations
* **General API Endpoint (`/api`)**: Max **1000 requests** per 15 minutes per IP.
* **Sensitive Auth Gateway (`/api/auth`)**: Max **10 requests** per 15 minutes per IP.
* **Checkout Operations (`/api/payments`)**: Max **10 requests** per 15 minutes per IP.
* **Local Email Registrations (`/api/auth/register`)**: Max **5 signups** per hour per IP.

### Security Middlewares
1. **Helmet**: Configured with strict CORS exception allowances (`crossOriginResourcePolicy: "cross-origin"`).
2. **Express Mongo Sanitize**: Prevents query injection attacks by filtering characters matching MongoDB operators (e.g. `$`, `.`).
3. **XSS Clean**: Sanitizes input fields from client requests to eliminate cross-site scripting strings.
4. **HPP (HTTP Parameter Pollution)**: Protects parameters from pollution vectors.

---

## 4. End-to-End API Documentation

Below is the list of endpoints exposed by the Express API router.

### Authentication Endpoints (`/api/auth`)

* **`GET /api/auth/me`**
  * **Description**: Fetch user profile.
  * **Headers**: `Authorization: Bearer <token>`
  * **Access**: Customer / Admin
  * **Response**: `200 OK`
    ```json
    {
      "success": true,
      "data": { "_id": "...", "name": "...", "email": "...", "role": "customer" }
    }
    ```

* **`POST /api/auth/register`**
  * **Description**: Create credentials-based local account.
  * **Payload**:
    ```json
    { "name": "John Doe", "email": "john@example.com", "password": "Password123" }
    ```
  * **Response**: `201 Created`
    ```json
    {
      "token": "JWT_Access_Token_String",
      "user": { "id": "...", "name": "...", "email": "...", "role": "customer" }
    }
    ```

* **`POST /api/auth/login`**
  * **Description**: Local account credentials authentication.
  * **Payload**:
    ```json
    { "email": "john@example.com", "password": "Password123" }
    ```
  * **Response**: `200 OK` (returns JWT + user details)

* **`POST /api/auth/google`**
  * **Description**: Firebase Identity token exchange for backend JWT.
  * **Payload**:
    ```json
    { "idToken": "firebase_credential_id_token_string" }
    ```
  * **Response**: `200 OK` (returns custom JWT token valid for 7 days + user details)

---

### School & Catalog Endpoints (`/api/schools` & `/api/standards`)

* **`GET /api/schools`**
  * **Description**: List active schools (or all schools if query `admin=true` is present).
  * **Response**: `200 OK` (Array of School documents).

* **`GET /api/schools/:id`**
  * **Description**: Fetch full school catalog details.
  * **Caching**: Integrated with Redis. Resolves catalog data (School info + Standards + Products) in under 5ms.
  * **Response**: `200 OK`

* **`POST /api/schools`**
  * **Description**: Create new school entity.
  * **Access**: Admin only.
  * **Response**: `201 Created`

* **`PUT /api/schools/:id`**
  * **Description**: Update school properties. Invalidates corresponding school Redis cache.
  * **Access**: Admin only.
  * **Response**: `200 OK`

* **`DELETE /api/schools/:id`**
  * **Description**: Delete school, its standards, and all its products. Invalidates corresponding school Redis cache.
  * **Access**: Admin only.
  * **Response**: `200 OK`

---

### Product Management Endpoints (`/api/products`)

* **`GET /api/products`**
  * **Description**: High-performance filtered product catalog. Uses MongoDB `$facet` aggregation to perform paginated collection fetches and retrieve overall item count metadata in a single database round-trip.
  * **Query Params**: `school`, `standard`, `gender`, `type`, `size`, `minPrice`, `maxPrice`, `sort`, `page`, `limit`
  * **Response**: `200 OK`
    ```json
    {
      "products": [...],
      "total": 45,
      "page": 1,
      "limit": 24,
      "totalPages": 2
    }
    ```

* **`GET /api/products/best-sellers`**
  * **Description**: Aggregates items from paid orders, sorting them by total volume sold.
  * **Caching**: Local memory-cache with a 5-minute TTL.

* **`GET /api/products/batch`**
  * **Description**: Batch lookup for multiple product IDs (used for lists like "Recently Viewed").
  * **Query Params**: `ids=id1,id2,id3`

* **`GET /api/products/recommendations`**
  * **Description**: Retrieve complementary products from the same school (excluding the active product ID).

* **`GET /api/products/:slugOrId`**
  * **Description**: Retrieve detailed product information + sizes list + variant inventory stock level. Automatically matches by slug or database ObjectId.

---

### Global Search Endpoint (`/api/search`)

* **`GET /api/search`**
  * **Description**: Full-text fuzzy product search and school name match for header auto-complete suggestions.
  * **Query Params**: `q` (query string, min 2 chars), `limit` (default: 5)
  * **Implementation**: Uses `Promise.all` to query MongoDB text indices on products and regex indexes on schools concurrently. Results are cached in an in-memory database instance for 120 seconds.

---

### Shopping Cart Endpoints (`/api/carts`)

* **`GET /api/carts`**
  * **Description**: Fetch user's cart (populated with product details and variants).
  * **Access**: Protected.
  * **Response**: `200 OK`

* **`POST /api/carts`**
  * **Description**: Insert or update items in cart.
  * **Access**: Protected.
  * **Payload**: `{ "product": "ObjectId", "variant": "ObjectId", "size": "32", "quantity": 1 }`

* **`PUT /api/carts`**
  * **Description**: Update quantity of a specific item in the cart.
  * **Access**: Protected.
  * **Payload**: `{ "product": "ObjectId", "variant": "ObjectId", "quantity": 2 }`

* **`DELETE /api/carts/:itemId`**
  * **Description**: Remove an item from the cart.
  * **Access**: Protected.

---

### Checkout & Payments Pipeline (`/api/orders` & `/api/payments`)

The payment pipeline supports Cash on Delivery (COD) and Online Payments (via Razorpay). Both pathways implement database sessions to ensure inventory operations are atomic.

```
[Customer Checkout]
        |
        +---> Cash on Delivery (COD) path?
        |           |
        |           v
        |     1. Start DB Session
        |     2. Loop Items: Find variant & check stock
        |     3. Decrement SKU stock (variant.stock_qty -= qty)
        |     4. Set variant.is_available = false if stock is 0
        |     5. Apply Coupon Code & increment coupon.usedCount
        |     6. Save Order (orderStatus: 'pending', paymentStatus: 'pending')
        |     7. Create Pending Payment (method: 'COD')
        |     8. Commit DB Transaction
        |     9. Send Email Notifications (async) -> Return Order ID
        |
        +---> Online (Razorpay) path?
                    |
                    v
              1. Call `/create-razorpay-order` to register order on gateway
              2. Open Razorpay Checkouts widget on frontend client
              3. On successful payment, send signature & cart to `/verify-payment`
              4. Server verifies signature: HMAC_SHA256(order_id + "|" + payment_id, SECRET)
              5. Start DB Session
              6. Check & decrement inventory stock (same as COD steps 2-4)
              7. Save Order (orderStatus: 'processing', paymentStatus: 'paid')
              8. Create Completed Payment (method: 'UPI/Card/NetBanking', status: 'success')
              9. Commit DB Transaction
             10. Send Order Confirmation Emails -> Return Success
```

#### Order Endpoints (`/api/orders`)
* **`POST /api/orders`**: Create and commit a COD transaction.
* **`POST /api/orders/create-razorpay-order`**: Initialize payment registration with Razorpay.
* **`POST /api/orders/verify-payment`**: Verify signature, deduct stock, and save order.
* **`GET /api/orders/my-orders`**: Retrieve user orders (paginated via database cursors).
* **`GET /api/orders/my-orders/:id`**: Get details for a specific order.

#### Direct Payment Endpoints (`/api/payments`)
* **`POST /api/payments/webhook`**: Receives Razorpay webhook notifications (e.g. `payment.captured`). Captures raw request buffer to verify signature, serving as a fallback if client disconnects during payment verification.

---

### Admin Management & Analytics Endpoints

* **`GET /api/admin/analytics/dashboard/kpis`**
  * **Description**: Retrieve daily performance metrics (today's orders, today's revenue, count of variants under low stock, and new signups).
  * **Access**: Admin.

* **`GET /api/admin/analytics/analytics`**
  * **Description**: Get metrics for admin charting, including last 30d revenue history, top-selling products, and revenue per school.
  * **Access**: Admin.

* **`GET /api/admin/inventory`**
  * **Description**: Get inventory stock list. Can filter by `lowStock=true` (stock below threshold).
  * **Access**: Admin.

* **`PATCH /api/admin/inventory/:variantId`**
  * **Description**: Update stock count for a specific size.
  * **Access**: Admin.

* **`POST /api/admin/inventory/bulk-import`**
  * **Description**: Bulk stock updates via CSV file upload (`itemId`, `size`, `newStock`).
  * **Implementation**: Uses Mongoose `bulkWrite` to execute updates in a single database command.
  * **Access**: Admin.

* **`PATCH /api/admin/orders/:id/status`**
  * **Description**: Update order status (e.g., `confirmed`, `shipped`, `delivered`), append status logs to tracking history, and trigger transactional update emails.
  * **Access**: Admin.

---

## 5. Background Services & Cron Jobs

### Daily Low Stock Check
The system runs a cron job (using `node-cron`) every day at **8:00 AM** to scan variants.
* **Logic**: Queries `ProductVariant` for sizes where `stock_qty < 10`.
* **Action**: If items are found, compiles them into an HTML alert and sends it to the store manager via **Resend**.

### Graceful Server Shutdown
To prevent transaction interruptions, Node.js process signals (`SIGINT`, `SIGTERM`) are intercepted:
1. Closes the HTTP server, rejecting new requests.
2. Waits up to 10 seconds for running database queries to complete.
3. Closes MongoDB connections.
4. Exits the process.

---

## 6. Environment Variables Guide

Configure these variables in your `.env` file:

```ini
# Server Setup
PORT=5051
NODE_ENV=development # development / production

# Databases
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/arihant
REDIS_URL=redis://localhost:6379

# JWT Token Secret
ACCESS_TOKEN_SECRET=your_jwt_signing_secret_here

# Firebase Admin Credentials (SSO Verification)
# Option A: Parse service account JSON string directly
FIREBASE_SERVICE_ACCOUNT='{"type": "service_account", "project_id": "...", ...}'
# Option B: Fallback credentials
FIREBASE_PROJECT_ID=arihant-uniforms
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@arihant-uniforms.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQ...\n-----END PRIVATE KEY-----\n"

# Razorpay Gateways
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx

# Resend Mailer Credentials
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxx
OWNER_EMAIL=orders@arihantuniform.com

# Cloudinary Storage
CLOUDINARY_CLOUD_NAME=xxxxxxxx
CLOUDINARY_API_KEY=xxxxxxxxxxxxxxxx
CLOUDINARY_API_SECRET=xxxxxxxxxxxxxxxx
```
