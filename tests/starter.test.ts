import { describe, expect, it } from 'vitest';
import { seedIfEmpty } from '../src/lib/starter';
import { db, deleteDeck, getMeta, listGames, putDeck, putGame, setMeta } from '../src/lib/db';

describe('starter migration', () => {
  it('adds the new starter games to an existing v1 install without touching existing games', async () => {
    // State of a device that ran the first version.
    await putDeck({ id: 'starter-erste-woerter', name: 'Mein Name', lang: 'de-CH', createdAt: 1 });
    await putGame({ id: 'starter-find', name: 'Umbenannt', templateId: 'find-it', deckId: 'starter-erste-woerter', options: { choices: 5, rounds: 3 }, createdAt: 1 });
    await setMeta('seeded', true);

    await seedIfEmpty();
    const games = await listGames();
    expect(games.map((g) => g.id)).toContain('starter-memory');
    expect(games.find((g) => g.id === 'starter-find')?.name).toBe('Umbenannt');
    expect(await getMeta('seedVersion')).toBe(3);
    expect(games.map((g) => g.id)).toContain('starter-memory-sound');

    // Running again changes nothing.
    const n = games.length;
    await seedIfEmpty();
    expect((await listGames()).length).toBe(n);
  });

  it('does not re-add games when adults deleted the starter deck', async () => {
    const d = await db();
    await d.clear('games');
    await deleteDeck('starter-erste-woerter');
    await setMeta('seedVersion', 1);
    await seedIfEmpty();
    expect(await listGames()).toEqual([]);
  });
});
