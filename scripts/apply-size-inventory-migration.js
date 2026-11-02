const { Client } = require('../backend/node_modules/pg');
const fs = require('fs');
const path = require('path');
require('../backend/node_modules/dotenv').config({ path: path.join(__dirname, '../backend/.env') });

async function runMigration() {
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

  console.log('⚡ Connecting to Supabase PostgreSQL...');
  await client.connect();
  console.log('✅ Connected successfully!');

  try {
    const sql = fs.readFileSync(path.join(__dirname, '../supabase-size-inventory-migration.sql'), 'utf8');
    console.log('🚀 Executing supabase-size-inventory-migration.sql...');
    await client.query(sql);
    console.log('✅ Migration executed successfully!');

    // Verify products table
    const prodRes = await client.query(`
      SELECT id, name, sizes, stock, size_stock 
      FROM public.products;
    `);
    console.log('\n📦 Current Products in Supabase after migration:');
    for (const p of prodRes.rows) {
      console.log(` - ID: ${p.id} | Name: "${p.name}" | Stock: ${p.stock}`);
      console.log(`   Size-Stock:`, JSON.stringify(p.size_stock));
    }

    // Verify deduct_product_size_stock function exists
    const funcRes = await client.query(`
      SELECT proname, proargnames 
      FROM pg_proc 
      WHERE proname = 'deduct_product_size_stock';
    `);
    console.log('\n🔧 Function verification:');
    for (const f of funcRes.rows) {
      console.log(` - Found procedure "${f.proname}" with arguments:`, f.proargnames);
    }
  } finally {
    await client.end();
  }
}

runMigration().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
