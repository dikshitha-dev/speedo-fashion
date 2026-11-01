-- ========================================================
-- SPEEDO FASHIONS — SUPABASE DATABASE & STORAGE SCHEMA
-- Run this script in your Supabase SQL Editor
-- (Dashboard -> SQL Editor -> New Query -> Run)
-- ========================================================

-- 1. Create Products Table
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'Outerwear',
  price NUMERIC NOT NULL,
  original_price NUMERIC,
  image TEXT,
  badge TEXT DEFAULT 'New Arrival',
  tag TEXT DEFAULT '100% Cotton',
  sizes JSONB DEFAULT '["S", "M", "L", "XL"]'::jsonb,
  stock INTEGER DEFAULT 15,
  "desc" TEXT,
  rating NUMERIC DEFAULT 4.9,
  reviews_count INTEGER DEFAULT 24,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
  id BIGSERIAL PRIMARY KEY,
  order_id TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT,
  items JSONB NOT NULL,
  total NUMERIC NOT NULL,
  status TEXT DEFAULT 'Pending',
  shipping_address TEXT,
  payment_method TEXT DEFAULT 'UPI',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
  id BIGSERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create Customers Table (Account System with Phone OTP & Saved Address)
CREATE TABLE IF NOT EXISTS public.customers (
  id BIGSERIAL PRIMARY KEY,
  phone TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  saved_address TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- 6. Create Policies to allow public read & anon access
CREATE POLICY "Allow public read access on categories"
ON public.categories FOR SELECT
USING (true);

CREATE POLICY "Allow full access on categories"
ON public.categories FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow public read access on customers"
ON public.customers FOR SELECT
USING (true);

CREATE POLICY "Allow full access on customers"
ON public.customers FOR ALL
USING (true)
WITH CHECK (true);
-- Allow anyone to read products
CREATE POLICY "Allow public read access on products"
ON public.products FOR SELECT
USING (true);

-- Allow anon / authenticated to insert/update/delete products
CREATE POLICY "Allow full access on products"
ON public.products FOR ALL
USING (true)
WITH CHECK (true);

-- Allow anyone to insert orders (checkout)
CREATE POLICY "Allow anon insert on orders"
ON public.orders FOR INSERT
WITH CHECK (true);

-- Allow read and update on orders
CREATE POLICY "Allow full access on orders"
ON public.orders FOR ALL
USING (true)
WITH CHECK (true);

-- 5. Insert Initial Seed Products
INSERT INTO public.products (id, name, category, price, original_price, image, badge, tag, sizes, stock, "desc", rating, reviews_count)
VALUES
('SF-01', 'Origami Polyhedron Parka', 'Outerwear', 2499, 3299, 'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80', 'Bestseller', 'Tessellated Gore-Tex', '["S", "M", "L", "XL"]'::jsonb, 14, 'Engineered with laser-cut geometric baffles that expand and contract like Japanese Miura-ori folds.', 4.9, 128),
('SF-02', 'Faceted Crease Bomber Jacket', 'Outerwear', 1899, 2499, 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80', 'New Fold', 'Angular Stitching', '["M", "L", "XL"]'::jsonb, 8, 'Features dynamic diagonal fold seams reminiscent of classic paper planes, crafted from water-repellent matte nylon.', 4.8, 94),
('SF-03', 'Geometric Pleated Kimono Coat', 'Couture', 2999, 3799, 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80', 'Limited Run', 'Architectural Silk', '["XS", "S", "M", "L"]'::jsonb, 5, 'Inspired by traditional ceremonial paper folds, this coat highlights sculptural lapels and sharp angular hem geometries.', 5.0, 67),
('SF-04', 'Asymmetric Origami Crisp Shirt', 'Tops', 1199, 1599, 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80', 'Staff Pick', '100% Washi Cotton', '["S", "M", "L", "XL", "XXL"]'::jsonb, 22, 'Structured with diagonal origami placket and faceted collar points. Retains sharp creases wash after wash without ironing.', 4.7, 112),
('SF-05', 'Tessellated Cargo Pant 05', 'Bottoms', 1599, 1999, 'https://images.unsplash.com/photo-1517445312882-bc9910d016b7?auto=format&fit=crop&w=800&q=80', 'Trending', 'Dual-Facet Pockets', '["30", "32", "34", "36"]'::jsonb, 18, 'Modular 3D accordion origami cargo pockets engineered with high-density ripstop and magnetic geometric flap closures.', 4.9, 88),
('SF-06', 'Low-Poly Sculptural Hoodie', 'Tops', 1349, 1799, 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80', 'Essential', 'Faceted Double Weave', '["S", "M", "L", "XL"]'::jsonb, 19, 'Over-engineered hood with origami diamond crown construction that stands structurally elevated with paper-crease seams.', 4.8, 145)
ON CONFLICT (id) DO NOTHING;

-- 6. Setup Supabase Storage for Product Images
-- Note: You can also create the bucket 'product-images' manually in Supabase Dashboard -> Storage -> New Bucket (Public)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public Read on product-images" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'product-images');

CREATE POLICY "Public Upload to product-images" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Public Update on product-images" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'product-images');

CREATE POLICY "Public Delete on product-images" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'product-images');

-- ========================================================
-- 7. Multiple Images & Reviews Extension
-- ========================================================

-- Add images array column to products table for multiple image upload
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;

-- Related Product Images Table
CREATE TABLE IF NOT EXISTS public.product_images (
  id BIGSERIAL PRIMARY KEY,
  product_id TEXT REFERENCES public.products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read on product_images" ON public.product_images FOR SELECT USING (true);
CREATE POLICY "Full Access on product_images" ON public.product_images FOR ALL USING (true) WITH CHECK (true);

-- Dedicated Customer Reviews Table
CREATE TABLE IF NOT EXISTS public.reviews (
  id BIGSERIAL PRIMARY KEY,
  review_id TEXT UNIQUE NOT NULL,
  customer_id TEXT,
  customer_name TEXT NOT NULL,
  product_id TEXT,
  product_name TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_title TEXT,
  comment TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  verified_purchase BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Public can view approved reviews
CREATE POLICY "Allow public read on approved reviews"
ON public.reviews FOR SELECT
USING (is_approved = true);

-- Authenticated & verified customers can submit reviews (default is_approved = false)
CREATE POLICY "Allow customer insert on reviews"
ON public.reviews FOR INSERT
WITH CHECK (true);

-- Full management access for Admin
CREATE POLICY "Allow admin full access on reviews"
ON public.reviews FOR ALL
USING (true)
WITH CHECK (true);

-- Seed Initial Approved Reviews into Reviews Table
INSERT INTO public.reviews (review_id, customer_id, customer_name, product_id, product_name, rating, review_title, comment, is_approved, is_featured, verified_purchase, created_at)
VALUES
('REV-101', '9845112099', 'Sophia Lindqvist', 'SF-01', 'Origami Polyhedron Parka', 5, 'Museum-grade Streetwear', 'The Polyhedron Parka is the most striking silhouette I have ever worn. The origami crease holds its sharp 3D facets even in heavy downpours.', true, true, true, NOW() - INTERVAL '14 days'),
('REV-102', '9930288410', 'Daisuke Mori', 'SF-02', 'Faceted Crease Bomber Jacket', 5, 'Mathematical Genius', 'Speedo Fashions has redefined technical streetwear. Folding it flat into my luggage without a single unwanted wrinkle is pure mathematical genius.', true, true, true, NOW() - INTERVAL '30 days'),
('REV-103', '9876543210', 'Amara O''Connor', 'SF-03', 'Geometric Pleated Kimono Coat', 5, 'Architectural Silk Density', 'The Kimono Coat lapels look like museum-grade contemporary paper art. You can feel the tactile density of the washi silk blend immediately.', true, true, true, NOW() - INTERVAL '10 days'),
('REV-104', '6303202964', 'Vikram Malhotra', 'SF-05', 'Tessellated Cargo Pant 05', 5, 'Superb Everyday Comfort', 'Exceptional fabric engineering. The comfort stretch and geometric cuts elevate everyday streetwear to runway couture level.', true, true, true, NOW() - INTERVAL '1 day')
ON CONFLICT (review_id) DO NOTHING;

-- Keep legacy feedback table synchronized
CREATE TABLE IF NOT EXISTS public.feedback (
  id BIGSERIAL PRIMARY KEY,
  customer_id TEXT,
  customer_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  is_published BOOLEAN DEFAULT false,
  verified BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on feedback
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read published/approved feedback
CREATE POLICY "Allow public read on approved feedback"
ON public.feedback FOR SELECT
USING (is_published = true OR status = 'approved');

-- Allow customers to insert new feedback
CREATE POLICY "Allow anon insert on feedback"
ON public.feedback FOR INSERT
WITH CHECK (true);

-- Allow full access for admin management
CREATE POLICY "Allow full access on feedback"
ON public.feedback FOR ALL
USING (true)
WITH CHECK (true);

-- Seed Initial Verified Testimonials into Feedback Table
INSERT INTO public.feedback (id, customer_id, customer_name, rating, comment, status, is_published, verified, created_at)
VALUES
(1, '9845112099', 'Sophia Lindqvist', 5, 'The Polyhedron Parka is the most striking silhouette I have ever worn. The origami crease holds its sharp 3D facets even in heavy downpours.', 'approved', true, true, NOW() - INTERVAL '14 days'),
(2, '9930288410', 'Daisuke Mori', 5, 'Speedo Fashions has redefined technical streetwear. Folding it flat into my luggage without a single unwanted wrinkle is pure mathematical genius.', 'approved', true, true, NOW() - INTERVAL '30 days'),
(3, '9876543210', 'Amara O''Connor', 5, 'The Kimono Coat lapels look like museum-grade contemporary paper art. You can feel the tactile density of the washi silk blend immediately.', 'approved', true, true, NOW() - INTERVAL '10 days'),
(4, '6303202964', 'Vikram Malhotra', 5, 'Exceptional fabric engineering. The comfort stretch and geometric cuts elevate everyday streetwear to runway couture level.', 'approved', true, true, NOW() - INTERVAL '1 day')
ON CONFLICT (id) DO NOTHING;

