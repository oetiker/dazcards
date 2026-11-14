import { describe, expect, it } from 'vitest';
import { findItRounds, rhymePairCount, rhymeRounds } from '../src/lib/rounds';
import { rhymes } from '../src/lib/rhyme';
import type { Card } from '../src/lib/types';

const words = ['Haus', 'Maus', 'Hund', 'Mund', 'Ball', 'Auto', 'Baum', 'Fisch'];
const cards: Card[] = words.map((w) => ({ id: w, deckId: 'd', word: w, imageId: `img-${w}` }));

describe('findItRounds', () => {
  it('creates the requested number of rounds with unique options containing the answer', () => {
    const rounds = findItRounds(cards, 3, 12);
    expect(rounds).toHaveLength(12);
    for (const r of rounds) {
      expect(r.options).toHaveLength(3);
      expect(new Set(r.options.map((o) => o.id)).size).toBe(3);
      expect(r.options).toContain(r.answer);
      expect(r.answer).toBe(r.prompt);
    }
  });

  it('uses every card before repeating and never repeats back-to-back', () => {
    const rounds = findItRounds(cards, 2, cards.length * 3);
    expect(new Set(rounds.slice(0, cards.length).map((r) => r.prompt.id)).size).toBe(cards.length);
    for (let i = 1; i < rounds.length; i++) expect(rounds[i].prompt.id).not.toBe(rounds[i - 1].prompt.id);
  });

  it('ignores cards without a picture and caps choices to the deck size', () => {
    const few = [...cards.slice(0, 2), { id: 'x', deckId: 'd', word: 'Ohne Bild' }];
    const rounds = findItRounds(few, 6, 3);
    for (const r of rounds) expect(r.options).toHaveLength(2);
  });
});

describe('rhymeRounds', () => {
  it('always offers exactly one rhyming option', () => {
    expect(rhymePairCount(cards)).toBe(4);
    for (const r of rhymeRounds(cards, 4, 20)) {
      expect(rhymes(r.prompt, r.answer)).toBe(true);
      expect(r.options).not.toContain(r.prompt);
      expect(r.options.filter((o) => rhymes(r.prompt, o))).toHaveLength(1);
      expect(r.options).toHaveLength(4);
    }
  });
});
