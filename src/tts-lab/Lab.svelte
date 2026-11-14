<!--
  Stimmen-Labor: compare German Piper voices (pre-rendered samples) and test
  live neural TTS generation in this browser via WebAssembly.
-->
<script lang="ts">
  import { onMount } from 'svelte';
  import { asset } from '../lib/asset';
  import { GERMAN_VOICES, PiperVoice, cachedVoices, clearVoiceCache, type SynthResult } from '../lib/piper';

  interface Sample { file: string; label: string; seconds: number }
  let samples = $state<{ text: string; note: string; samples: Sample[] } | null>(null);

  const PRESETS = [
    'der Hund',
    'die rote Rose',
    'Der Ball ist unter dem Tisch.',
    'Haus, Maus.',
    'Super! Das hast du toll gemacht!',
    'Wo ist die Katze?',
  ];

  let voiceKey = $state(GERMAN_VOICES[2].key);
  const info = $derived(GERMAN_VOICES.find((v) => v.key === voiceKey)!);
  let speaker = $state(0);
  let lengthScale = $state(1.15);
  let text = $state(PRESETS[2]);
  let voice: PiperVoice | null = null;
  let loadedKey = $state<string | null>(null);
  let busy = $state<'' | 'load' | 'synth'>('');
  let progress = $state(0);
  let stored = $state<string[]>([]);
  let log = $state<string[]>([]);
  let last = $state<SynthResult | null>(null);
  let lastUrl = $state<string | null>(null);
  let ctx: AudioContext | null = null;

  const env = {
    threads: typeof self !== 'undefined' && self.crossOriginIsolated ? 'mehrere' : '1 (keine Cross-Origin-Isolation)',
    cores: typeof navigator !== 'undefined' ? navigator.hardwareConcurrency : 0,
    ua: typeof navigator !== 'undefined' ? navigator.userAgent : '',
  };

  const add = (m: string) => (log = [`${new Date().toLocaleTimeString()}  ${m}`, ...log].slice(0, 40));

  onMount(async () => {
    try {
      samples = await (await fetch(asset('tts-lab/samples/samples.json'))).json();
    } catch {
      /* ignore */
    }
    refreshStored();
  });

  async function refreshStored() {
    try {
      stored = await cachedVoices();
    } catch {
      stored = [];
    }
  }

  /** Unlock Web Audio inside the tap, so playback after async work is allowed on iOS. */
  function unlock() {
    ctx ??= new AudioContext();
    if (ctx.state !== 'running') ctx.resume();
    try {
      const s = (navigator as Navigator & { audioSession?: { type: string } }).audioSession;
      if (s) s.type = 'playback';
    } catch {
      /* ignore */
    }
  }

  async function load() {
    unlock();
    busy = 'load';
    progress = 0;
    add(`Lade ${info.label} …`);
    try {
      voice = await PiperVoice.load(info, (l, t) => (progress = t ? l / t : 0));
      loadedKey = info.key;
      add(`✓ ${info.label} geladen in ${(voice.loadMs / 1000).toFixed(1)} s`);
      speaker = info.speakers ? Object.values(info.speakers)[0] : 0;
    } catch (e) {
      add(`✗ Laden fehlgeschlagen: ${(e as Error).message}`);
    } finally {
      busy = '';
      refreshStored();
    }
  }

  async function speakNow() {
    unlock();
    if (!voice || loadedKey !== voiceKey) await load();
    if (!voice) return;
    busy = 'synth';
    try {
      const r = await voice.synth(text, { speaker, lengthScale });
      last = r;
      if (lastUrl) URL.revokeObjectURL(lastUrl);
      lastUrl = URL.createObjectURL(r.wav);
      const rtf = (r.phonemizeMs + r.inferenceMs) / 1000 / r.audioSeconds;
      add(
        `«${text}»: Laute ${r.phonemizeMs.toFixed(0)} ms + Modell ${r.inferenceMs.toFixed(0)} ms für ${r.audioSeconds.toFixed(1)} s Audio (Faktor ${rtf.toFixed(2)})`,
      );
      // Play via Web Audio (works after async work once unlocked, and in iOS silent mode).
      const buf = ctx!.createBuffer(1, r.pcm.length, r.sampleRate);
      buf.copyToChannel(r.pcm as Float32Array<ArrayBuffer>, 0);
      const src = ctx!.createBufferSource();
      src.buffer = buf;
      src.connect(ctx!.destination);
      src.start();
    } catch (e) {
      add(`✗ Erzeugen fehlgeschlagen: ${(e as Error).message}`);
    } finally {
      busy = '';
    }
  }

  function deviceVoice() {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'de-DE';
    u.rate = 0.85;
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  }

  async function clearAll() {
    await clearVoiceCache();
    voice = null;
    loadedKey = null;
    refreshStored();
    add('Gespeicherte Stimmen gelöscht.');
  }
