// Registry of all game templates. Add a new template by creating a Svelte
// component that accepts `TemplateProps` and registering it here.
import type { GameTemplate, OptionRange } from './types';
import type { Card } from '../types';
import Explore from './Explore.svelte';
import FindIt from './FindIt.svelte';
import Rhyme from './Rhyme.svelte';
import Memory from './Memory.svelte';
import MemorySound from './MemorySound.svelte';
import Articles from './Articles.svelte';
import Sort from './Sort.svelte';
import OddCategory from './OddCategory.svelte';
import OddRhyme from './OddRhyme.svelte';
import Syllables from './Syllables.svelte';
import FirstSound from './FirstSound.svelte';
import Plural from './Plural.svelte';
import Puzzle from './Puzzle.svelte';
import Bubbles from './Bubbles.svelte';
import RepeatAfterMe from './RepeatAfterMe.svelte';
import { oddOneOutRounds, rhymePairCount, samePairCount, sortableCategories, withImage } from '../rounds';
import { onsetKey } from '../phonology';
import { rhymeKey } from '../rhyme';
import { asset } from '../asset';

const ROUNDS: OptionRange = { label: 'Runden', min: 3, max: 20 };
const PICTURES: OptionRange = { label: 'Bilder pro Runde', min: 2, max: 6 };

const needImages = (n: number) => (cards: Card[]) =>
  withImage(cards).length >= n ? null : `Braucht mindestens ${n} Karten mit Bild.`;

