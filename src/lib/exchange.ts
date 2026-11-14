// JSON export / import. One self-contained file with media embedded as base64,
// so decks can be passed between home and school without any server.
import { isTauri } from '@tauri-apps/api/core';
import { db, getMedia, putCard, putDeck, putGame, putMedia, putProfile } from './db';
import type { Card, Deck, Game, Id, Media, PlayRecord, Profile } from './types';

export const FORMAT = 'dazcards';
export const FORMAT_VERSION = 1;

export interface ExportFile {
  format: typeof FORMAT;
  version: number;
  exportedAt: string;
  decks: Deck[];
  cards: Card[];
  games: Game[];
  profiles?: Profile[];
  plays?: PlayRecord[];
  media: Record<Id, { kind: Media['kind']; mime: string; data: string }>;
}

async function blobToBase64(b: Blob): Promise<string> {
  const bytes = new Uint8Array(await b.arrayBuffer());
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

function base64ToBlob(data: string, mime: string): Blob {
  const bin = atob(data);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

export async function buildExport(opts: { deckIds?: Id[]; includeProfiles?: boolean } = {}): Promise<ExportFile> {
  const d = await db();
  const allDecks = await d.getAll('decks');
  const decks = opts.deckIds ? allDecks.filter((x) => opts.deckIds!.includes(x.id)) : allDecks;
  const ids = new Set(decks.map((x) => x.id));
  const cards = (await d.getAll('cards')).filter((c) => ids.has(c.deckId));
  const games = (await d.getAll('games')).filter((g) => ids.has(g.deckId));

  const mediaIds = new Set<Id>();
  for (const x of decks) if (x.coverImageId) mediaIds.add(x.coverImageId);
  for (const c of cards) {
    if (c.imageId) mediaIds.add(c.imageId);
    if (c.audioId) mediaIds.add(c.audioId);
  }
  const media: ExportFile['media'] = {};
  for (const id of mediaIds) {
    const m = await getMedia(id);
    if (m) media[id] = { kind: m.kind, mime: m.mime, data: await blobToBase64(m.blob) };
  }

  const file: ExportFile = {
    format: FORMAT,
    version: FORMAT_VERSION,
    exportedAt: new Date().toISOString(),
    decks,
    cards,
    games,
    media,
  };
  if (opts.includeProfiles) {
    file.profiles = await d.getAll('profiles');
    file.plays = await d.getAll('plays');
  }
  return file;
}

export interface ImportResult {
  decks: number;
  cards: number;
  games: number;
  profiles: number;
}

/**
 * Import an export file. Items keep their ids, so re-importing an updated
 * deck replaces the older version instead of creating a duplicate.
 */
export async function importData(json: string): Promise<ImportResult> {
  const f = JSON.parse(json) as ExportFile;
  if (f.format !== FORMAT) throw new Error('Das ist keine DaZ-Cards-Datei.');
  if (f.version > FORMAT_VERSION) throw new Error('Diese Datei stammt von einer neueren App-Version.');
  for (const [id, m] of Object.entries(f.media ?? {})) await putMedia(m.kind, base64ToBlob(m.data, m.mime), id);
  for (const deck of f.decks ?? []) await putDeck(deck);
  for (const c of f.cards ?? []) await putCard(c);
  for (const g of f.games ?? []) await putGame(g);
  for (const p of f.profiles ?? []) await putProfile(p);
  if (f.plays?.length) {
    const d = await db();
    for (const p of f.plays) await d.put('plays', p);
  }
  return {
    decks: f.decks?.length ?? 0,
    cards: f.cards?.length ?? 0,
    games: f.games?.length ?? 0,
    profiles: f.profiles?.length ?? 0,
  };
}

/** Save text to a user-chosen file: native dialog in Tauri, download in a browser. */
export async function saveTextFile(name: string, text: string): Promise<boolean> {
  if (isTauri()) {
    const { save } = await import('@tauri-apps/plugin-dialog');
    const { writeTextFile } = await import('@tauri-apps/plugin-fs');
    const path = await save({ defaultPath: name, filters: [{ name: 'DaZ Cards', extensions: ['json'] }] });
    if (!path) return false;
    await writeTextFile(path, text);
    return true;
  }
  // iPhone/iPad: the share sheet lets the user "Save to Files", AirDrop or mail it.
  const file = new File([text], name, { type: 'application/json' });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] });
      return true;
    } catch (e) {
      if ((e as Error).name === 'AbortError') return false;
      // e.g. NotAllowedError when the tap "expired" during a long export: fall back to download
    }
  }
  const url = URL.createObjectURL(file);
  const a = Object.assign(document.createElement('a'), { href: url, download: name });
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
}
