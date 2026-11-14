# DaZ Cards – Concept

Picture-and-sound language games for children aged 3–6 who are learning German
as a second language (DaZ) and **cannot read yet**. Inspired by Bitsboard:
adults create card sets; children play games built from fixed templates.

## Decisions so far

| Topic | Decision |
|---|---|
| Target group | Children 3–6 learning German (DaZ), at home and at school |
| Platforms | Tauri 2: Windows, macOS, Linux, Android, iOS |
| Frontend | Svelte 5 + TypeScript (Vite) |
| Languages | One language per card set (`de-CH` by default) |
| Profiles | Several children per device; the child picks an animal avatar |
| Content creation | Adults only (parents, teachers), on any device |
| Pictures | Bundled library (Twemoji) **or** own photos/images |
| Sound | Own recording (microphone or file); TTS fallback when missing |
| Grammar | Optional per card: article, plural, category, rhyme key, syllables |
| Games | **Templates only**: game = template + card set + options. No game scripting |
| Feedback | Positive only: no error sounds, no lost lives, no failure screen |
| Storage | Fully offline (IndexedDB in the webview) |
| Data exchange | JSON export/import with media embedded (base64) |
| Adult lock | Hold the cog for 3 seconds |
| License | GPL-3.0-or-later (code), CC BY 4.0 (Twemoji pictures) |

## Child UX principles

- **No text needed.** Everything a child touches is a picture, a colour or a
  symbol. Names on profiles are for adults.
- **Big targets**: at least ~120 px, generous spacing, no small controls in
  games except the home button.
- **Everything speaks.** Every picture says its word when tapped; the speaker
  button repeats the question at any time.
- **Positive only.** A wrong tap gently wiggles the card, *names* what was
  tapped ("der Ball") and repeats the question. This turns mistakes into input.
  A correct tap gives a star, a chime and spoken praise. Every completed game
  ends with a celebration and 3 stars.
- **Articles are spoken with the noun** ("der Hund") when the article field is
  set, because that is how DaZ learners should pick up nouns.

## Data model

See `src/lib/types.ts`.

```
Deck 1─n Card ──> Media (image, audio)
Deck 1─n Game (templateId + options)
Profile 1─n PlayRecord (gameId, stars)
```

## Game templates

Implemented:

| id | Name | How it plays | Needs |
|---|---|---|---|
| `explore` | Entdecken | Tap any picture to hear it; celebrate when all were heard | ≥1 card with image |
| `find-it` | Finde es | Hear a word, tap the matching picture (2–6 choices) | ≥2 cards with image |
| `rhyme` | Reime | See + hear a word, tap the picture that rhymes | ≥1 rhyme pair |

Planned candidates (each is one Svelte component plus a registry entry):

- **Memory** – turn over pairs (picture–picture, later picture–sound)
- **Der/Die/Das** – drag pictures into blue/red/green houses (uses `article`)
- **Sort** – drag pictures into category baskets (uses `category`)
- **Odd one out** – which one does not belong / does not rhyme
- **Clap the syllables** – tap a drum once per syllable (uses `syllables`)
- **First sound** – which pictures start with /m/? (needs an `onset` field)
- **One / many** – singular vs plural pictures (uses `plural`; needs plural images or duplication)
- **Puzzle** – assemble a picture, then hear the word
- **Bubble pop** – tap the bubble with the named picture
- **Repeat after me** – the child records themselves and hears both versions

### Adding a template

1. Create `src/lib/templates/MyGame.svelte` taking `TemplateProps`
   (`game`, `deck`, `cards`, `onfinish(stars)`).
2. Put pure logic (round generation etc.) into `src/lib/rounds.ts` or a new
   module and unit-test it in `tests/`.
3. Register it in `src/lib/templates/index.ts` with an icon, colour, defaults
   and a `check(cards)` function that explains to adults when a card set can't
   be played.

## Rhymes

`src/lib/rhyme.ts` suggests a rhyme key from the spelling (last stressed vowel
to the end, long-vowel spellings normalised: Haus/Maus → `aus`,
Bär/Meer → `er`, Katze/Tatze → `atze`). This is a heuristic. Adults can
always type an explicit key in the card editor, and the explicit key wins.

## Export format (v1)

```json
{
  "format": "dazcards",
  "version": 1,
  "exportedAt": "2026-11-14T…",
  "decks": [ … ], "cards": [ … ], "games": [ … ],
  "profiles": [ … ], "plays": [ … ],          // optional
  "media": { "<id>": { "kind": "image", "mime": "image/svg+xml", "data": "<base64>" } }
}
```

Import keeps ids, so re-importing an updated set **replaces** the old version
instead of duplicating it.

## Open points / next steps

- Real device testing on Android and iOS (microphone permission, file save
  dialog with `content://` URIs on Android, TTS voice availability).
- TTS availability: WebKitGTK (Linux) and Android WebView often have **no**
  `speechSynthesis`. Options: native TTS via a small Tauri plugin, or rely on
  recordings. The bundled starter set currently has no recordings.
- Record a set of high-quality Swiss Standard German recordings for the
  starter deck.
- Larger bundled picture library (more Twemoji / OpenMoji; ARASAAC is
  CC BY-NC-SA and would need a licence check).
- About page with licence and asset attribution.
- Optional per-card progress so games can favour words a child knows less well
  (without ever showing it to the child).
- Move media from IndexedDB to files (Tauri fs) if decks grow large.
