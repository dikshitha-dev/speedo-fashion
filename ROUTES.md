# Speedo Fashions - Complete Route & URL Reference Map

> **Generated on:** 2026-11-01  
> **Architecture:** Single-Page Application (SPA) with Hash & Path Fallback Routing, Supabase Database & Node.js REST Backend.

---

## 1. Customer-Facing Routes

All customer storefront routes are protected by the customer session gate (`speedo_customer`). New visitors are prompted to register or sign in via the full-screen brand gateway before accessing the store.

| Page / Section Name | Exact URL | Handling Component | Auth Required | Access Level | Description |
| :--- | :--- | :--- | :---: | :--- | :--- |
| **Customer Entry Gate** | `/` | [`AuthGatePage.jsx`](frontend/src/pages/AuthGatePage.jsx) | **No** (Public Entry) | Public Customer | Full-screen brand gate. Accepts Full Name and Mobile Number with `+91` prefix (exact 10 digits validation) to grant entry to the store. |
| **Storefront Homepage** | `/` or `/#` | [`StorePage.jsx`](frontend/src/pages/StorePage.jsx) wrapped in [`App.jsx`](frontend/src/App.jsx) | **Yes** (Customer Session) | Authenticated Customer | Main customer shopping experience. Renders Hero banner, Product Catalog, Verified Guild Testimonials, and Atelier Guarantee. |
| **Clothing Catalogue** | `/#catalog` | [`ProductCatalog.jsx`](frontend/src/components/ProductCatalog.jsx) | **Yes** (Customer Session) | Authenticated Customer | Browse clothing products, filter by category (`All`, `Outerwear`, `Couture`, `Tops`, `Bottoms`), search by name/fabric, and select sizes. |
| **Product Details Modal** | *State-driven Modal* (Click product card/image) | [`ProductModal.jsx`](frontend/src/components/ProductModal.jsx) | **Yes** (Customer Session) | Authenticated Customer | High-res image, price, original price, discount badge, size selector (`XS`, `S`, `M`, `L`, `XL`), quantity selector (`+` / `-`), and Add to Cart button. |
| **Shopping Cart Drawer** | *State-driven Drawer* (Click Cart icon in navbar) | [`CartDrawer.jsx`](frontend/src/components/CartDrawer.jsx) | **Yes** (Customer Session) | Authenticated Customer | Persistent slide-out cart. Live item count, size tag, single-step increment/decrement, subtotal calculation, and Proceed to Checkout button. |
| **Checkout & Address** | *State-driven Modal* (Click "Proceed to Checkout") | [`CheckoutModal.jsx`](frontend/src/components/CheckoutModal.jsx) | **Yes** (Customer Session) | Authenticated Customer | Place order with Cash on Delivery (COD). Auto-retrieves and pre-fills saved delivery address from Supabase; saves new addresses automatically. |
| **Customer Account Profile** | *State-driven Modal* (Click Profile/User icon in navbar) | [`CustomerModal.jsx`](frontend/src/components/CustomerModal.jsx) | **Yes** (Customer Session) | Authenticated Customer | View mobile number (+91), update saved shipping address, review order history, and Logout. |
| **Customer Reviews Section** | `/#reviews` | [`Testimonials.jsx`](frontend/src/components/Testimonials.jsx) | **Yes** (Customer Session) | Authenticated Customer | Verified customer testimonials, 5-star rating highlights, and global community feedback. |
| **Contact / Concierge** | `/#contact` | [`Footer.jsx`](frontend/src/components/Footer.jsx) (id `contact`) | **Yes** (Customer Session) | Authenticated Customer | Atelier care guide, support concierge, shipping & exchange policy, legal terms, and social links. |

---

## 2. Admin Routes (Masked & Protected)

All admin functionality is consolidated under the masked prefix **`/speedo-control`**. No subpage URLs or hash fragments are exposed in the address bar when navigating between admin sections.