export const templates: GameTemplate[] = [
  {
    id: 'explore',
    name: 'Entdecken',
    description: 'Bilder antippen und das Wort hören. Zum freien Kennenlernen neuer Wörter.',
    icon: asset('templates/explore.svg'),
    color: '#ffe082',
    defaults: { choices: 6, rounds: 1 },
    options: {},
    check: needImages(1),
    component: Explore,
  },
  {
    id: 'find-it',
    name: 'Finde es',
    description: 'Ein Wort wird gesprochen – das Kind tippt das passende Bild an.',
    icon: asset('templates/find-it.svg'),
    color: '#90caf9',
    defaults: { choices: 3, rounds: 8 },
    options: { choices: PICTURES, rounds: ROUNDS },
    check: needImages(2),
    component: FindIt,
  },
  {
    id: 'bubbles',
    name: 'Ballone',
    description: 'Ballone mit Bildern steigen auf. Ein Wort wird gesprochen – den richtigen Ballon antippen.',
    icon: asset('templates/bubbles.svg'),
    color: '#b3e5fc',
    defaults: { choices: 4, rounds: 8 },
    options: { choices: { label: 'Ballone', min: 2, max: 6 }, rounds: ROUNDS },
    check: needImages(2),
    component: Bubbles,
  },
  {
    id: 'memory',
    name: 'Memory',
    description: 'Paare finden. Jede aufgedeckte Karte sagt ihr Wort.',
    icon: asset('templates/memory.svg'),
    color: '#ffab91',
    defaults: { choices: 4, rounds: 1 },
    options: { choices: { label: 'Paare', min: 2, max: 10 } },
    check: needImages(2),
    component: Memory,
  },
  {
    id: 'memory-sound',
    name: 'Hör-Memory',
    description: 'Paare aus Bildkarte und Tonkarte finden: Die Tonkarte sagt ein Wort, die Bildkarte ist stumm.',
    icon: asset('templates/memory-sound.svg'),
    color: '#ffccbc',
    defaults: { choices: 3, rounds: 1 },
    options: { choices: { label: 'Paare', min: 2, max: 8 } },
    check: needImages(2),
    component: MemorySound,
  },
  {
    id: 'puzzle',
    name: 'Puzzle',
    description: 'Puzzleteile auf das Brett ziehen; am Schluss wird das Wort gesprochen.',
    icon: asset('templates/puzzle.svg'),
    color: '#a5d6a7',
    defaults: { choices: 4, rounds: 4 },
    options: { choices: { label: 'Teile (2, 3, 4, 6, 9)', min: 2, max: 9 }, rounds: { label: 'Bilder', min: 1, max: 10 } },
    check: needImages(1),
    component: Puzzle,
  },
  {
    id: 'repeat',
    name: 'Nachsprechen',
    description: 'Wort hören, aufs Mikrofon tippen und nachsprechen. Die App spielt die eigene Stimme vor.',
    needs: 'Mikrofon (ohne Mikrofon: reines Hörspiel)',
    icon: asset('templates/repeat.svg'),
    color: '#ef9a9a',
    defaults: { choices: 1, rounds: 6 },
    options: { rounds: ROUNDS },
    check: needImages(1),
    component: RepeatAfterMe,
  },
  {
    id: 'articles',
    name: 'Der, die, das',
    description: 'Wort mit Artikel hören und ins richtige Haus tippen: der = blau, die = rot, das = grün.',
    needs: 'Artikel',
    icon: asset('templates/articles.svg'),
    color: '#9fa8da',
    defaults: { choices: 3, rounds: 8 },
    options: { rounds: ROUNDS },
    check: (cards) =>
      withImage(cards).filter((c) => c.article).length >= 3 ? null : 'Braucht mindestens 3 Karten mit Bild und Artikel.',
    component: Articles,
  },
  {
    id: 'plural',
    name: 'Eins oder viele',
    description: '«der Hund» oder «die Hunde»? Das Kind tippt auf eins oder viele.',
    needs: 'Mehrzahl',
    icon: asset('templates/plural.svg'),
    color: '#80cbc4',
    defaults: { choices: 2, rounds: 8 },
    options: { rounds: ROUNDS },
    check: (cards) =>
      withImage(cards).some((c) => c.plural?.trim()) ? null : 'Braucht Karten mit Bild und Mehrzahl.',
    component: Plural,
  },
  {
    id: 'sort',
    name: 'Sortieren',
    description: 'Bilder in Körbe sortieren (z. B. Tiere / Körper). Jeder Korb zeigt ein Beispielbild.',
    needs: 'Kategorie',
    icon: asset('templates/sort.svg'),
    color: '#ffcc80',
    defaults: { choices: 2, rounds: 8 },
    options: { choices: { label: 'Körbe', min: 2, max: 4 }, rounds: ROUNDS },
    check: (cards) =>
      sortableCategories(cards, 3).size >= 2
        ? null
        : 'Braucht mindestens 2 Kategorien mit je 3 Karten (eine dient als Beispielbild).',
    component: Sort,
  },
  {
    id: 'odd-category',
    name: 'Was gehört nicht dazu?',
    description: 'Alle Bilder werden genannt; das Kind tippt das Bild an, das nicht zu den anderen passt.',
    needs: 'Kategorie',
    icon: asset('templates/odd-category.svg'),
    color: '#e6ee9c',
    defaults: { choices: 3, rounds: 6 },
    options: { choices: { label: 'Bilder pro Runde', min: 3, max: 5 }, rounds: ROUNDS },
    check: (cards) =>
      oddOneOutRounds(cards, (c) => c.category?.trim() || undefined, 3, 1).length
        ? null
        : 'Braucht eine Kategorie mit mindestens 2 Karten und eine weitere Karte.',
    component: OddCategory,
  },
  {
    id: 'rhyme',
    name: 'Reime',
    description: 'Ein Wort wird gesprochen – das Kind findet das Bild, das sich darauf reimt.',
    needs: 'Reim (wird sonst automatisch erraten)',
    icon: asset('templates/rhyme.svg'),
    color: '#ce93d8',
    defaults: { choices: 3, rounds: 6 },
    options: { choices: PICTURES, rounds: ROUNDS },
    check: (cards) =>
      rhymePairCount(cards) >= 2 ? null : 'Braucht mindestens ein Reimpaar (z. B. Haus – Maus).',
    component: Rhyme,
  },
  {
    id: 'odd-rhyme',
    name: 'Was reimt sich nicht?',
    description: 'Haus, Maus, Ball: alle Bilder werden genannt – das Kind tippt das an, das sich nicht reimt.',
    needs: 'Reim (wird sonst automatisch erraten)',
    icon: asset('templates/odd-rhyme.svg'),
    color: '#f48fb1',
    defaults: { choices: 3, rounds: 6 },
    options: { choices: { label: 'Bilder pro Runde', min: 3, max: 4 }, rounds: ROUNDS },
    check: (cards) =>
      rhymePairCount(cards) >= 2 && oddOneOutRounds(cards, rhymeKey, 3, 1).length
        ? null
        : 'Braucht mindestens ein Reimpaar und weitere Karten.',
    component: OddRhyme,
  },
  {
    id: 'first-sound',
    name: 'Anlaut',
    description: 'Was fängt gleich an? Zum Bild das Bild mit dem gleichen ersten Laut finden (Maus – Mund).',
    needs: 'Anlaut (wird sonst aus der Schreibweise erraten)',
    icon: asset('templates/first-sound.svg'),
    color: '#bcaaa4',
    defaults: { choices: 3, rounds: 6 },
    options: { choices: PICTURES, rounds: ROUNDS },
    check: (cards) =>
      samePairCount(cards, onsetKey) >= 2 ? null : 'Braucht mindestens zwei Karten mit gleichem Anlaut.',
    component: FirstSound,
  },
  {
    id: 'syllables',
    name: 'Silben klatschen',
    description: 'Wort hören und für jede Silbe einmal auf die Trommel tippen (Ka-tze = 2).',
    needs: 'Silben (werden sonst geschätzt)',
    icon: asset('templates/syllables.svg'),
    color: '#ffd180',
    defaults: { choices: 1, rounds: 6 },
    options: { rounds: ROUNDS },
    check: needImages(1),
    component: Syllables,
  },
];

export function getTemplate(id: string): GameTemplate | undefined {
  return templates.find((t) => t.id === id);
}
