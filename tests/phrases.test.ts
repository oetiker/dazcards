import { describe, expect, it } from 'vitest';
import { COLOURS, PREPOSITIONS, colourPhrase, phraseText, prepositionPhrase, tintPixels } from '../src/lib/phrases';
import { variantRounds } from '../src/lib/rounds';
import type { Card } from '../src/lib/types';

const ball: Card = { id: 'b', deckId: 'd', word: 'Ball', article: 'der', imageId: 'i' };
const rose: Card = { id: 'r', deckId: 'd', word: 'Rose', article: 'die', imageId: 'i' };

describe('phrases', () => {
  it('builds colour phrases with the weak adjective ending', () => {
    expect(phraseText(ball, colourPhrase(ball, COLOURS[0]))).toBe('der rote Ball');
    expect(phraseText(rose, colourPhrase(rose, COLOURS[2]))).toBe('die grüne Rose');
  });
  it('builds position sentences in the dative', () => {
    expect(phraseText(ball, prepositionPhrase(ball, 'unter'))).toBe('Der Ball ist unter dem Tisch.');
    expect(phraseText(rose, prepositionPhrase(rose, 'in'))).toBe('Die Rose ist in der Kiste.');
    expect(PREPOSITIONS).toHaveLength(6);
  });
});

describe('tintPixels', () => {
  it('gives the average tone the exact target colour and keeps shading', () => {
    // black outline, two mid tones, white highlight, transparent pixel
    const px = new Uint8ClampedArray([
      0, 0, 0, 255, 100, 100, 100, 255, 140, 140, 140, 255, 255, 255, 255, 255, 50, 50, 50, 0,
    ]);
    tintPixels(px, '#fdd835');
    expect(px[0]).toBeLessThan(40); // outline stays dark
    // mid tones become clearly yellow (red and green high, blue low)
    for (const i of [4, 8]) expect(Math.min(px[i], px[i + 1]) - px[i + 2]).toBeGreaterThan(100);
    expect(px[10]).toBeGreaterThan(px[6]); // the brighter tone is lighter (more white)
    expect([px[12], px[13], px[14]]).toEqual([255, 255, 255]); // highlight stays white
    expect(px[16]).toBe(50); // transparent untouched
  });
  it('a uniformly coloured picture becomes exactly the target colour', () => {
    const px = new Uint8ClampedArray([200, 30, 30, 255, 200, 30, 30, 255]);
    tintPixels(px, '#1e88e5');
    expect([px[0], px[1], px[2]]).toEqual([0x1e, 0x88, 0xe5]);
  });
});

describe('variantRounds', () => {
  it('answer is always one of the distinct options', () => {
    for (const r of variantRounds([ball, rose], COLOURS, 3, 20)) {
      expect(r.options).toHaveLength(3);
      expect(new Set(r.options).size).toBe(3);
      expect(r.options).toContain(r.answer);
    }
  });
});