| Page / Section Name | Exact URL | Handling Component | Auth Required | Access Level | Description |
| :--- | :--- | :--- | :---: | :--- | :--- |
| **Admin Login Gateway** | `/speedo-control/login` | [`AdminLoginPage.jsx`](frontend/src/pages/AdminLoginPage.jsx) | **No** (Login Gate) | Admin Login | Dedicated restricted portal with black/white/red theme. Validates credentials server-side via PBKDF2/SHA-512 hashing. |
| **Admin Portal Container** | `/speedo-control` | [`RouteAdmin.jsx`](frontend/src/pages/RouteAdmin.jsx) | **Yes** (Admin Session) | Admin Only | Protected control container. Direct access without active server session immediately redirects to `/speedo-control/login`. |
| > **Executive Dashboard** | `/speedo-control` *(Internal State: `dashboard`)* | [`RouteAdmin.jsx`](frontend/src/pages/RouteAdmin.jsx) | **Yes** (Admin Session) | Admin Only | Real-time KPI summary (Revenue, Orders, Stock, Products), Supabase connection health, and live Customer Orders Tracker. |
| > **Clothing Catalogue** | `/speedo-control` *(Internal State: `catlog`)* | [`RouteAdmin.jsx`](frontend/src/pages/RouteAdmin.jsx) | **Yes** (Admin Session) | Admin Only | Comprehensive catalogue management: search/filter inventory, edit details, adjust stock/prices, and delete items from Supabase. |
| > **Publish New Product** | `/speedo-control` *(Sub-tab: `add-product`)* | [`RouteAdmin.jsx`](frontend/src/pages/RouteAdmin.jsx) | **Yes** (Admin Session) | Admin Only | Add new product: Product Name, Category, Price, Stock Units, computer image file upload to Supabase Storage, badge, fabric, and description. |
| > **Taxonomy & Categories** | `/speedo-control` *(Sub-tab: `categories`)* | [`RouteAdmin.jsx`](frontend/src/pages/RouteAdmin.jsx) | **Yes** (Admin Session) | Admin Only | Add and manage product categories, view assigned item counts, and protect categories in use from accidental deletion. |
| > **Customer Reviews Management** | `/speedo-control` *(Internal State: `reviews`)* | [`RouteAdmin.jsx`](frontend/src/pages/RouteAdmin.jsx) | **Yes** (Admin Session) | Admin Only | Moderate customer reviews: toggle "Featured on Storefront", delete reviews, or publish verified buyer testimonials with 1-5 star ratings. |

### Admin Authentication Configuration
Admin credentials are managed strictly through server environment variables:
* **Username Variable:** `ADMIN_USERNAME` (defaults to `admin`)
* **Password Variable:** `ADMIN_PASSWORD` (configured in backend environment)
* Passwords are cryptographically verified using PBKDF2 with SHA-512 and random salt.

---

## 3. Legacy / Deprecated Route Redirections

Old routes from earlier implementations have been permanently retired and secured. They automatically redirect to the masked admin login:

| Retired URL | Action Taken | Target URL |
| :--- | :--- | :--- |
| `/routeadmin` | 302 Client-side redirect via `replaceState` | `/speedo-control/login` |
| `/routeadmin/login` | 302 Client-side redirect via `replaceState` | `/speedo-control/login` |
| `/#routeadmin` | Hash router interception | `/speedo-control/login` |
| `/#routeadmin/login` | Hash router interception | `/speedo-control/login` |
| `/#catlog` *(out-of-band)* | Normalized to `/speedo-control` or redirected | `/speedo-control/login` *(if unauthenticated)* |

---

## 4. Backend REST API Endpoints (`backend/server.js`)

All mutation and sensitive queries are guarded by the `requireAdminAuth` middleware using HTTP-only session cookies and Bearer tokens.

### Customer & Storefront Endpoints (Public)
* `GET  /api/products` — Retrieve all published garments
* `GET  /api/products/:id` — Retrieve single product details
* `GET  /api/categories` — Retrieve all active categories
* `POST /api/orders` — Submit new COD order
* `GET  /api/feedback` — Retrieve verified, approved customer feedback
* `POST /api/feedback` — Customer feedback submission (Name, Rating 1-5, Comment, Verified Customer Reference)
* `GET  /api/reviews` — Retrieve verified customer testimonials
* `POST /api/customer/send-otp` — Phone verification helper
* `POST /api/customer/verify-otp` — Customer sign-in & registration
* `GET  /api/customer/:phone` — Retrieve saved customer profile & address
* `PUT  /api/customer/:phone` — Update saved delivery address
* `GET  /api/customer/orders/:phone` — Retrieve orders placed by a specific customer

### Admin Endpoints (Protected by `requireAdminAuth`)
* `POST   /api/admin/login` — Authenticate admin credentials and generate session token
* `GET    /api/admin/me` — Verify active administrator session
* `POST   /api/admin/logout` — Invalidate server session & clear cookies
* `GET    /api/admin/stats` — Retrieve CRM analytics (Delivered Revenue, Total Orders, Delivered Orders, Pending Orders)
* `GET    /api/admin/feedback` — Retrieve all customer feedback (pending & published)
* `PUT    /api/admin/feedback/:id/publish` — Approve/publish or hide customer feedback
* `DELETE /api/admin/feedback/:id` — Delete customer feedback
* `POST   /api/products` — Create and publish new product
* `PUT    /api/products/:id` — Update existing product details, price, or stock
* `DELETE /api/products/:id` — Delete product from database
* `POST   /api/categories` — Create category
* `PUT    /api/categories/:id` — Update category name/description
* `DELETE /api/categories/:id` — Delete unused category
* `GET    /api/orders` — Retrieve all orders across all customers
* `PUT    /api/orders/:id/status` — Update order fulfillment status (`pending`, `confirmed`, `shipped`, `delivered`)
* `POST   /api/reviews` — Publish customer review
* `PUT    /api/reviews/:id` — Update review status or toggle homepage feature
* `DELETE /api/reviews/:id` — Delete customer review
