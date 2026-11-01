-- ====================================================================
-- SPEEDO FASHION — IDEMPOTENT CUSTOMER REVIEWS SCHEMA & RLS MIGRATION
-- Project: https://tbrwvufwfjhenzpqdqnb.supabase.co
-- Target Table: public.reviews
-- Description: Creates the reviews table, foreign keys, indexes, and
--              secure Row Level Security (RLS) policies.
-- ====================================================================

-- 1. Create Dedicated Customer Reviews Table (if not exists)
CREATE TABLE IF NOT EXISTS public.reviews (
  id BIGSERIAL PRIMARY KEY,
  review_id TEXT UNIQUE NOT NULL,
  customer_id TEXT,
  customer_name TEXT NOT NULL,
  product_id TEXT REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_title TEXT,
  comment TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  verified_purchase BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Performance Indexes for Fast Customer & Storefront Queries
CREATE INDEX IF NOT EXISTS idx_reviews_approved_created 
  ON public.reviews (is_approved, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reviews_product_id 
  ON public.reviews (product_id, is_approved);

CREATE INDEX IF NOT EXISTS idx_reviews_customer_id 
  ON public.reviews (customer_id);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- 4. Clean up existing policies if re-running
DO $$
BEGIN
  -- Drop legacy/overly permissive or mismatched policies
  DROP POLICY IF EXISTS "Allow public read on approved reviews" ON public.reviews;
  DROP POLICY IF EXISTS "Allow customer insert on reviews" ON public.reviews;
  DROP POLICY IF EXISTS "Allow admin full access on reviews" ON public.reviews;
  DROP POLICY IF EXISTS "Allow authenticated admin update on reviews" ON public.reviews;
  DROP POLICY IF EXISTS "Allow authenticated admin delete on reviews" ON public.reviews;
  DROP POLICY IF EXISTS "Allow service role full access on reviews" ON public.reviews;
END $$;

-- 5. Policy: Public Customers can ONLY view approved reviews
--    (is_approved = true strictly enforced for all public SELECT queries)
CREATE POLICY "Allow public read on approved reviews"
ON public.reviews FOR SELECT
USING (is_approved = true);

-- 6. Policy: Customer Submission Flow
--    (Anyone/anon can submit a review, but is_approved is MANDATED to be false)
CREATE POLICY "Allow customer insert on reviews"
ON public.reviews FOR INSERT
WITH CHECK (is_approved = false);

-- 7. Policy: Administrator Moderation (UPDATE & DELETE)
--    (Only authenticated roles or service_role can approve, edit, or delete reviews)
--    Anonymous users are NEVER allowed to update or delete reviews.
CREATE POLICY "Allow authenticated admin update on reviews"
ON public.reviews FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated admin delete on reviews"
ON public.reviews FOR DELETE
TO authenticated
USING (true);

-- 8. Refresh Schema Cache in PostgREST
NOTIFY pgrst, 'reload schema';
