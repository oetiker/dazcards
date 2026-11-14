<!-- Diagnostics for adults: why is there no sound? -->
<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { audioInfo, chime, pickVoice, setSpeechLogger, speak } from '../../lib/audio';

  type Info = Awaited<ReturnType<typeof audioInfo>>;
  let info = $state<Info | null>(null);
  let spoke = $state<'idle' | 'speaking' | 'done'>('idle');

  let logLines = $state<string[]>([]);
  const t0 = performance.now();
  const addLog = (m: string) => (logLines = [...logLines, `${((performance.now() - t0) / 1000).toFixed(1)}s ${m}`].slice(-30));

  const refresh = async () => (info = await audioInfo());
  onMount(() => {
    setSpeechLogger(addLog);
    refresh();
  });
  onDestroy(() => setSpeechLogger(null));

  /** Bare-bones test straight in the tap handler, bypassing all app logic. */
  function testDirect() {
    if (typeof speechSynthesis === 'undefined') return addLog('direct: no speechSynthesis');
    const u = new SpeechSynthesisUtterance('Hallo! Das ist der Hund.');
    const v = pickVoice(speechSynthesis.getVoices(), 'de-DE');
    if (v) u.voice = v;
    u.lang = v?.lang ?? 'de-DE';
    u.onstart = () => addLog('direct: start');
    u.onend = () => addLog('direct: end');
    u.onerror = (e) => addLog(`direct: error ${(e as SpeechSynthesisErrorEvent).error}`);
    speechSynthesis.speak(u);
    addLog(`direct: queued (voice ${v?.name ?? 'none'})`);
    (window as unknown as { __u: unknown }).__u = u; // keep alive
  }

  function resetSpeech() {
    speechSynthesis.cancel();
    speechSynthesis.resume();
    addLog(`reset: speaking=${speechSynthesis.speaking} pending=${speechSynthesis.pending} paused=${speechSynthesis.paused}`);
  }

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
    <button onclick={testDirect}>Direkttest</button>
    <button onclick={resetSpeech}>Sprache zurücksetzen</button>
  </div>
  {#if logLines.length}
    <pre class="log">{logLines.join('\n')}</pre>
  {/if}
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
    <li>
      <strong>Stumm-Modus ausschalten</strong> (Schalter bzw. Aktionstaste seitlich). Klänge funktionieren auch im
      Stumm-Modus, die <strong>Sprachausgabe von iOS aber nicht</strong>. Lautstärke hochdrehen.
    </li>
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
  .log { margin-top: 0.75rem; max-height: 14rem; overflow-y: auto; }
  pre { font-size: 0.75rem; white-space: pre-wrap; word-break: break-all; background: var(--card); padding: 0.75rem; border-radius: 10px; }
</style>
