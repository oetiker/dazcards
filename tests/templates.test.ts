import { describe, expect, it } from 'vitest';
import {
  articleRounds,
  memoryTiles,
  oddOneOutRounds,
  pluralRounds,
  puzzleGrid,
  sameGroupRounds,
  sortSetup,
} from '../src/lib/rounds';
import { estimateSyllables, onsetKey, suggestOnset } from '../src/lib/phonology';
import { rhymeKey } from '../src/lib/rhyme';
import type { Article, Card } from '../src/lib/types';

const c = (word: string, extra: Partial<Card> = {}): Card => ({ id: word, deckId: 'd', word, imageId: `i-${word}`, ...extra });
const animal = (w: string, a: Article) => c(w, { article: a, category: 'Tiere', plural: w + 'e' });
const body = (w: string, a: Article) => c(w, { article: a, category: 'Körper' });
const cards = [
  animal('Hund', 'der'), animal('Katze', 'die'), animal('Schwein', 'das'), animal('Maus', 'die'),
  body('Mund', 'der'), body('Nase', 'die'), body('Bein', 'das'),
  c('Haus', { article: 'das', category: 'Dinge' }),
  c('Stein'), c('Ball'), c('Baum'),
];

describe('phonology', () => {
  it.each([
    ['Schuh', 'sch'], ['Stein', 'sch'], ['Spiel', 'sch'], ['Vogel', 'f'], ['Eis', 'ai'],
    ['Auto', 'au'], ['Apfel', 'a'], ['Hund', 'h'], ['Pferd', 'pf'], ['Äpfel', 'e'],
  ])('onset of %s is %s', (w, s) => expect(suggestOnset(w)).toBe(s));

  it.each([
    ['Haus', 1], ['Katze', 2], ['Apfel', 2], ['Auto', 2], ['Banane', 3], ['Elefant', 3],
    ['Schmetterling', 3], ['Kuh', 1], ['Schuhe', 2], ['Tiere', 2], ['Schwein', 1],
  ])('%s has %i syllables', (w, n) => expect(estimateSyllables(w)).toBe(n));

  it('explicit onset wins', () => expect(onsetKey(c('Zug', { onset: 'ts' }))).toBe('ts'));
});

describe('memory', () => {
  it('creates exactly two tiles per chosen card', () => {
    const tiles = memoryTiles(cards, 4);
    expect(tiles).toHaveLength(8);
    const counts = new Map<string, number>();
    for (const t of tiles) counts.set(t.card.id, (counts.get(t.card.id) ?? 0) + 1);
    expect([...counts.values()].every((n) => n === 2)).toBe(true);
    expect(new Set(tiles.map((t) => t.key)).size).toBe(8);
  });
});

describe('sound memory', () => {
  it('pairs one picture tile with one sound tile per card', () => {
    const tiles = memoryTiles(cards, 3, Math.random, 'sound');
    expect(tiles).toHaveLength(6);
    for (const id of new Set(tiles.map((t) => t.card.id))) {
      expect(tiles.filter((t) => t.card.id === id).map((t) => t.kind).sort()).toEqual(['picture', 'sound']);
    }
  });
});

describe('der/die/das', () => {
  it('maps each card to the bin of its article', () => {
    for (const r of articleRounds(cards, 20)) expect(['der', 'die', 'das'][r.bin]).toBe(r.card.article);
  });
});

describe('sort', () => {
  it('uses existing categories and never asks the example card', () => {
    const s = sortSetup(cards, 3, 10);
    expect(s.bins.map((b) => b.category).sort()).toEqual(['Körper', 'Tiere']);
    const examples = new Set(s.bins.map((b) => b.example.id));
    for (const r of s.rounds) {
      expect(examples.has(r.card.id)).toBe(false);
      expect(r.card.category).toBe(s.bins[r.bin].category);
    }
  });
});

describe('odd one out', () => {
  it('exactly one option is outside the group', () => {
    const key = (x: Card) => x.category;
    for (const r of oddOneOutRounds(cards, key, 4, 15)) {
      expect(r.options.filter((o) => key(o) !== key(r.prompt))).toEqual([r.answer]);
      expect(r.options.length).toBeGreaterThanOrEqual(3);
    }
  });
  it('works for rhymes', () => {
    for (const r of oddOneOutRounds(cards, rhymeKey, 3, 10)) {
      expect(r.options.filter((o) => rhymeKey(o) !== rhymeKey(r.prompt))).toEqual([r.answer]);
    }
  });
});

describe('first sound', () => {
  it('offers exactly one card with the same onset', () => {
    for (const r of sameGroupRounds(cards, onsetKey, 3, 15)) {
      expect(r.options.filter((o) => onsetKey(o) === onsetKey(r.prompt))).toEqual([r.answer]);
      expect(r.options).not.toContain(r.prompt);
    }
  });
});

describe('plural and puzzle', () => {
  it('only uses cards with a plural', () => {
    for (const r of pluralRounds(cards, 10)) expect(r.card.plural).toBeTruthy();
  });
  it.each([[2, 1, 2], [3, 1, 3], [4, 2, 2], [6, 2, 3], [9, 3, 3]])('%i pieces -> %ix%i', (n, rows, cols) =>
    expect(puzzleGrid(n)).toEqual({ rows, cols }),
  );
});
