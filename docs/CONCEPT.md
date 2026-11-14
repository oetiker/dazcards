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

All templates are implemented (`src/lib/templates/`). Each one checks whether a
card set is playable and explains to adults what is missing.

| id | Name | How it plays | Uses |
|---|---|---|---|
| `explore` | Entdecken | Tap any picture to hear it; celebrate when all were heard | – |
| `find-it` | Finde es | Hear a word, tap the matching picture | – |
| `bubbles` | Ballone | Balloons with pictures float up; pop the one that was named | – |
| `memory` | Memory | Find pairs; every turned card says its word | – |
| `memory-sound` | Hör-Memory | Pairs of a silent picture card and a sound card (speaker icon) | – |
| `puzzle` | Puzzle | Drag pieces onto a board with a faint ghost picture; word at the end | – |
| `repeat` | Nachsprechen | Hear the word, record yourself, hear yourself and the model | microphone |
| `articles` | Der, die, das | Hear "der Hund", tap the blue/red/green house | article |
| `colors` | Farben | Hear "der rote Ball", tap the picture in that colour (the app recolours the picture: rot, blau, grün, gelb, orange, lila) | article |
| `prepositions` | Wo ist es? | Hear "Der Ball ist unter dem Tisch.", tap the matching scene (auf/unter/neben/vor/hinter dem Tisch, in der Kiste) | article |
| `plural` | Eins oder viele | Hear "der Hund" or "die Hunde", tap one or many | plural |
| `sort` | Sortieren | Sort pictures into baskets; each basket shows an example picture | category |
| `odd-category` | Was gehört nicht dazu? | All pictures are named; tap the one from another category | category |
| `rhyme` | Reime | See + hear a word, tap the picture that rhymes | rhyme* |
| `odd-rhyme` | Was reimt sich nicht? | "Haus, Maus, Ball": tap the one that does not rhyme | rhyme* |
| `first-sound` | Anlaut | Find the picture that starts with the same sound (Maus – Mund) | onset* |
| `syllables` | Silben klatschen | Tap the drum once per syllable; the app claps along if needed | syllables* |

\* derived from the spelling when the field is empty (`rhyme.ts`, `phonology.ts`).

Design notes per template:

- **No hidden answers on screen.** For example, the syllable game shows only
  the claps made, never empty slots that would reveal the count.
- **Wrong is never "wrong".** Sorting bins wiggle; memory cards turn back;
  puzzle pieces float back; the syllable game claps it out and lets the child
  try once more, then moves on with praise.
- **Grammar audio:** recordings contain the bare word. Games that need the
  article or plural ("der Hund", "die Hunde") speak those parts with TTS.
  Possible improvement: per-deck recordings of "der/die/das" so no TTS is needed.
- **Colours for articles** follow the common DaZ convention: der = blue,
  die = red, das = green.
- **Farben / Wo ist es?** generate their pictures: colours by recolouring the
  card picture (brightness relative to the picture's average, so the main area
  gets exactly the target colour), positions by placing the card picture in a
  fixed scene with a table and a box. All scenes have identical furniture, so
  only the position and the spoken sentence tell them apart. Adjective endings
  and dative case are built in `phrases.ts` (nominative + definite article:
  "der/die/das rote …"; "auf dem Tisch", "in der Kiste").
- **Nachsprechen** does no speech scoring; saying the word out loud and hearing
  oneself is the exercise. Without a microphone it degrades to a listening game.

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

## Neural TTS (evaluation)

`src/lib/piper.ts` runs Piper voices fully in the browser: espeak-ng phonemizer
(WASM, ~18 MB data, from `@diffusionstudio/piper-wasm`) + ONNX Runtime Web
(WASM, ~12 MB) + a Piper voice model (20–114 MB from Hugging Face, cached in
Cache Storage). The runtimes are copied from `node_modules` at build time
(`scripts/copy-tts-vendor.mjs`). Measured in headless Chromium (1 thread):
~4.5 s to load a voice, ~0.4 s to generate a 2 s sentence. The page
`tts-lab.html` compares all German voices (pre-rendered samples) and tests live
generation on the device. Candidate voices with free licences: Thorsten
(male, CC0), Kerstin (female, CC0), Thorsten emotional (CC0, 8 moods).

## Open points / next steps

- Per-deck recordings of articles ("der", "die", "das") and plural forms.

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
