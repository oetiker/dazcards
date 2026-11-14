import { describe, expect, it } from 'vitest';
import { buildExport, importData } from '../src/lib/exchange';
import { db, getMedia, listCards, putCard, putDeck, putGame, putMedia } from '../src/lib/db';

describe('JSON export / import', () => {
  it('round-trips decks, cards, games and media', async () => {
    const imageId = await putMedia('image', new Blob([new Uint8Array([1, 2, 3, 250])], { type: 'image/png' }));
    await putDeck({ id: 'd1', name: 'Tiere', lang: 'de-CH', createdAt: 1, coverImageId: imageId });
    await putCard({ id: 'c1', deckId: 'd1', word: 'Hund', article: 'der', plural: 'Hunde', imageId });
    await putGame({ id: 'g1', name: 'Finde', templateId: 'find-it', deckId: 'd1', options: { choices: 3, rounds: 5 }, createdAt: 1 });

    const json = JSON.stringify(await buildExport());
    const d = await db();
    for (const s of ['decks', 'cards', 'games', 'media'] as const) await d.clear(s);

    const r = await importData(json);
    expect(r).toMatchObject({ decks: 1, cards: 1, games: 1 });
    const [card] = await listCards('d1');
    expect(card).toMatchObject({ word: 'Hund', article: 'der', plural: 'Hunde' });
    const m = await getMedia(imageId);
    expect(new Uint8Array(await m!.blob.arrayBuffer())).toEqual(new Uint8Array([1, 2, 3, 250]));
  });

  it('rejects foreign files', async () => {
    await expect(importData('{"format":"other"}')).rejects.toThrow();
  });
});
