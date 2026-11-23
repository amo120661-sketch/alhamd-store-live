import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createPool } from './index.ts';

const here = path.dirname(fileURLToPath(import.meta.url));
const SCHEMA_PATH = path.resolve(here, '../../db/schema.sql');

/**
 * Applies the canonical schema (idempotent) so the storefront and the admin
 * panel always see the same tables/columns, including on an older database.
 */
export async function ensureSchema(): Promise<void> {
  const sql = fs.readFileSync(SCHEMA_PATH, 'utf8');
  const pool = createPool();
  await pool.query(sql);
}