</script>

<div class="admin lab">
  <header class="bar">
    <h1>Stimmen-Labor</h1>
    <a class="button" href={asset('')}>Zur App</a>
  </header>
  <main>
    <p class="help">
      Vergleich deutscher <strong>Piper</strong>-Stimmen (neuronale Sprachausgabe, Open Source). Alles läuft im Browser,
      ohne Server – nach dem ersten Laden auch offline.
    </p>

    <section>
      <h2>1. Hörproben</h2>
      {#if samples}
        <p class="help">Text: «{samples.text}»<br />{samples.note}</p>
        <ul class="samples">
          {#each samples.samples as s}
            <li>
              <span>{s.label}</span>
              <audio controls preload="none" src={asset(`tts-lab/samples/${s.file}`)}></audio>
            </li>
          {/each}
        </ul>
      {:else}
        <p class="help">Hörproben werden geladen …</p>
      {/if}
    </section>

    <section>
      <h2>2. Live auf diesem Gerät erzeugen</h2>
      <p class="help">
        Testet, ob dieses Gerät die Stimme selbst erzeugen kann und wie schnell. Beim ersten Mal werden ca. 30 MB
        Programm und {info.sizeMB} MB Stimme geladen (am besten im WLAN).
      </p>
      <div class="form">
        <label>
          Stimme
          <select bind:value={voiceKey}>
            {#each GERMAN_VOICES as v}
              <option value={v.key}>{v.label} – {v.sizeMB} MB{stored.includes(v.key) ? ' ✓ gespeichert' : ''}</option>
            {/each}
          </select>
        </label>
        {#if info.speakers}
          <label>
            Stimmung
            <select bind:value={speaker}>
              {#each Object.entries(info.speakers) as [name, id]}<option value={id}>{name}</option>{/each}
            </select>
          </label>
        {:else if info.numSpeakers}
          <label>
            Sprecher*in (0–{info.numSpeakers - 1})
            <input type="number" min="0" max={info.numSpeakers - 1} bind:value={speaker} />
          </label>
        {/if}
        <label>
          Tempo: <strong>{lengthScale.toFixed(2)}</strong> (grösser = langsamer)
          <input type="range" min="0.8" max="1.6" step="0.05" bind:value={lengthScale} />
        </label>
        <label>Text <textarea rows="2" bind:value={text}></textarea></label>
        <div class="presets">
          {#each PRESETS as p}<button type="button" onclick={() => (text = p)}>{p}</button>{/each}
        </div>
      </div>
      <div class="actions">
        <button class="primary" onclick={speakNow} disabled={busy !== ''}>
          {busy === 'load' ? `Lade … ${Math.round(progress * 100)} %` : busy === 'synth' ? 'Erzeuge …' : '▶ Sprechen'}
        </button>
        <button onclick={deviceVoice}>Gerätestimme zum Vergleich</button>
        {#if lastUrl}<a class="button" href={lastUrl} download="probe.wav">WAV speichern</a>{/if}
      </div>
      {#if busy === 'load'}<progress max="1" value={progress}></progress>{/if}
      {#if log.length}<pre class="log">{log.join('\n')}</pre>{/if}
      <p class="help">
        Gerät: {env.cores} Kerne, Threads: {env.threads}. Faktor &lt; 1 heisst: schneller erzeugt als abgespielt.
      </p>
      <button onclick={clearAll}>Gespeicherte Stimmen löschen</button>
    </section>

    <section>
      <h2>Lizenzen</h2>
      <p class="help">
        Thorsten und Kerstin: Trainingsdaten CC0 (frei verwendbar). Piper: MIT. espeak-ng (Laute): GPL-3.0. ONNX
        Runtime: MIT. Andere Stimmen: Lizenz vor einer Verwendung prüfen.
      </p>
    </section>
  </main>
</div>

<style>
  .lab { min-height: 100%; }
  .bar a { text-decoration: none; }
  .samples { list-style: none; padding: 0; display: flex; flex-direction: column; gap: 0.6rem; }
  .samples li { display: flex; flex-direction: column; gap: 0.25rem; background: var(--card); padding: 0.6rem 0.8rem; border-radius: 12px; }
  .samples audio { width: 100%; }
  .presets { display: flex; flex-wrap: wrap; gap: 0.4rem; }
  .presets button { font-size: 0.85rem; padding: 0.3rem 0.6rem; }
  textarea { font: inherit; padding: 0.5rem; border-radius: 10px; border: 1px solid var(--shadow); background: var(--card); color: var(--text); }
  .actions { display: flex; gap: 0.5rem; flex-wrap: wrap; margin: 1rem 0; }
  progress { width: 100%; }
  .log { font-size: 0.8rem; white-space: pre-wrap; background: var(--card); padding: 0.75rem; border-radius: 10px; max-height: 16rem; overflow-y: auto; }
</style>
