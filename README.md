# SPEEDO FASHIONS — Men's Fashion E-Commerce & Admin CRM System

> **Brand:** Speedo Fashions  
> **Currency:** Indian Rupee (₹ INR)  
> **Database & Storage:** Supabase (PostgreSQL)  
> **Frontend:** React + Vite (Tailwind CSS)  
> **Backend:** Node.js + Express  
> **Deployment Architecture:** Vercel (Frontend) + Render (Backend) + Supabase (Database)

---

## 📁 Project Architecture

```text
speedo-fashion/
├── .gitignore                            # Comprehensive secret and dependency exclusion
├── render.yaml                           # Render Web Service blueprint
├── supabase-schema.sql                   # Supabase PostgreSQL schema, RLS & seed data
├── ROUTES.md                             # Complete map of customer & admin routes
├── backend/                              # Express REST API
│   ├── package.json
│   ├── server.js                         # API server with /health, CORS & Supabase sync
│   └── .env.example                      # Backend environment variable template
└── frontend/                             # React 18 + Vite storefront
    ├── package.json
    ├── vercel.json                       # SPA rewrite configuration for Vercel
    ├── vite.config.js
    ├── .env.example                      # Frontend environment variable template
    └── src/
        ├── components/                   # Storefront & Admin UI components
        ├── pages/                        # StorePage, RouteAdmin, AdminLoginPage
        └── services/                     # API client & Supabase connector
```

---

## ⚡ Local Development Setup

### 1. Prerequisites
- Node.js (v18+)
- npm or pnpm

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your Supabase credentials and admin password
npm start
```
The backend server runs at `http://localhost:5000` (Health check: `http://localhost:5000/health`).

### 3. Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
# Configure VITE_API_URL and VITE_SUPABASE_* credentials
npm run dev
```
The frontend application runs at `http://localhost:3000`.

---

## 🚀 Cloud Deployment Instructions

### 1. Database (Supabase)
1. In your [Supabase Dashboard](https://supabase.com), go to **SQL Editor** ➔ **New Query**.
2. Run `supabase-schema.sql` to initialize tables (`products`, `orders`, `customers`, `reviews`) and storage buckets (`product-images`).
3. Note your **Project URL**, **Anon Key**, and **Service Role Key** under `Project Settings -> API`.

### 2. Backend (Render)
1. Log into [Render](https://render.com) and click **New** ➔ **Web Service**.
2. Connect your GitHub repository `dikshitha-dev/speedo-fashion`.
3. Configure:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
4. In **Environment Variables**, add:
   - `PORT`: `10000` (or leave default)
   - `NODE_ENV`: `production`
   - `SUPABASE_URL`: Your Supabase Project URL
   - `SUPABASE_ANON_KEY`: Your Supabase Anon Key
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase Service Role Key
   - `ADMIN_USERNAME`: Your admin username
   - `ADMIN_PASSWORD`: Your secure admin password
   - `ADMIN_SESSION_SECRET`: A strong random string
   - `FRONTEND_URL`: Your Vercel frontend URL (e.g., `https://speedo-fashion.vercel.app`)
5. Deploy and note your Render service URL (e.g., `https://speedo-fashion-backend.onrender.com`).

### 3. Frontend (Vercel)
1. Log into [Vercel](https://vercel.com) and click **Add New...** ➔ **Project**.
2. Import `dikshitha-dev/speedo-fashion`.
3. Configure:
   - **Root Directory:** `frontend`
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. In **Environment Variables**, add:
   - `VITE_API_URL`: Your Render backend URL (e.g., `https://speedo-fashion-backend.onrender.com`)
   - `VITE_SUPABASE_URL`: Your Supabase Project URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase Anon Key
5. Click **Deploy**.

---

## 🔒 Security Best Practices
- `.env` files are excluded from Git via `.gitignore`.
- Admin endpoints require session authentication with PBKDF2 SHA-512 cryptographic verification.
- Production CORS is restricted to localhost and authorized Vercel domains.
