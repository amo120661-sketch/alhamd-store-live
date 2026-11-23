// Applies db/schema.sql to the configured PostgreSQL/Supabase database.
// Safe to run many times — it only creates tables/columns that are missing.
import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Pool } from 'pg';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
for (const file of ['.env.local', '.env']) {
  const fullPath = path.join(rootDir, file);
  if (fs.existsSync(fullPath)) dotenv.config({ path: fullPath, override: false });
}

const {
  SUPABASE_DB_URL,
  DATABASE_URL,
  SQL_HOST,
  SQL_PORT = '5432',
  SQL_USER,
  SQL_PASSWORD,
  SQL_DB_NAME,
  SQL_SSL,
} = process.env;

const connectionString =
  SUPABASE_DB_URL ||
  DATABASE_URL ||
  (SQL_HOST && SQL_DB_NAME
    ? `postgresql://${encodeURIComponent(SQL_USER || '')}:${encodeURIComponent(
        SQL_PASSWORD || ''
      )}@${SQL_HOST}:${SQL_PORT}/${SQL_DB_NAME}`
    : null);

if (!connectionString) {
  console.error(
    'No database configured. Set SUPABASE_DB_URL (recommended) or DATABASE_URL in .env.local.'
  );
  process.exit(1);
}

const ssl =
  SUPABASE_DB_URL || DATABASE_URL
    ? { rejectUnauthorized: false }
    : SQL_SSL === 'true'
      ? { rejectUnauthorized: false }
      : false;

const pool = new Pool({ connectionString, ssl, connectionTimeoutMillis: 15000 });

try {
  const schema = fs.readFileSync(path.join(rootDir, 'db', 'schema.sql'), 'utf8');
  await pool.query(schema);
  const { rows } = await pool.query(`
    select
      (select count(*) from users)::int as users,
      (select count(*) from categories)::int as categories,
      (select count(*) from products)::int as products
  `);
  console.log('Database schema is ready and shared by the store + admin panel.');
  console.log('Current rows:', rows[0]);
} catch (error) {
  console.error('Database setup failed:', error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
