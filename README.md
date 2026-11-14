# DaZ Cards

Picture and sound language games for children (3–6) who are learning German
as a second language (**DaZ – Deutsch als Zweitsprache**) and can't read yet.
Parents and teachers create card sets from pictures and spoken words, then
turn them into games using ready-made game templates.

Built with [Tauri 2](https://v2.tauri.app/) + Svelte 5 + TypeScript, for
desktop (Windows, macOS, Linux) and mobile (Android, iOS). Fully offline.

See [docs/CONCEPT.md](docs/CONCEPT.md) for the design decisions and roadmap.

## Try it on iPhone / iPad (web app)

The same app is published as an offline-capable web app (PWA):
**https://oetiker.github.io/dazcards/**

1. Open the link in **Safari**.
2. Tap *Share* → **Add to Home Screen**.
3. Start it from the home-screen icon. After the first start it works without internet.

Notes for iOS:
- Data (cards, recordings, profiles) is stored **on the device, per app**. The
  home-screen app and the Safari tab have separate storage, so always use the icon.
  Use *Daten → Export* regularly as a backup; deleting the icon deletes the data.
- Sound starts after the first tap (iOS rule). If there is no sound, check the
  silent switch, and that a German voice is installed
  (Settings → Accessibility → Spoken Content → Voices → German).
- Export opens the share sheet → *Save to Files* / AirDrop / Mail.

Deployment happens automatically via `.github/workflows/pages.yml` on every push:
it builds the app and publishes it to the `gh-pages` branch, which GitHub Pages serves.

## Features (v0.1)

- **Child profiles** – several children on one tablet, each with an animal and colour
- **14 game templates**: Entdecken, Finde es, Ballone, Memory, Puzzle, Nachsprechen,
  Der/die/das, Eins oder viele, Sortieren, Was gehört nicht dazu?, Reime,
  Was reimt sich nicht?, Anlaut, Silben klatschen (see [docs/CONCEPT.md](docs/CONCEPT.md))
- **Positive-only feedback** – stars, chimes, praise; no failure states
- **Card editor** for adults: own photo or bundled picture, record the word with the
  microphone or load an audio file, optional article / plural / category / rhyme / first sound / syllables
- **Game editor**: template + card set + number of pictures and rounds
- Starter set "Erste Wörter" with 23 words and many rhyme pairs
- **JSON export/import** of everything (media embedded), or of single card sets
- Adult area protected by press-and-hold (3 s) on the cog

## Development

Prerequisites: Node 20+, Rust (stable) and the
[Tauri prerequisites](https://v2.tauri.app/start/prerequisites/) for your OS.

```sh
npm install
npm run dev          # frontend only, in the browser at http://localhost:1420
npm run tauri dev    # desktop app
npm run check        # svelte-check / TypeScript
npm test             # unit tests (vitest)
npm run tauri build  # release bundle
BASE_PATH=/dazcards/ npm run build   # web/PWA build as deployed to GitHub Pages
```

Mobile (needs Android SDK/NDK or Xcode):

```sh
npm run tauri android init && npm run tauri android dev
npm run tauri ios init && npm run tauri ios dev
```

For microphone recording on mobile, add the permission after `init`:
`RECORD_AUDIO` in the Android manifest, `NSMicrophoneUsageDescription` in the iOS Info.plist.

## Project layout

```
src/
  lib/
    types.ts           data model
    db.ts              IndexedDB storage
    templates/         game templates + registry (index.ts)
    rounds.ts          pure round generation (tested)
    rhyme.ts           German rhyme-key heuristic (tested)
    audio.ts           recordings, TTS fallback, sound effects
    exchange.ts        JSON export / import
    starter.ts         bundled starter card set
  screens/             kid screens (profiles, home, play) and admin/ screens
src-tauri/             Rust shell (dialog + fs plugins for export)
tests/                 vitest unit tests
public/                bundled pictures (Twemoji, CC BY 4.0)
```

## License

Code: [GPL-3.0-or-later](LICENSE). Bundled pictures: Twemoji, CC BY 4.0. See
[ASSETS.md](ASSETS.md).
