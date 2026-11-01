-- ====================================================================
-- SPEEDO FASHION — READ-ONLY SCHEMA & RLS DIAGNOSTICS
-- Project: https://tbrwvufwfjhenzpqdqnb.supabase.co
-- Description: Run these read-only queries in the Supabase SQL Editor
--              to inspect the exact live schema state BEFORE migrations.
-- Safety: READ-ONLY. Does NOT modify, create, or drop any data.
-- ====================================================================

-- 1. Check which tables currently exist in public schema
SELECT 
  table_schema,
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. Check Row Level Security (RLS) status on each table
SELECT 
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 3. Check existing columns, data types, and default values
SELECT 
  table_name,
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('products', 'reviews', 'orders', 'categories', 'customers', 'feedback', 'product_images')
ORDER BY table_name, ordinal_position;

-- 4. Check existing primary keys, foreign keys, and unique constraints
SELECT
  tc.table_name, 
  tc.constraint_name, 
  tc.constraint_type, 
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.constraint_column_usage ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_name;

-- 5. Check table-level grants (permissions) for anon, authenticated, and service_role
SELECT 
  table_name,
  grantee,
  privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND grantee IN ('anon', 'authenticated', 'service_role')
ORDER BY table_name, grantee, privilege_type;

-- 6. Check all currently active Row Level Security (RLS) policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual AS using_expression,
  with_check AS with_check_expression
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

