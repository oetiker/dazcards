// Global UI state: which screen is shown and which child is playing.
import type { Id, Profile } from './types';

export type Screen =
  | { name: 'profiles' }
  | { name: 'home' }
  | { name: 'play'; gameId: Id }
  | { name: 'admin' }
  | { name: 'deck'; deckId: Id }
  | { name: 'game-edit'; gameId?: Id }
  | { name: 'profile-edit'; profileId?: Id };

export const app = $state<{ screen: Screen; profile: Profile | null }>({
  screen: { name: 'profiles' },
  profile: null,
});

export function go(screen: Screen): void {
  app.screen = screen;
}
