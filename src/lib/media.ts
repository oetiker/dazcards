// Turns stored media blobs into object URLs, cached for the session.
import { getMedia } from './db';
import type { Id } from './types';

const cache = new Map<Id, Promise<string | undefined>>();

export function mediaUrl(id: Id | undefined): Promise<string | undefined> {
  if (!id) return Promise.resolve(undefined);
  let p = cache.get(id);
  if (!p) {
    p = getMedia(id).then((m) => (m ? URL.createObjectURL(m.blob) : undefined));
    cache.set(id, p);
  }
  return p;
}

export function forgetMedia(id: Id | undefined): void {
  if (!id) return;
  const p = cache.get(id);
  cache.delete(id);
  p?.then((u) => u && URL.revokeObjectURL(u));
}

/** Downscale photos so decks stay small and export files stay manageable. */
export async function shrinkImage(file: Blob, max = 800): Promise<Blob> {
  if (file.type === 'image/svg+xml') return file;
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  return new Promise((res, rej) =>
    canvas.toBlob((b) => (b ? res(b) : rej(new Error('encode failed'))), 'image/jpeg', 0.85),
  );
}
