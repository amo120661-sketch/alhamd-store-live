import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
for (const target of ['dist', 'server.js']) {
  fs.rmSync(path.join(rootDir, target), { recursive: true, force: true });
}
console.log('Build output cleaned.');
