// Heuristic German rhyme key: the part of the word from the last stressed
// vowel to the end, with long-vowel spellings normalised. Good enough as an
// editor suggestion ("Haus"/"Maus" -> "aus", "Bär"/"Meer" -> "er");
// adults can always override the stored value.
import type { Card } from './types';

const VOWEL_GROUP = /(aa|ah|ai|au|a|äu|ä|ee|eh|ei|eu|e|ie|ih|i|oo|oh|o|ö|uh|u|ü|y)/g;
const UNSTRESSED_ENDING = /[^aeiouäöüy](e|el|en|er|em|chen|lein)$/;

function normalise(s: string): string {
  return s
    .replace(/ß/g, 'ss')
    .replace(/aa|ah/g, 'a')
    .replace(/ee|eh|ä/g, 'e')
    .replace(/ie|ih/g, 'i')
    .replace(/oo|oh/g, 'o')
    .replace(/uh/g, 'u')
    .replace(/äu/g, 'eu');
}

export function suggestRhyme(word: string): string {
  const w = word.trim().toLowerCase().split(/\s+/).pop() ?? '';
  if (!w) return '';
  const groups = [...w.matchAll(VOWEL_GROUP)];
  if (groups.length === 0) return normalise(w);
  // Words like "Katze", "Nase", "Kerze": rhyme starts at the vowel before the schwa ending.
  let idx = groups.length - 1;
  if (groups.length > 1 && UNSTRESSED_ENDING.test(w)) idx = groups.length - 2;
  return normalise(w.slice(groups[idx].index));
}

export function rhymeKey(card: Card): string {
  return (card.rhyme?.trim().toLowerCase() || suggestRhyme(card.word)).replace(/^-/, '');
}

export function rhymes(a: Card, b: Card): boolean {
  return a.id !== b.id && a.word.toLowerCase() !== b.word.toLowerCase() && rhymeKey(a) === rhymeKey(b);
}
