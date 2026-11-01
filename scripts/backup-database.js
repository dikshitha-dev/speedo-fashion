const fs = require('fs');
const path = require('path');
require('../backend/node_modules/dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://tbrwvufwfjhenzpqdqnb.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function backup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(__dirname, '../backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const backupData = {
    timestamp: new Date().toISOString(),
    projectUrl: SUPABASE_URL,
    tables: {}
  };

  const headers = {
    'apikey': SERVICE_KEY,
    'Authorization': `Bearer ${SERVICE_KEY}`
  };

  const tables = ['products', 'categories', 'customers', 'orders'];
  for (const table of tables) {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*`, { headers });
      if (res.ok) {
        const rows = await res.json();
        backupData.tables[table] = rows;
        console.log(`📦 Backed up table "${table}": ${rows.length} rows`);
      } else {
        console.warn(`Could not back up "${table}": HTTP ${res.status}`);
      }
    } catch (e) {
      console.error(`Backup error for "${table}":`, e.message);
    }
  }

  const jsonFile = path.join(backupDir, `backup-${timestamp}.json`);
  fs.writeFileSync(jsonFile, JSON.stringify(backupData, null, 2), 'utf8');

  // Also generate SQL insert statements
  let sqlContent = `-- SPEEDO FASHION DATABASE BACKUP\n-- Generated: ${backupData.timestamp}\n\n`;
  for (const [table, rows] of Object.entries(backupData.tables)) {
    if (rows && rows.length > 0) {
      sqlContent += `-- Table: public.${table} (${rows.length} rows)\n`;
      for (const row of rows) {
        const cols = Object.keys(row);
        const vals = cols.map(c => {
          const val = row[c];
          if (val === null || val === undefined) return 'NULL';
          if (typeof val === 'number' || typeof val === 'boolean') return val;
          if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`;
          return `'${String(val).replace(/'/g, "''")}'`;
        });
        sqlContent += `INSERT INTO public.${table} (${cols.map(c => `"${c}"`).join(', ')}) VALUES (${vals.join(', ')}) ON CONFLICT DO NOTHING;\n`;
      }
      sqlContent += '\n';
    }
  }

  const sqlFile = path.join(backupDir, `backup-${timestamp}.sql`);
  fs.writeFileSync(sqlFile, sqlContent, 'utf8');

  console.log(`✅ Backup saved successfully:`);
  console.log(`   JSON: ${jsonFile}`);
  console.log(`   SQL:  ${sqlFile}`);
}

backup().catch(console.error);
