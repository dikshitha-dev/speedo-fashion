const fs = require('fs');
const path = require('path');
require('../backend/node_modules/dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://tbrwvufwfjhenzpqdqnb.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = process.env.SUPABASE_ANON_KEY;

async function probe() {
  console.log(`Probing Supabase Data API at ${SUPABASE_URL}...`);
  const headers = {
    'apikey': SERVICE_KEY,
    'Authorization': `Bearer ${SERVICE_KEY}`
  };

  const results = {
    url: SUPABASE_URL,
    timestamp: new Date().toISOString(),
    tables: {}
  };

  // 1. Fetch OpenAPI definition
  try {
    const openapiRes = await fetch(`${SUPABASE_URL}/rest/v1/`, { headers });
    if (openapiRes.ok) {
      const openapi = await openapiRes.json();
      results.definitions = Object.keys(openapi.definitions || {});
      results.schema = {};
      for (const [name, def] of Object.entries(openapi.definitions || {})) {
        results.schema[name] = {
          properties: def.properties,
          required: def.required
        };
      }
      console.log('✅ Fetched OpenAPI schema definitions:', results.definitions);
    } else {
      results.openapiError = `HTTP ${openapiRes.status}: ${await openapiRes.text()}`;
      console.warn('OpenAPI fetch returned:', results.openapiError);
    }
  } catch (e) {
    results.openapiError = e.message;
    console.warn('OpenAPI fetch failed:', e.message);
  }

  // 2. Query each known table
  const tables = ['products', 'reviews', 'orders', 'categories', 'customers', 'feedback', 'product_images'];
  for (const table of tables) {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*&limit=3`, { headers });
      if (res.ok) {
        const rows = await res.json();
        results.tables[table] = {
          status: 'exists',
          count: rows.length,
          sample: rows[0] || null
        };
        console.log(`✅ Table "${table}": exists (${rows.length} rows sample)`);
      } else {
        const err = await res.text();
        results.tables[table] = {
          status: 'error',
          statusCode: res.status,
          error: err
        };
        console.log(`⚠️ Table "${table}": HTTP ${res.status} - ${err}`);
      }
    } catch (e) {
      results.tables[table] = { status: 'network_error', error: e.message };
    }
  }

  fs.writeFileSync('diagnostics-results.json', JSON.stringify(results, null, 2), 'utf8');
  console.log('Saved diagnostics to diagnostics-results.json');
}

probe().catch(console.error);
