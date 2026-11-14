// Bundled starter content, seeded on first launch. Images: Twemoji (CC BY 4.0),
// see ASSETS.md. No recordings are bundled; TTS is used until adults record words.
import { getDeck, getMeta, putCard, putDeck, putGame, putMedia, setMeta } from './db';
import type { Article, Card } from './types';
import { libraryBlob } from './library';

type Entry = [file: string, word: string, article: Article, plural: string, category: string];

const STARTER: Entry[] = [
  ['haus', 'Haus', 'das', 'Häuser', 'Dinge'],
  ['maus', 'Maus', 'die', 'Mäuse', 'Tiere'],
  ['hose', 'Hose', 'die', 'Hosen', 'Kleider'],
  ['rose', 'Rose', 'die', 'Rosen', 'Natur'],
  ['kuh', 'Kuh', 'die', 'Kühe', 'Tiere'],
  ['schuh', 'Schuh', 'der', 'Schuhe', 'Kleider'],
  ['baer', 'Bär', 'der', 'Bären', 'Tiere'],
  ['meer', 'Meer', 'das', 'Meere', 'Natur'],
  ['katze', 'Katze', 'die', 'Katzen', 'Tiere'],
  ['tatze', 'Tatze', 'die', 'Tatzen', 'Körper'],
  ['bein', 'Bein', 'das', 'Beine', 'Körper'],
  ['stein', 'Stein', 'der', 'Steine', 'Natur'],
  ['schwein', 'Schwein', 'das', 'Schweine', 'Tiere'],
  ['hund', 'Hund', 'der', 'Hunde', 'Tiere'],
  ['mund', 'Mund', 'der', 'Münder', 'Körper'],
  ['nase', 'Nase', 'die', 'Nasen', 'Körper'],
  ['hase', 'Hase', 'der', 'Hasen', 'Tiere'],
  ['apfel', 'Apfel', 'der', 'Äpfel', 'Essen'],
  ['auto', 'Auto', 'das', 'Autos', 'Dinge'],
  ['baum', 'Baum', 'der', 'Bäume', 'Natur'],
  ['fisch', 'Fisch', 'der', 'Fische', 'Tiere'],
  ['sonne', 'Sonne', 'die', 'Sonnen', 'Natur'],
  ['ball', 'Ball', 'der', 'Bälle', 'Dinge'],
];

const DECK_ID = 'starter-erste-woerter';

type StarterGame = [id: string, name: string, templateId: string, choices: number, rounds: number];

/** Starter games. Each seed version lists the games it introduced. */
const STARTER_GAMES: StarterGame[][] = [
  // v1
  [
    ['starter-explore', 'Entdecken', 'explore', 6, 1],
    ['starter-find', 'Finde es', 'find-it', 3, 8],
    ['starter-rhyme', 'Reime', 'rhyme', 3, 6],
  ],
  // v2
  [
    ['starter-bubbles', 'Ballone', 'bubbles', 4, 8],
    ['starter-memory', 'Memory', 'memory', 4, 1],
    ['starter-puzzle', 'Puzzle', 'puzzle', 4, 4],
    ['starter-repeat', 'Nachsprechen', 'repeat', 1, 6],
    ['starter-articles', 'Der, die, das', 'articles', 3, 8],
    ['starter-plural', 'Eins oder viele', 'plural', 2, 8],
    ['starter-sort', 'Sortieren', 'sort', 2, 8],
    ['starter-odd-category', 'Was gehört nicht dazu?', 'odd-category', 4, 6],
    ['starter-odd-rhyme', 'Was reimt sich nicht?', 'odd-rhyme', 3, 6],
    ['starter-first-sound', 'Anlaut', 'first-sound', 3, 6],
    ['starter-syllables', 'Silben klatschen', 'syllables', 1, 6],
  ],
  // v3
  [['starter-memory-sound', 'Hör-Memory', 'memory-sound', 3, 1]],
  // v4
  [
    ['starter-colors', 'Farben', 'colors', 3, 8],
    ['starter-prepositions', 'Wo ist es?', 'prepositions', 3, 8],
  ],
];
const SEED_VERSION = STARTER_GAMES.length;

async function addStarterGames(fromVersion: number): Promise<void> {
  let t = Date.now();
  for (const games of STARTER_GAMES.slice(fromVersion)) {
    for (const [id, name, templateId, choices, rounds] of games) {
      await putGame({ id, name, templateId, deckId: DECK_ID, options: { choices, rounds }, createdAt: t++ });
    }
  }
}

export async function seedIfEmpty(): Promise<void> {
  const version = (await getMeta<number>('seedVersion')) ?? ((await getMeta<boolean>('seeded')) ? 1 : 0);
  if (version >= SEED_VERSION) return;
  if (version === 0) {
    await putDeck({
      id: DECK_ID,
      name: 'Erste Wörter',
      lang: 'de-CH',
      builtin: true,
      createdAt: Date.now(),
      coverImageId: 'starter-img-haus',
    });
    for (const [file, word, article, plural, category] of STARTER) {
      const imageId = await putMedia('image', await libraryBlob(file), `starter-img-${file}`);
      const card: Card = { id: `starter-${file}`, deckId: DECK_ID, word, article, plural, category, imageId };
      await putCard(card);
    }
  }
  // Existing installs get the games added by newer versions – but only if the
  // starter deck still exists (adults may have deleted it on purpose).
  if (version === 0 || (await getDeck(DECK_ID))) await addStarterGames(version);
  await setMeta('seeded', true);
  await setMeta('seedVersion', SEED_VERSION);
}
