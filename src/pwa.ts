// Service worker + storage setup for the web/PWA build. No-op inside Tauri.
import { isTauri } from '@tauri-apps/api/core';

let applyUpdate: (() => Promise<void>) | null = null;

export async function setupPwa(): Promise<void> {
  if (isTauri() || !('serviceWorker' in navigator)) return;
  const { registerSW } = await import('virtual:pwa-register');
  const update = registerSW({
    immediate: true,
    // Don't reload in the middle of a child's game: remember the update and
    // apply it the next time the profile picker is shown.
    onNeedRefresh: () => {
      applyUpdate = () => update(true);
    },
  });
  // Ask the browser not to evict our IndexedDB (cards, recordings, profiles).
  navigator.storage?.persist?.().catch(() => {});
}

/** Called on the profile picker, a safe moment to reload into a new version. */
export function applyPendingUpdate(): void {
  applyUpdate?.();
}
