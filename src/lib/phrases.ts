// Small German phrase builders for the colour and position games.
import type { Card } from './types';

export interface Colour {
  id: string;
  /** Adjective after a definite article, nominative singular: "der rote Ball". */
  adjective: string;
  hex: string;
}

export const COLOURS: Colour[] = [
  { id: 'rot', adjective: 'rote', hex: '#e53935' },
  { id: 'blau', adjective: 'blaue', hex: '#1e88e5' },
  { id: 'gruen', adjective: 'grüne', hex: '#43a047' },
  { id: 'gelb', adjective: 'gelbe', hex: '#fdd835' },
  { id: 'orange', adjective: 'orange', hex: '#fb8c00' },
  { id: 'lila', adjective: 'lila', hex: '#8e24aa' },
];

export type Preposition = 'auf' | 'unter' | 'neben' | 'vor' | 'hinter' | 'in';

/** Where the object is, with the reference noun in the correct case (dative). */
export const PREPOSITIONS: { id: Preposition; phrase: string }[] = [
  { id: 'auf', phrase: 'auf dem Tisch' },
  { id: 'unter', phrase: 'unter dem Tisch' },
  { id: 'neben', phrase: 'neben dem Tisch' },
  { id: 'vor', phrase: 'vor dem Tisch' },
  { id: 'hinter', phrase: 'hinter dem Tisch' },
  { id: 'in', phrase: 'in der Kiste' },
];

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Parts around the noun, so a recorded noun can be inserted between TTS parts. */
export interface Phrase {
  before: string;
  after: string;
}

/** "der rote Ball" */
export function colourPhrase(card: Card, colour: Colour): Phrase {
  return { before: `${card.article ?? ''} ${colour.adjective}`.trim(), after: '' };
}

/** "Der Ball ist unter dem Tisch." (the games require an article on the card). */
export function prepositionPhrase(card: Card, prep: Preposition): Phrase {
  const where = PREPOSITIONS.find((p) => p.id === prep)!.phrase;
  return { before: card.article ? cap(card.article) : '', after: `ist ${where}.` };
}

export function phraseText(card: Card, p: Phrase): string {
  return [p.before, card.word, p.after].filter(Boolean).join(' ');
}

/**
 * Recolour a picture. Brightness is measured relative to the picture's average,
 * so its main areas get exactly the target colour; darker parts (outlines,
 * shadows) are shaded towards black and lighter parts towards white.
 * Works on RGBA pixel data in place.
 */
export function tintPixels(data: Uint8ClampedArray, hex: string): void {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const lum = (i: number) => (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255;
  let sum = 0;
  let n = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) continue;
    const l = lum(i);
    if (l > 0.95) continue; // ignore white background/highlights for the average
    sum += l;
    n++;
  }
  const mean = Math.min(0.9, Math.max(0.1, n ? sum / n : 0.5));
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) continue;
    const l = lum(i);
    let k = 1; // share of target colour
    let w = 0; // share of white
    if (l <= mean) k = Math.max(0.08, l / mean);
    else w = Math.min(1, ((l - mean) / (1 - mean)) ** 2.5);
    data[i] = r * k * (1 - w) + 255 * w;
    data[i + 1] = g * k * (1 - w) + 255 * w;
    data[i + 2] = b * k * (1 - w) + 255 * w;
  }
}
