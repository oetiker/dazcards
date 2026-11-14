// Core data model. Every entity is plain JSON-serialisable data except media,
// which lives as Blobs in a separate store and is referenced by id.

export type Id = string;

export type Article = 'der' | 'die' | 'das';

/** A single word: a picture plus a spoken word. Grammar fields are optional. */
export interface Card {
  id: Id;
  deckId: Id;
  /** The word as written (used for TTS fallback and by adults in the editor). */
  word: string;
  imageId?: Id;
  audioId?: Id;
  // ---- optional grammar / phonology fields ----
  article?: Article;
  plural?: string;
  /** Free-form category, e.g. "Tiere", "Kleider". */
  category?: string;
  /**
   * Rhyme group key. Cards with the same key rhyme with each other,
   * e.g. "aus" for Haus/Maus. Suggested automatically, editable by adults.
   */
  rhyme?: string;
  /** Number of syllables, for clapping games. */
  syllables?: number;
}

/** A themed collection of cards in one language. */
export interface Deck {
  id: Id;
  name: string;
  /** BCP-47 language tag; one language per deck (and therefore per card). */
  lang: string;
  coverImageId?: Id;
  builtin?: boolean;
  createdAt: number;
}

/** A playable game: a template applied to a deck with options. */
export interface Game {
  id: Id;
  name: string;
  templateId: string;
  deckId: Id;
  options: GameOptions;
  createdAt: number;
}

export interface GameOptions {
  /** How many pictures are shown per round (where applicable). */
  choices: number;
  /** Number of rounds before the game ends with a celebration. */
  rounds: number;
}

export interface Profile {
  id: Id;
  name: string;
  /** File name in /avatars, e.g. "1f981.svg". */
  avatar: string;
  color: string;
  createdAt: number;
}

/** Positive-only progress: we record completed games and stars earned. */
export interface PlayRecord {
  id: Id;
  profileId: Id;
  gameId: Id;
  finishedAt: number;
  stars: number;
}

export interface Media {
  id: Id;
  kind: 'image' | 'audio';
  mime: string;
  blob: Blob;
}
