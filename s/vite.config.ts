import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

function copyImages(target: string): void {
  const source = path.join(rootDir, 'src/assets/images');
  if (!fs.existsSync(source)) return;
  fs.mkdirSync(target, { recursive: true });
  // fs.cpSync crashes on some Windows setups with non-ASCII paths.
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const from = path.join(source, entry.name);
    const to = path.join(target, entry.name);
    if (entry.isDirectory()) {
      copyDir(from, to);
    } else {
      fs.copyFileSync(from, to);
    }
  }
}

function copyDir(source: string, target: string): void {
  fs.mkdirSync(target, { recursive: true });
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const from = path.join(source, entry.name);
    const to = path.join(target, entry.name);
    if (entry.isDirectory()) copyDir(from, to);
    else fs.copyFileSync(from, to);
  }
}

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        // Product/slider image URLs are stored in the DB as plain strings.
        // Copy them into the build so deployed pages (and the admin panel)
        // can display them; keep the legacy /src/assets/images path working.
        name: 'copy-store-images',
        apply: 'build',
        writeBundle(): void {
          const distDir = path.join(rootDir, 'dist');
          copyImages(path.join(distDir, 'src/assets/images'));
          copyImages(path.join(distDir, 'assets/images'));
        },
      },
    ],
    resolve: {
      alias: {
        '@': rootDir,
      },
    },
    // Storefront-only build. The admin panel lives in the separate `a` folder.
    build: {
      emptyOutDir: true,
      rollupOptions: {
        input: {
          main: path.join(rootDir, 'index.html'),
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
