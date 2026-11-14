import type { Component } from 'svelte';
import type { Card, Deck, Game, GameOptions } from '../types';

export interface TemplateProps {
  game: Game;
  deck: Deck;
  cards: Card[];
  /** Called once when the child has finished; stars are always > 0 (positive-only). */
  onfinish: (stars: number) => void;
}

export interface OptionRange {
  /** Label in the game editor, e.g. "Bilder pro Runde" or "Paare". */
  label: string;
  min: number;
  max: number;
}

export interface GameTemplate {
  id: string;
  /** Name shown to adults in the game editor. */
  name: string;
  description: string;
  /** Which optional card fields the template relies on (shown in the editor). */
  needs?: string;
  /** Icon shown to kids (URL). */
  icon: string;
  /** Tile colour on the kids' home screen, so templates are recognisable without reading. */
  color: string;
  defaults: GameOptions;
  /** Which options the editor offers, with their ranges. Missing = not used. */
  options: { choices?: OptionRange; rounds?: OptionRange };
  /** Returns null when the deck can be played, otherwise a reason for adults. */
  check(cards: Card[]): string | null;
  component: Component<TemplateProps>;
}
