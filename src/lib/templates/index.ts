// Registry of all game templates. Add a new template by creating a Svelte
// component that accepts `TemplateProps` and registering it here.
import type { GameTemplate } from './types';
import Explore from './Explore.svelte';
import FindIt from './FindIt.svelte';
import Rhyme from './Rhyme.svelte';
import { rhymePairCount } from '../rounds';

const withImages = (n: number) => (cards: { imageId?: string }[]) =>
  cards.filter((c) => c.imageId).length >= n ? null : `Braucht mindestens ${n} Karten mit Bild.`;

export const templates: GameTemplate[] = [
  {
    id: 'explore',
    name: 'Entdecken',
    description: 'Bilder antippen und das Wort hören. Zum freien Kennenlernen neuer Wörter.',
    icon: '/templates/explore.svg',
    color: '#ffe082',
    defaults: { choices: 6, rounds: 1 },
    uses: { choices: false, rounds: false },
    check: withImages(1),
    component: Explore,
  },
  {
    id: 'find-it',
    name: 'Finde es',
    description: 'Ein Wort wird gesprochen – das Kind tippt das passende Bild an.',
    icon: '/templates/find-it.svg',
    color: '#90caf9',
    defaults: { choices: 3, rounds: 8 },
    uses: { choices: true, rounds: true },
    check: withImages(2),
    component: FindIt,
  },
  {
    id: 'rhyme',
    name: 'Reime',
    description: 'Ein Wort wird gesprochen – das Kind findet das Bild, das sich darauf reimt.',
    icon: '/templates/rhyme.svg',
    color: '#ce93d8',
    defaults: { choices: 3, rounds: 6 },
    uses: { choices: true, rounds: true },
    check: (cards) =>
      rhymePairCount(cards) >= 2 ? null : 'Braucht mindestens ein Reimpaar (z. B. Haus – Maus).',
    component: Rhyme,
  },
];

export function getTemplate(id: string): GameTemplate | undefined {
  return templates.find((t) => t.id === id);
}
