const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config();

async function runMigration() {
  const password = process.env.SUPABASE_DB_PASSWORD;
  if (!password) {
    console.error('❌ Error: SUPABASE_DB_PASSWORD environment variable is required to run migrations.');
    console.error('Please configure SUPABASE_DB_PASSWORD in your backend/.env file.');
    process.exit(1);
  }

  // Derive project reference from SUPABASE_PROJECT_ID or SUPABASE_URL
  let projectRef = process.env.SUPABASE_PROJECT_ID;
  if (!projectRef && process.env.SUPABASE_URL) {
    try {
      projectRef = new URL(process.env.SUPABASE_URL).hostname.split('.')[0];
    } catch (e) {
      // ignore
    }
  }

  if (!projectRef) {
    console.error('❌ Error: SUPABASE_PROJECT_ID or SUPABASE_URL environment variable is required.');
    process.exit(1);
  }

  // Common Supabase connection formats (passwords are never logged)
  const connectionStrings = [
    `postgresql://postgres:${encodeURIComponent(password)}@db.${projectRef}.supabase.co:5432/postgres`,
    `postgresql://postgres.${projectRef}:${encodeURIComponent(password)}@aws-0-ap-south-1.pooler.supabase.com:6543/postgres`,
    `postgresql://postgres.${projectRef}:${encodeURIComponent(password)}@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`,
    `postgresql://postgres.${projectRef}:${encodeURIComponent(password)}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`,
    `postgresql://postgres.${projectRef}:${encodeURIComponent(password)}@aws-0-eu-central-1.pooler.supabase.com:6543/postgres`
  ];

  const sqlPath = path.join(__dirname, '..', 'supabase-schema.sql');
  if (!fs.existsSync(sqlPath)) {
    console.error('❌ Error: supabase-schema.sql file not found at project root.');
    process.exit(1);
  }
  const sql = fs.readFileSync(sqlPath, 'utf8');

  for (const connStr of connectionStrings) {
    const maskedHost = connStr.replace(/:[^:]*@/, ':****@');
    console.log(`Attempting connection to ${maskedHost}...`);
    const client = new Client({
      connectionString: connStr,
      ssl: { rejectUnauthorized: false }
    });

    try {
      await client.connect();
      console.log('⚡ Connected to Postgres database!');
      console.log('Executing schema migration...');
      await client.query(sql);
      console.log('✅ Schema migration executed successfully! Tables and storage bucket created in Supabase.');
      await client.end();
      return true;
    } catch (err) {
      console.warn('Connection failed for this host endpoint:', err.message);
      try { await client.end(); } catch (e) {}
    }
  }

  console.log('\nDirect Postgres connection not reachable from this IP/network.');
  console.log('Recommended: Copy supabase-schema.sql into the Supabase Web SQL Editor (Dashboard -> SQL Editor) to execute directly in 1 click.');
  return false;
}

runMigration();
