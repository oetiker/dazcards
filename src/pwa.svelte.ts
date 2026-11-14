// Service worker + storage setup for the web/PWA build. No-op inside Tauri.
//
// Updates: a new version is downloaded in the background. It is activated
// (page reload) as soon as the app is on a "safe" screen – never during a
// child's game and never while an adult is editing something.
import { isTauri } from '@tauri-apps/api/core';
import { app } from './lib/app.svelte';

export const pwa = $state({ updateReady: false, checking: false, lastCheck: '' });

let applyUpdate: ((reload?: boolean) => Promise<void>) | null = null;
let registration: ServiceWorkerRegistration | undefined;

/** Screens where a reload loses nothing. */
const SAFE = new Set(['profiles', 'home', 'admin']);

export function applyUpdateIfSafe(): void {
  if (pwa.updateReady && applyUpdate && SAFE.has(app.screen.name)) applyUpdate(true);
}

/** Ask the server for a new version (also done automatically). Returns true if one is ready. */
export async function checkForUpdate(): Promise<boolean> {
  if (!registration) return false;
  pwa.checking = true;
  try {
    await registration.update();
    // Give a found update a moment to download and install.
    for (let i = 0; i < 20 && registration.installing; i++) await new Promise((r) => setTimeout(r, 250));
  } catch {
    /* offline – fine */
  } finally {
    pwa.checking = false;
    pwa.lastCheck = new Date().toLocaleTimeString();
  }
  if (registration.waiting) pwa.updateReady = true;
  applyUpdateIfSafe();
  return pwa.updateReady;
}

export async function setupPwa(): Promise<void> {
  if (isTauri() || !('serviceWorker' in navigator)) return;
  const { registerSW } = await import('virtual:pwa-register');
  applyUpdate = registerSW({
    immediate: true,
    onNeedRefresh: () => {
      pwa.updateReady = true;
      applyUpdateIfSafe();
    },
    onRegisteredSW: (_url, r) => {
      registration = r;
      // Home-screen apps are often resumed instead of restarted: check when
      // the app comes back to the foreground, and every 30 minutes.
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') checkForUpdate();
      });
      setInterval(checkForUpdate, 30 * 60 * 1000);
    },
  });
  // Ask the browser not to evict our IndexedDB (cards, recordings, profiles).
  navigator.storage?.persist?.().catch(() => {});
}
