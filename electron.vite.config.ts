import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'electron-vite';
import react from '@vitejs/plugin-react';
import { viteStaticCopy } from 'vite-plugin-static-copy';

const root = __dirname;

/**
 * Every real npm dependency the main process needs at runtime is declared in
 * the ROOT package.json — that is the only one electron-builder reads when
 * deciding which node_modules to ship, so declaring them in
 * apps/main/package.json instead left the packaged app crashing with
 * "Cannot find module '@electron-toolkit/utils'". The same list feeds
 * rollupOptions.external here, so those modules are required from
 * node_modules at runtime rather than bundled — which also keeps Rollup away
 * from better-sqlite3's dynamic require() of its compiled .node binary.
 *
 * @notebook/shared is deliberately absent: it is TS-source-only workspace
 * code with no build of its own, so it must be bundled, not externalized.
 */
const runtimeDeps = Object.keys(
  (JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf-8')) as { dependencies?: Record<string, string> })
    .dependencies ?? {},
);

const mainExternal = ['electron', ...runtimeDeps];
const preloadExternal = ['electron', ...runtimeDeps];

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
