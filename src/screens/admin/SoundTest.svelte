<!-- Diagnostics for adults: why is there no sound? -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { audioInfo, chime, pickVoice, speak } from '../../lib/audio';

  type Info = Awaited<ReturnType<typeof audioInfo>>;
  let info = $state<Info | null>(null);
  let spoke = $state<'idle' | 'speaking' | 'done'>('idle');

  const refresh = async () => (info = await audioInfo());
  onMount(refresh);

  const german = $derived(info ? info.voices.filter((v) => v.lang.toLowerCase().startsWith('de')) : []);
  const chosen = $derived(
    info && typeof speechSynthesis !== 'undefined' ? pickVoice(speechSynthesis.getVoices(), 'de-CH') : undefined,
  );

  async function testSpeech() {
    spoke = 'speaking';
    await speak('Hallo! Das ist der Hund.', 'de-CH');
    spoke = 'done';
    refresh();
  }
</script>

<section>
  <h2>Ton testen</h2>
  <p class="help">Wenn die Kinder nichts hören: hier prüfen, was das Gerät kann.</p>
  <div class="tests">
    <button class="primary" onclick={testSpeech}>▶ Sprachausgabe testen</button>
    <button onclick={() => { chime(); refresh(); }}>♪ Klang testen</button>
  </div>
  {#if spoke === 'done'}
    <p class="help">Nichts gehört? Siehe Tipps unten.</p>
  {/if}

  {#if info}
    <ul class="status">
      <li class:ok={info.tts} class:bad={!info.tts}>
        Sprachausgabe (Text-to-Speech): {info.tts ? 'vorhanden' : 'nicht vorhanden'}
      </li>
      <li class:ok={german.length > 0} class:bad={german.length === 0}>
        Deutsche Stimmen: {german.length > 0 ? german.length : 'keine gefunden'}
        {#if chosen}<br /><small>verwendet: {chosen.name} ({chosen.lang})</small>{/if}
      </li>
    </ul>
  {/if}

  <h2>Tipps (iPhone / iPad)</h2>
  <ul class="tips">
    <li>Lautstärke hochdrehen und den <strong>Stumm-Schalter</strong> (bzw. Fokus/«Nicht stören») prüfen.</li>
    <li>Zuerst einmal irgendwo in der App tippen – iOS erlaubt Ton erst nach einer Berührung.</li>
    <li>
      Deutsche Stimme installieren: <em>Einstellungen → Bedienungshilfen → Gesprochene Inhalte → Stimmen → Deutsch</em>,
      eine Stimme laden (z.&nbsp;B. «Anna» oder eine «Erweitert»-Stimme). Danach die App neu starten.
    </li>
    <li>Wörter mit eigener Aufnahme (Karte bearbeiten → Aufnehmen) funktionieren immer, auch ohne Sprachausgabe.</li>
  </ul>

  {#if info}
    <details>
      <summary>Technische Details</summary>
      <pre>{JSON.stringify(
          { ...info, voices: `${info.voices.length} total`, german },
          null,
          2,
        )}</pre>
    </details>
  {/if}
</section>

<style>
  .tests { display: flex; gap: 0.5rem; flex-wrap: wrap; }
  .status { list-style: none; padding: 0; display: flex; flex-direction: column; gap: 0.4rem; }
  .status li { padding: 0.6rem 0.8rem; border-radius: 10px; background: var(--card); }
  .status li.ok::before { content: '✓ '; color: var(--good); font-weight: 700; }
  .status li.bad::before { content: '✗ '; color: var(--danger); font-weight: 700; }
  .tips li { margin-bottom: 0.4rem; }
  pre { font-size: 0.75rem; white-space: pre-wrap; word-break: break-all; background: var(--card); padding: 0.75rem; border-radius: 10px; }
</style>
