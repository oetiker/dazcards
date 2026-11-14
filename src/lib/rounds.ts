// Pure round generation for the game templates (unit-tested).
import type { Card } from './types';
import { rhymeKey, rhymes } from './rhyme';

export interface Round {
  /** The card that is spoken / asked about. */
  prompt: Card;
  /** The card the child should tap (equals prompt for "find it"). */
  answer: Card;
  /** All tappable cards, shuffled, containing `answer`. */
  options: Card[];
}

export type Rng = () => number;

export function shuffle<T>(xs: readonly T[], rng: Rng = Math.random): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Pick prompts so each card is used before any repeats, avoiding back-to-back repeats. */
function pickPrompts(pool: Card[], rounds: number, rng: Rng): Card[] {
  const out: Card[] = [];
  while (out.length < rounds && pool.length > 0) {
    let batch = shuffle(pool, rng);
    if (out.length && batch.length > 1 && batch[0].id === out[out.length - 1].id) {
      batch = [...batch.slice(1), batch[0]];
    }
    out.push(...batch);
  }
  return out.slice(0, rounds);
}

export function findItRounds(cards: Card[], choices: number, rounds: number, rng: Rng = Math.random): Round[] {
  const usable = cards.filter((c) => c.imageId);
  const n = Math.max(2, Math.min(choices, usable.length));
  return pickPrompts(usable, rounds, rng).map((target) => {
    const others = shuffle(
      usable.filter((c) => c.id !== target.id && c.word !== target.word),
      rng,
    ).slice(0, n - 1);
    return { prompt: target, answer: target, options: shuffle([target, ...others], rng) };
  });
}

export function rhymeRounds(cards: Card[], choices: number, rounds: number, rng: Rng = Math.random): Round[] {
  const usable = cards.filter((c) => c.imageId);
  const prompts = usable.filter((c) => usable.some((o) => rhymes(c, o)));
  const n = Math.max(2, Math.min(choices, usable.length));
  return pickPrompts(prompts, rounds, rng).map((prompt) => {
    const partners = usable.filter((o) => rhymes(prompt, o));
    const answer = partners[Math.floor(rng() * partners.length)];
    const key = rhymeKey(prompt);
    const distractors = shuffle(
      usable.filter((o) => o.id !== prompt.id && rhymeKey(o) !== key),
      rng,
    ).slice(0, n - 1);
    return { prompt, answer, options: shuffle([answer, ...distractors], rng) };
  });
}

export function rhymePairCount(cards: Card[]): number {
  const usable = cards.filter((c) => c.imageId);
  return usable.filter((c) => usable.some((o) => rhymes(c, o))).length;
}
