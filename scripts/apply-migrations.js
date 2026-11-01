const { Client } = require('../backend/node_modules/pg');
const fs = require('fs');
const path = require('path');
require('../backend/node_modules/dotenv').config({ path: path.join(__dirname, '../backend/.env') });

async function applyMigrations() {
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
  console.log('⚡ Connected to Supabase PostgreSQL (eu-west-1)');

  try {
    // 1. Apply supabase-reviews-migration.sql
    const reviewsSql = fs.readFileSync(path.join(__dirname, '../supabase-reviews-migration.sql'), 'utf8');
    console.log('🚀 Applying supabase-reviews-migration.sql...');
    await client.query(reviewsSql);
    console.log('✅ supabase-reviews-migration.sql applied successfully!');

    // 2. Apply supabase-core-tables-security-migration.sql
    const coreSql = fs.readFileSync(path.join(__dirname, '../supabase-core-tables-security-migration.sql'), 'utf8');
    console.log('🚀 Applying supabase-core-tables-security-migration.sql...');
    await client.query(coreSql);
    console.log('✅ supabase-core-tables-security-migration.sql applied successfully!');

    // 3. Verify created table and updated policies
    const verifyRes = await client.query(`
      SELECT tablename, policyname, roles, cmd, qual AS using_expr, with_check AS with_check_expr
      FROM pg_policies
      WHERE schemaname = 'public'
      ORDER BY tablename, policyname;
    `);
    console.log('\n📋 Live RLS Policies after migration:');
    for (const row of verifyRes.rows) {
      console.log(` - [${row.tablename}] ${row.policyname} (${row.cmd}) -> TO ${row.roles}`);
    }

    // 4. Reload PostgREST schema cache
    await client.query("NOTIFY pgrst, 'reload schema';");
    console.log('\n⚡ PostgREST schema cache reloaded successfully!');
  } finally {
    await client.end();
  }
}

applyMigrations().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
