import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { VitePWA } from 'vite-plugin-pwa';

import { execSync } from 'node:child_process';

const host = process.env.TAURI_DEV_HOST;

function gitSha(): string {
  try {
    return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch {
    return 'dev';
  }
}
const stamp = new Date().toISOString().slice(0, 16).replace('T', ' ');

// https://v2.tauri.app/start/frontend/vite/
export default defineConfig({
  // "/" for Tauri and local dev; the Pages workflow sets BASE_PATH=/dazcards/
  base: process.env.BASE_PATH || '/',
  define: {
    __APP_VERSION__: JSON.stringify(`${stamp} UTC · ${gitSha()}`),
  },
  plugins: [
    svelte(),
    // Installable offline web app (used on iPhone/iPad via "Add to Home Screen").
    // The service worker is registered from main.ts, and never inside Tauri.
    VitePWA({
      registerType: 'prompt',
      injectRegister: null,
      includeAssets: ['apple-touch-icon.png', 'star.svg'],
      manifest: {
        name: 'DaZ Cards',
        short_name: 'DaZ Cards',
        description: 'Bild- und Hörspiele zum Deutschlernen für Kinder (DaZ)',
        lang: 'de',
        start_url: '.',
        scope: '.',
        display: 'standalone',
        orientation: 'any',
        background_color: '#fff8ec',
        theme_color: '#3f8efc',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Precache everything, including the bundled pictures, so the app works fully offline.
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest}'],
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host ? { protocol: 'ws', host, port: 1421 } : undefined,
    watch: { ignored: ['**/src-tauri/**'] },
  },
  envPrefix: ['VITE_', 'TAURI_ENV_*'],
  build: {
    target: process.env.TAURI_ENV_PLATFORM === 'windows' ? 'chrome105' : 'safari15',
    minify: !process.env.TAURI_ENV_DEBUG ? 'esbuild' : false,
    sourcemap: !!process.env.TAURI_ENV_DEBUG,
  },
  test: {
    environment: 'node',
    setupFiles: ['fake-indexeddb/auto'],
  },
});
