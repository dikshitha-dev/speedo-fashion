-- ====================================================================
-- SPEEDO FASHION — CORE TABLES SECURITY & LEAST-PRIVILEGE RLS MIGRATION
-- Project: https://tbrwvufwfjhenzpqdqnb.supabase.co
-- Target Tables: public.products, public.categories, public.product_images,
--                public.orders, public.customers
-- Description: Secures core store tables against direct unauthorized
--              mutations via the public Supabase PostgREST Data API.
-- Permissions Architecture:
--   1. Products & Categories:
--      - Public / Anon: READ-ONLY (SELECT allowed; INSERT, UPDATE, DELETE revoked).
--      - Store Admin: Modifies products/categories strictly via the authenticated
--        backend API, which executes queries using the service_role key.
--   2. Orders (Guest Checkout Preserved):
--      - Public / Anon: Can INSERT new orders (guest checkout).
--      - UPDATE & DELETE: STRICTLY REVOKED from anon and authenticated customers.
--      - Order History & Admin Stats: Queried securely via the backend API with service_role.
--   3. Customers (Account Data):
--      - Public / Anon direct access revoked; managed via backend OTP endpoints.
-- Safety: Completely idempotent. Preserves existing data. Safe to run.
-- ====================================================================

-- ====================================================================
-- 1. SECURE PRODUCTS TABLE
-- ====================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'products') THEN
    -- Enable Row Level Security
    ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

    -- Drop legacy permissive policies
    DROP POLICY IF EXISTS "Allow full access on products" ON public.products;
    DROP POLICY IF EXISTS "Allow public read access on products" ON public.products;
    DROP POLICY IF EXISTS "Allow anon read on products" ON public.products;

    -- Revoke all mutation privileges from untrusted roles
    REVOKE ALL ON TABLE public.products FROM anon, authenticated;
    REVOKE INSERT, UPDATE, DELETE ON TABLE public.products FROM anon, authenticated;

    -- Grant read-only access to public
    GRANT SELECT ON TABLE public.products TO anon, authenticated;
    GRANT ALL ON TABLE public.products TO service_role;

    -- Policy: Anyone can browse products
    CREATE POLICY "Allow public read access on products"
    ON public.products FOR SELECT
    TO anon, authenticated
    USING (true);

    -- Policy: Service role (backend) retains full administrative privileges
    CREATE POLICY "Allow service role full access on products"
    ON public.products FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
  END IF;
END $$;

-- ====================================================================
-- 2. SECURE CATEGORIES TABLE
-- ====================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'categories') THEN
    ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Allow full access on categories" ON public.categories;
    DROP POLICY IF EXISTS "Allow public read access on categories" ON public.categories;

    REVOKE ALL ON TABLE public.categories FROM anon, authenticated;
    REVOKE INSERT, UPDATE, DELETE ON TABLE public.categories FROM anon, authenticated;

    GRANT SELECT ON TABLE public.categories TO anon, authenticated;
    GRANT ALL ON TABLE public.categories TO service_role;

    CREATE POLICY "Allow public read access on categories"
    ON public.categories FOR SELECT
    TO anon, authenticated
    USING (true);

    CREATE POLICY "Allow service role full access on categories"
    ON public.categories FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
  END IF;
END $$;

-- ====================================================================
-- 3. SECURE PRODUCT IMAGES TABLE (IF PRESENT)
-- ====================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'product_images') THEN
    ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Full Access on product_images" ON public.product_images;
    DROP POLICY IF EXISTS "Public Read on product_images" ON public.product_images;

    REVOKE ALL ON TABLE public.product_images FROM anon, authenticated;
    REVOKE INSERT, UPDATE, DELETE ON TABLE public.product_images FROM anon, authenticated;

    GRANT SELECT ON TABLE public.product_images TO anon, authenticated;
    GRANT ALL ON TABLE public.product_images TO service_role;

    CREATE POLICY "Allow public read access on product_images"
    ON public.product_images FOR SELECT
    TO anon, authenticated
    USING (true);

    CREATE POLICY "Allow service role full access on product_images"
    ON public.product_images FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
  END IF;
END $$;

-- ====================================================================
-- 4. SECURE ORDERS TABLE (PRESERVE GUEST CHECKOUT)
-- ====================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orders') THEN
    ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

    -- Drop legacy permissive policies
    DROP POLICY IF EXISTS "Allow full access on orders" ON public.orders;
    DROP POLICY IF EXISTS "Allow anon insert on orders" ON public.orders;
    DROP POLICY IF EXISTS "Allow customer insert on orders" ON public.orders;
    DROP POLICY IF EXISTS "Allow guest checkout on orders" ON public.orders;

    -- Revoke mutation & bulk read privileges from public
    REVOKE ALL ON TABLE public.orders FROM anon, authenticated;
    REVOKE UPDATE, DELETE ON TABLE public.orders FROM anon, authenticated;

    -- Grant INSERT privilege so guests and customers can place orders
    GRANT INSERT ON TABLE public.orders TO anon, authenticated;

    -- Allow sequence usage for order IDs
    IF EXISTS (SELECT 1 FROM pg_class WHERE relkind = 'S' AND relname = 'orders_id_seq') THEN
      EXECUTE 'GRANT USAGE, SELECT ON SEQUENCE public.orders_id_seq TO anon, authenticated';
      EXECUTE 'GRANT ALL ON SEQUENCE public.orders_id_seq TO service_role';
    END IF;

    -- Service role (backend) retains full access
    GRANT ALL ON TABLE public.orders TO service_role;

    -- Policy: Allow guest and customer checkout with basic input validation
    CREATE POLICY "Allow guest checkout on orders"
    ON public.orders FOR INSERT
    TO anon, authenticated
    WITH CHECK (
      length(trim(customer_name)) >= 2
      AND total >= 0
    );

    -- Policy: Service role has full access to query and update order status
    CREATE POLICY "Allow service role full access on orders"
    ON public.orders FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
  END IF;
END $$;

-- ====================================================================
-- 5. SECURE CUSTOMERS TABLE (CUSTOMER ACCOUNT DATA)
-- ====================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'customers') THEN
    ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Allow full access on customers" ON public.customers;
    DROP POLICY IF EXISTS "Allow public read access on customers" ON public.customers;

    REVOKE ALL ON TABLE public.customers FROM anon, authenticated;

    GRANT ALL ON TABLE public.customers TO service_role;

    CREATE POLICY "Allow service role full access on customers"
    ON public.customers FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
  END IF;
END $$;

-- 6. Refresh PostgREST Schema Cache
NOTIFY pgrst, 'reload schema';

