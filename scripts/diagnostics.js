const { Client } = require('../backend/node_modules/pg');
const fs = require('fs');
const path = require('path');
require('../backend/node_modules/dotenv').config({ path: path.join(__dirname, '../backend/.env') });

async function getClient() {
  const password = process.env.SUPABASE_DB_PASSWORD;
  if (!password) {
    throw new Error('SUPABASE_DB_PASSWORD is missing');
  }
  const projectRef = 'tbrwvufwfjhenzpqdqnb';
  const client = new Client({
    host: 'aws-0-eu-west-1.pooler.supabase.com',
    port: 6543,
    user: `postgres.${projectRef}`,
    password,
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  console.log('✅ Connected to live Supabase Postgres database (eu-west-1)!');
  return client;
}

async function runDiagnostics() {
  const client = await getClient();
  const results = {};

  try {
    // 1. Tables
    const tablesRes = await client.query(`
      SELECT table_schema, table_name, table_type 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    results.tables = tablesRes.rows;

    // 2. RLS Status
    const rlsRes = await client.query(`
      SELECT schemaname, tablename, rowsecurity AS rls_enabled 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename;
    `);
    results.rlsStatus = rlsRes.rows;

    // 3. Columns
    const colsRes = await client.query(`
      SELECT table_name, column_name, data_type, column_default, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name IN ('products', 'reviews', 'orders', 'categories', 'customers', 'feedback', 'product_images')
      ORDER BY table_name, ordinal_position;
    `);
    results.columns = colsRes.rows;

    // 4. Constraints
    const constrRes = await client.query(`
      SELECT tc.table_name, tc.constraint_name, tc.constraint_type, kcu.column_name,
             ccu.table_name AS foreign_table_name, ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
      LEFT JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
      WHERE tc.table_schema = 'public'
      ORDER BY tc.table_name, tc.constraint_name;
    `);
    results.constraints = constrRes.rows;

    // 5. Grants
    const grantsRes = await client.query(`
      SELECT table_name, grantee, privilege_type
      FROM information_schema.role_table_grants
      WHERE table_schema = 'public'
        AND grantee IN ('anon', 'authenticated', 'service_role')
      ORDER BY table_name, grantee, privilege_type;
    `);
    results.grants = grantsRes.rows;

    // 6. RLS Policies
    const polRes = await client.query(`
      SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual AS using_expr, with_check AS with_check_expr
      FROM pg_policies
      WHERE schemaname = 'public'
      ORDER BY tablename, policyname;
    `);
    results.policies = polRes.rows;

    fs.writeFileSync('diagnostics-results.json', JSON.stringify(results, null, 2), 'utf8');
    console.log('✅ Diagnostics completed and saved to diagnostics-results.json');
  } finally {
    await client.end();
  }
}

runDiagnostics().catch(err => {
  console.error('Diagnostics failed:', err);
  process.exit(1);
});
