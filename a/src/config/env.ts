// Load local env files before any module reads process.env.
// Import this file FIRST in server-side entry points.
import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';

for (const file of ['.env.local', '.env']) {
  const fullPath = path.join(process.cwd(), file);
  if (fs.existsSync(fullPath)) {
    dotenv.config({ path: fullPath, override: false });
  }
}
