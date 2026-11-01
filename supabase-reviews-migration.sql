-- ====================================================================
-- SPEEDO FASHION — SECURE LEAST-PRIVILEGE REVIEWS SCHEMA & RLS MIGRATION
-- Project: https://tbrwvufwfjhenzpqdqnb.supabase.co
-- Target Table: public.reviews
-- Description: Creates or updates the reviews table safely, ensuring
--              existing-table compatibility, missing columns,
--              foreign keys, least-privilege grants, and strict RLS.
-- Safety: Preserves existing data. Completely idempotent.
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

-- 2. Safely ensure all columns exist if table was previously created with a partial schema
DO $$
BEGIN
  ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS review_id TEXT;
  ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS customer_id TEXT;
  ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS customer_name TEXT;
  ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS product_id TEXT;
  ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS product_name TEXT;
  ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS rating INTEGER;
  ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS review_title TEXT;
  ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS comment TEXT;
  ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT false;
  ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
  ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS verified_purchase BOOLEAN DEFAULT false;
  ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
END $$;

-- 3. Safely ensure unique constraint on review_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_review_id_unique 
  ON public.reviews (review_id);

-- 4. Safely attach foreign key constraint to products(id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'reviews_product_id_fkey'
  ) THEN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'products') THEN
      ALTER TABLE public.reviews
        ADD CONSTRAINT reviews_product_id_fkey
        FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;
    END IF;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Notice: reviews_product_id_fkey could not be attached due to existing un-matched rows: %', SQLERRM;
END $$;

-- 5. Create Performance Indexes for Fast Customer & Storefront Queries
CREATE INDEX IF NOT EXISTS idx_reviews_approved_created 
  ON public.reviews (is_approved, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reviews_product_id 
  ON public.reviews (product_id, is_approved);

CREATE INDEX IF NOT EXISTS idx_reviews_customer_id 
  ON public.reviews (customer_id);

-- 6. Enable Row Level Security (RLS)
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- 7. Clean up existing / legacy policies for complete idempotency
DO $$
BEGIN
  DROP POLICY IF EXISTS "Allow public read on approved reviews" ON public.reviews;
  DROP POLICY IF EXISTS "Allow customer insert on reviews" ON public.reviews;
  DROP POLICY IF EXISTS "Allow admin full access on reviews" ON public.reviews;
  DROP POLICY IF EXISTS "Allow authenticated admin update on reviews" ON public.reviews;
  DROP POLICY IF EXISTS "Allow authenticated admin delete on reviews" ON public.reviews;
  DROP POLICY IF EXISTS "Allow service role full access on reviews" ON public.reviews;
  DROP POLICY IF EXISTS "Allow public read approved reviews" ON public.reviews;
  DROP POLICY IF EXISTS "Allow customer submit review" ON public.reviews;
END $$;

-- 8. Revoke Privileged Operations from Public / Customer Roles
REVOKE ALL ON TABLE public.reviews FROM anon, authenticated;
REVOKE UPDATE, DELETE ON TABLE public.reviews FROM anon, authenticated;

-- 9. Grant Least-Privilege Access to anon and authenticated
GRANT SELECT, INSERT ON TABLE public.reviews TO anon, authenticated;

-- Grant sequence permissions safely
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relkind = 'S' AND relname = 'reviews_id_seq') THEN
    EXECUTE 'GRANT USAGE, SELECT ON SEQUENCE public.reviews_id_seq TO anon, authenticated';
    EXECUTE 'GRANT ALL ON SEQUENCE public.reviews_id_seq TO service_role';
  END IF;
END $$;

-- Service role retains full administrative access
GRANT ALL ON TABLE public.reviews TO service_role;

-- 10. Policy: Public & Authenticated Customers can ONLY view approved reviews
CREATE POLICY "Allow public read on approved reviews"
ON public.reviews FOR SELECT
TO anon, authenticated
USING (is_approved = true);

-- 11. Policy: Customer Submission Flow (Strict Anti-Privilege-Escalation)
--     Mandates is_approved = false, is_featured = false, verified_purchase = false,
--     valid rating (1-5), and minimum text lengths
CREATE POLICY "Allow customer insert on reviews"
ON public.reviews FOR INSERT
TO anon, authenticated
WITH CHECK (
  is_approved = false
  AND is_featured = false
  AND verified_purchase = false
  AND rating >= 1 AND rating <= 5
  AND length(trim(customer_name)) >= 2
  AND length(trim(comment)) >= 8
);

-- 12. Policy: Service Role full administrative access (used exclusively by backend)
CREATE POLICY "Allow service role full access on reviews"
ON public.reviews FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 13. Refresh PostgREST Schema Cache
NOTIFY pgrst, 'reload schema';
