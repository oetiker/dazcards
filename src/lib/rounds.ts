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

// ---------------------------------------------------------------------------
// Helpers shared by the newer templates
// ---------------------------------------------------------------------------

export const withImage = (cards: Card[]) => cards.filter((c) => c.imageId);

/** Public variant of the prompt picker for templates with one card per round. */
export function promptSequence(cards: Card[], rounds: number, rng: Rng = Math.random): Card[] {
  return pickPrompts(cards, rounds, rng);
}

function groupBy(cards: Card[], key: (c: Card) => string | undefined): Map<string, Card[]> {
  const m = new Map<string, Card[]>();
  for (const c of cards) {
    const k = key(c);
    if (!k) continue;
    m.set(k, [...(m.get(k) ?? []), c]);
  }
  return m;
}

// ---------- Memory ----------

export interface MemoryTile {
  key: string;
  card: Card;
  /** 'sound' tiles show a speaker and only play the word (sound memory). */
  kind: 'picture' | 'sound';
}

/**
 * Two tiles per card, shuffled. In 'sound' mode each pair is one picture tile
 * and one sound tile; otherwise two identical picture tiles.
 */
export function memoryTiles(
  cards: Card[],
  pairs: number,
  rng: Rng = Math.random,
  mode: 'pictures' | 'sound' = 'pictures',
): MemoryTile[] {
  const chosen = shuffle(withImage(cards), rng).slice(0, Math.max(2, pairs));
  return shuffle(
    chosen.flatMap((card): MemoryTile[] => [
      { key: `${card.id}-a`, card, kind: 'picture' },
      { key: `${card.id}-b`, card, kind: mode === 'sound' ? 'sound' : 'picture' },
    ]),
    rng,
  );
}

// ---------- Bins: der/die/das and categories ----------

export interface BinRound {
  card: Card;
  bin: number;
}

export const ARTICLES = ['der', 'die', 'das'] as const;

export function articleRounds(cards: Card[], rounds: number, rng: Rng = Math.random): BinRound[] {
  const usable = withImage(cards).filter((c) => c.article);
  return pickPrompts(usable, rounds, rng).map((card) => ({ card, bin: ARTICLES.indexOf(card.article!) }));
}

export interface SortSetup {
  bins: { category: string; example: Card }[];
  rounds: BinRound[];
}

/** Categories that have at least `min` cards with pictures. */
export function sortableCategories(cards: Card[], min = 3): Map<string, Card[]> {
  const groups = groupBy(withImage(cards), (c) => c.category?.trim());
  for (const [k, v] of groups) if (v.length < min) groups.delete(k);
  return groups;
}

/**
 * Pick `binCount` categories. Each bin shows one example card (not asked);
 * the other cards of those categories are sorted by the child.
 */
export function sortSetup(cards: Card[], binCount: number, rounds: number, rng: Rng = Math.random): SortSetup {
  const groups = [...sortableCategories(cards).entries()];
  const picked = shuffle(groups, rng).slice(0, Math.max(2, Math.min(binCount, groups.length)));
  const bins = picked.map(([category, cs]) => ({ category, example: shuffle(cs, rng)[0] }));
  const pool = picked.flatMap(([, cs], i) =>
    cs.filter((c) => c.id !== bins[i].example.id).map((card) => ({ card, bin: i })),
  );
  const order = pickPrompts(pool.map((p) => p.card), rounds, rng);
  return { bins, rounds: order.map((card) => pool.find((p) => p.card.id === card.id)!) };
}

// ---------- Odd one out ----------

/**
 * Rounds where all options but one share a group (rhyme or category).
 * `answer` is the odd one out; `prompt` is one card of the group.
 */
export function oddOneOutRounds(
  cards: Card[],
  groupKey: (c: Card) => string | undefined,
  choices: number,
  rounds: number,
  rng: Rng = Math.random,
): Round[] {
  const usable = withImage(cards);
  const groups = [...groupBy(usable, groupKey).values()].filter((g) => g.length >= 2);
  const out: Round[] = [];
  for (let i = 0; i < rounds && groups.length; i++) {
    const group = groups[Math.floor(rng() * groups.length)];
    const key = groupKey(group[0]);
    const outsiders = usable.filter((c) => groupKey(c) !== key);
    if (!outsiders.length) break;
    const same = shuffle(group, rng).slice(0, Math.max(2, Math.min(choices - 1, group.length)));
    const odd = outsiders[Math.floor(rng() * outsiders.length)];
    out.push({ prompt: same[0], answer: odd, options: shuffle([...same, odd], rng) });
  }
  return out;
}

// ---------- First sound ----------

export function sameGroupRounds(
  cards: Card[],
  groupKey: (c: Card) => string,
  choices: number,
  rounds: number,
  rng: Rng = Math.random,
): Round[] {
  const usable = withImage(cards);
  const partnersOf = (c: Card) =>
    usable.filter((o) => o.id !== c.id && o.word.toLowerCase() !== c.word.toLowerCase() && groupKey(o) === groupKey(c));
  const prompts = usable.filter((c) => partnersOf(c).length > 0);
  const n = Math.max(2, choices);
  return pickPrompts(prompts, rounds, rng).map((prompt) => {
    const partners = partnersOf(prompt);
    const answer = partners[Math.floor(rng() * partners.length)];
    const distractors = shuffle(
      usable.filter((o) => o.id !== prompt.id && groupKey(o) !== groupKey(prompt)),
      rng,
    ).slice(0, n - 1);
    return { prompt, answer, options: shuffle([answer, ...distractors], rng) };
  });
}

export function samePairCount(cards: Card[], groupKey: (c: Card) => string): number {
  const usable = withImage(cards);
  return usable.filter((c) => usable.some((o) => o.id !== c.id && groupKey(o) === groupKey(c))).length;
}

// ---------- One / many ----------

export interface PluralRound {
  card: Card;
  plural: boolean;
}

export function pluralRounds(cards: Card[], rounds: number, rng: Rng = Math.random): PluralRound[] {
  const usable = withImage(cards).filter((c) => c.plural?.trim());
  return pickPrompts(usable, rounds, rng).map((card) => ({ card, plural: rng() < 0.5 }));
}

// ---------- Puzzle ----------

/** Grid for a number of pieces: 2 -> 1x2, 3 -> 1x3, 4 -> 2x2, 6 -> 2x3, 9 -> 3x3. */
export function puzzleGrid(pieces: number): { rows: number; cols: number } {
  if (pieces <= 3) return { rows: 1, cols: Math.max(2, pieces) };
  if (pieces <= 4) return { rows: 2, cols: 2 };
  if (pieces <= 6) return { rows: 2, cols: 3 };
  return { rows: 3, cols: 3 };
}

// ---------- Colours and positions ----------

export interface VariantRound<V> {
  card: Card;
  answer: V;
  options: V[];
}

/** Same picture in several variants (colours, positions); one is asked for. */
export function variantRounds<V>(
  cards: Card[],
  variants: readonly V[],
  choices: number,
  rounds: number,
  rng: Rng = Math.random,
): VariantRound<V>[] {
  const n = Math.max(2, Math.min(choices, variants.length));
  return pickPrompts(cards, rounds, rng).map((card) => {
    const options = shuffle(variants, rng).slice(0, n);
    return { card, options, answer: options[Math.floor(rng() * n)] };
  });
}
