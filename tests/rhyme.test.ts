import { describe, expect, it } from 'vitest';
import { rhymes, suggestRhyme } from '../src/lib/rhyme';
import type { Card } from '../src/lib/types';

const card = (word: string, rhyme?: string): Card => ({ id: word, deckId: 'd', word, rhyme, imageId: 'i' });

describe('suggestRhyme', () => {
  it.each([
    ['Haus', 'Maus'],
    ['Hose', 'Rose'],
    ['Kuh', 'Schuh'],
    ['Bär', 'Meer'],
    ['Katze', 'Tatze'],
    ['Bein', 'Stein'],
    ['Stein', 'Schwein'],
    ['Hund', 'Mund'],
    ['Nase', 'Hase'],
  ])('%s rhymes with %s', (a, b) => {
    expect(suggestRhyme(a)).toBe(suggestRhyme(b));
  });

  it.each([
    ['Ball', 'all'],
    ['Apfel', 'apfel'],
    ['Nase', 'ase'],
    ['Katze', 'atze'],
    ['Bär', 'er'],
    ['Kuh', 'u'],
    ['Stein', 'ein'],
    ['Sonne', 'onne'],
  ])('%s -> %s', (word, key) => {
    expect(suggestRhyme(word)).toBe(key);
  });

  it.each([
    ['Hase', 'Rose'],
    ['Haus', 'Hund'],
    ['Nase', 'Rose'],
    ['Ball', 'Baum'],
    ['Apfel', 'Auto'],
  ])('%s does not rhyme with %s', (a, b) => {
    expect(suggestRhyme(a)).not.toBe(suggestRhyme(b));
  });
});

describe('rhymes', () => {
  it('prefers an explicit rhyme key over the heuristic', () => {
    expect(rhymes(card('Zug', 'ug'), card('Krug'))).toBe(true);
    expect(rhymes(card('Haus', 'x'), card('Maus'))).toBe(false);
  });
  it('a card never rhymes with itself', () => {
    const c = card('Haus');
    expect(rhymes(c, c)).toBe(false);
  });
});
