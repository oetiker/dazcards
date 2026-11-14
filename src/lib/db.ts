// Offline storage in the webview's IndexedDB. Works the same on desktop and
// mobile Tauri targets and in a plain browser during development.
import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Card, Deck, Game, Id, Media, PlayRecord, Profile } from './types';
import { newId } from './id';

interface Schema extends DBSchema {
  decks: { key: Id; value: Deck };
  cards: { key: Id; value: Card; indexes: { byDeck: Id } };
  games: { key: Id; value: Game; indexes: { byDeck: Id } };
  profiles: { key: Id; value: Profile };
  plays: { key: Id; value: PlayRecord; indexes: { byProfile: Id } };
  media: { key: Id; value: Media };
  meta: { key: string; value: unknown };
}

let dbPromise: Promise<IDBPDatabase<Schema>> | null = null;

export function db(): Promise<IDBPDatabase<Schema>> {
  dbPromise ??= openDB<Schema>('dazcards', 1, {
    upgrade(d) {
      d.createObjectStore('decks', { keyPath: 'id' });
      d.createObjectStore('cards', { keyPath: 'id' }).createIndex('byDeck', 'deckId');
      d.createObjectStore('games', { keyPath: 'id' }).createIndex('byDeck', 'deckId');
      d.createObjectStore('profiles', { keyPath: 'id' });
      d.createObjectStore('plays', { keyPath: 'id' }).createIndex('byProfile', 'profileId');
      d.createObjectStore('media', { keyPath: 'id' });
      d.createObjectStore('meta');
    },
  });
  return dbPromise;
}

// ---------- decks ----------
export const listDecks = async () => (await db()).getAll('decks');
export const getDeck = async (id: Id) => (await db()).get('decks', id);
export const putDeck = async (d: Deck) => void (await db()).put('decks', d);

export async function deleteDeck(id: Id): Promise<void> {
  const d = await db();
  const cards = await d.getAllFromIndex('cards', 'byDeck', id);
  const games = await d.getAllFromIndex('games', 'byDeck', id);
  const deck = await d.get('decks', id);
  const tx = d.transaction(['decks', 'cards', 'games', 'media'], 'readwrite');
  for (const c of cards) {
    await tx.objectStore('cards').delete(c.id);
    if (c.imageId) await tx.objectStore('media').delete(c.imageId);
    if (c.audioId) await tx.objectStore('media').delete(c.audioId);
  }
  for (const g of games) await tx.objectStore('games').delete(g.id);
  if (deck?.coverImageId) await tx.objectStore('media').delete(deck.coverImageId);
  await tx.objectStore('decks').delete(id);
  await tx.done;
}

// ---------- cards ----------
export const listCards = async (deckId: Id) =>
  (await db()).getAllFromIndex('cards', 'byDeck', deckId);
export const putCard = async (c: Card) => void (await db()).put('cards', c);

export async function deleteCard(c: Card): Promise<void> {
  const d = await db();
  if (c.imageId) await d.delete('media', c.imageId);
  if (c.audioId) await d.delete('media', c.audioId);
  await d.delete('cards', c.id);
}

// ---------- games ----------
export const listGames = async () => (await db()).getAll('games');
export const getGame = async (id: Id) => (await db()).get('games', id);
export const putGame = async (g: Game) => void (await db()).put('games', g);
export const deleteGame = async (id: Id) => void (await db()).delete('games', id);

// ---------- profiles & progress ----------
export const listProfiles = async () => (await db()).getAll('profiles');
export const putProfile = async (p: Profile) => void (await db()).put('profiles', p);

export async function deleteProfile(id: Id): Promise<void> {
  const d = await db();
  for (const p of await d.getAllFromIndex('plays', 'byProfile', id)) await d.delete('plays', p.id);
  await d.delete('profiles', id);
}

export const listPlays = async (profileId: Id) =>
  (await db()).getAllFromIndex('plays', 'byProfile', profileId);

export async function recordPlay(profileId: Id, gameId: Id, stars: number): Promise<void> {
  await (await db()).put('plays', { id: newId(), profileId, gameId, stars, finishedAt: Date.now() });
}

// ---------- media ----------
export async function putMedia(kind: Media['kind'], blob: Blob, id: Id = newId()): Promise<Id> {
  await (await db()).put('media', { id, kind, mime: blob.type, blob });
  return id;
}
export const getMedia = async (id: Id) => (await db()).get('media', id);
export const deleteMedia = async (id: Id) => void (await db()).delete('media', id);

// ---------- meta ----------
export const getMeta = async <T>(key: string) => (await db()).get('meta', key) as Promise<T | undefined>;
export const setMeta = async (key: string, value: unknown) => void (await db()).put('meta', value, key);
