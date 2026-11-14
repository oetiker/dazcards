// Bundled starter content, seeded on first launch. Images: Twemoji (CC BY 4.0),
// see ASSETS.md. No recordings are bundled; TTS is used until adults record words.
import { getMeta, putCard, putDeck, putGame, putMedia, setMeta } from './db';
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

export async function seedIfEmpty(): Promise<void> {
  if (await getMeta<boolean>('seeded')) return;
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
  const now = Date.now();
  await putGame({ id: 'starter-explore', name: 'Entdecken', templateId: 'explore', deckId: DECK_ID, options: { choices: 6, rounds: 1 }, createdAt: now });
  await putGame({ id: 'starter-find', name: 'Finde es', templateId: 'find-it', deckId: DECK_ID, options: { choices: 3, rounds: 8 }, createdAt: now + 1 });
  await putGame({ id: 'starter-rhyme', name: 'Reime', templateId: 'rhyme', deckId: DECK_ID, options: { choices: 3, rounds: 6 }, createdAt: now + 2 });
  await setMeta('seeded', true);
}
