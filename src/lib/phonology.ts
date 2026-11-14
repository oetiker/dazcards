// Heuristics for German sound structure, used as editor suggestions and as
// fallbacks when adults have not filled in the optional card fields.
import type { Card } from './types';

/**
 * First sound (Anlaut) from spelling, e.g. "Schuh"/"Stein"/"Spiel" -> "sch",
 * "Vogel" -> "f", "Eis" -> "ai", "Auto" -> "au", "Apfel" -> "a".
 */
export function suggestOnset(word: string): string {
  const w = word.trim().toLowerCase().split(/\s+/)[0] ?? '';
  const rules: [RegExp, string][] = [
    [/^sch/, 'sch'],
    [/^s[pt]/, 'sch'],
    [/^pf/, 'pf'],
    [/^ch/, 'ch'],
    [/^qu/, 'k'],
    [/^ph/, 'f'],
    [/^th/, 't'],
    [/^(ei|ai)/, 'ai'],
    [/^(eu|äu)/, 'eu'],
    [/^au/, 'au'],
    [/^ie/, 'i'],
    [/^v/, 'f'],
    [/^c/, 'k'],
    [/^ä/, 'e'],
  ];
  for (const [re, sound] of rules) if (re.test(w)) return sound;
  return w.slice(0, 1);
}

export function onsetKey(card: Card): string {
  return card.onset?.trim().toLowerCase() || suggestOnset(card.word);
}

const SYLLABLE_NUCLEUS = /(aa|ah|ai|au|äu|ee|eh|ei|eu|ie|ih|oo|oh|öh|uh|üh|[aeiouäöüy])/g;

/** Rough syllable count: number of vowel groups ("Ka-tze" 2, "Ba-na-ne" 3, "Haus" 1). */
export function estimateSyllables(word: string): number {
  const w = word.trim().toLowerCase();
  return Math.max(1, w.match(SYLLABLE_NUCLEUS)?.length ?? 1);
}

export function syllableCount(card: Card): number {
  return card.syllables && card.syllables > 0 ? card.syllables : estimateSyllables(card.word);
}
