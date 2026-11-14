import type { Component } from 'svelte';
import type { Card, Deck, Game, GameOptions } from '../types';

export interface TemplateProps {
  game: Game;
  deck: Deck;
  cards: Card[];
  /** Called once when the child has finished; stars are always > 0 (positive-only). */
  onfinish: (stars: number) => void;
}

export interface GameTemplate {
  id: string;
  /** Name shown to adults in the game editor. */
  name: string;
  description: string;
  /** Icon shown to kids (path below /public). */
  icon: string;
  /** Tile colour on the kids' home screen, so templates are recognisable without reading. */
  color: string;
  defaults: GameOptions;
  /** Which options make sense for this template (others are hidden in the editor). */
  uses: { choices: boolean; rounds: boolean };
  /** Returns null when the deck can be played, otherwise a reason for adults. */
  check(cards: Card[]): string | null;
  component: Component<TemplateProps>;
}
