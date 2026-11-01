const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
  const password = process.env.SUPABASE_DB_PASSWORD || 'wwlGqvP326NIoW2Y';
  const projectRef = 'tbrwvufwfjhenzpqdqnb';

  // Common Supabase connection formats
  const connectionStrings = [
    `postgresql://postgres:${encodeURIComponent(password)}@db.${projectRef}.supabase.co:5432/postgres`,
    `postgresql://postgres.${projectRef}:${encodeURIComponent(password)}@aws-0-ap-south-1.pooler.supabase.com:6543/postgres`,
    `postgresql://postgres.${projectRef}:${encodeURIComponent(password)}@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`,
    `postgresql://postgres.${projectRef}:${encodeURIComponent(password)}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`,
    `postgresql://postgres.${projectRef}:${encodeURIComponent(password)}@aws-0-eu-central-1.pooler.supabase.com:6543/postgres`
  ];

  const sqlPath = path.join(__dirname, '..', 'supabase-schema.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  for (const connStr of connectionStrings) {
    console.log(`Attempting connection to ${connStr.replace(/:[^:]*@/, ':****@')}...`);
    const client = new Client({
      connectionString: connStr,
      ssl: { rejectUnauthorized: false }
    });

    try {
      await client.connect();
      console.log(' Connected to Postgres database!');
      console.log('Executing schema migration...');
      await client.query(sql);
      console.log('✅ Schema migration executed successfully! Tables and storage bucket created in Supabase.');
      await client.end();
      return true;
    } catch (err) {
      console.warn('Connection failed for this host:', err.message);
      try { await client.end(); } catch (e) {}
    }
  }

  console.log('\n Direct Postgres connection not reachable from this IP/region (expected if Supabase Direct Connection is IPv6 only or restricted).');
  console.log('Please copy supabase-schema.sql into the Supabase Web SQL Editor (Dashboard -> SQL Editor) to create the tables in 1 click!');
  return false;
}

runMigration();

