import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'electron-vite';
import react from '@vitejs/plugin-react';
import { viteStaticCopy } from 'vite-plugin-static-copy';

const root = __dirname;

/**
 * electron-vite's externalizeDepsPlugin() reads dependencies from the
 * package.json at process.cwd() — the repo root here, which lists none of
 * apps/main's actual runtime deps (they live in apps/main/package.json in
 * this monorepo layout). Without externalizing better-sqlite3, Rollup tries
 * to bundle it and chokes on its dynamic require() of the compiled .node
 * binary ("Could not dynamically require ... better_sqlite3.node"). Reading
 * each app's own package.json here and passing the result as
 * rollupOptions.external sidesteps that cwd assumption entirely.
 */
function workspaceDeps(pkgJsonPath: string, exclude: string[] = []): string[] {
  const pkg = JSON.parse(readFileSync(pkgJsonPath, 'utf-8')) as { dependencies?: Record<string, string> };
  return Object.keys(pkg.dependencies ?? {}).filter((name) => !exclude.includes(name));
}

const mainExternal = ['electron', ...workspaceDeps(resolve(root, 'apps/main/package.json'), ['@notebook/shared'])];
const preloadExternal = [
  'electron',
  ...workspaceDeps(resolve(root, 'apps/preload/package.json'), ['@notebook/shared']),
];

export default defineConfig({
  main: {
    plugins: [
      // Migration SQL files are read from disk at runtime (fs.readdirSync in
      // db.ts), not imported — Vite won't bundle them, so copy them next to
      // the compiled index.js explicitly.
      viteStaticCopy({
        targets: [
          {
            src: resolve(root, 'apps/main/src/repositories/migrations/*.sql'),
            dest: 'migrations',
          },
        ],
      }),
    ],
    build: {
      outDir: 'apps/main/dist',
      lib: { entry: resolve(root, 'apps/main/src/index.ts'), formats: ['cjs'] },
      rollupOptions: { external: mainExternal, output: { entryFileNames: '[name].js' } },
    },
  },
  preload: {
    build: {
      outDir: 'apps/preload/dist',
      lib: { entry: resolve(root, 'apps/preload/src/index.ts'), formats: ['cjs'] },
      rollupOptions: { external: preloadExternal, output: { entryFileNames: '[name].js' } },
    },
  },
  renderer: {
    root: resolve(root, 'apps/renderer'),
    plugins: [react()],
    build: {
      outDir: 'apps/renderer/dist',
      rollupOptions: {
        input: resolve(root, 'apps/renderer/index.html'),
      },
    },
  },
});
