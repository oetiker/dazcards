<!--
  Nachsprechen: hear the word, tap the microphone and say it. The app plays
  the child's voice back, then the model once more – and praises. There is
  no speech scoring: saying it out loud is the exercise.
  Without a microphone the game still works as a listening game.
-->
<script lang="ts">
  import { onMount } from 'svelte';
  import CardImage from '../components/CardImage.svelte';
  import Progress from '../components/Progress.svelte';
  import SpeakButton from '../components/SpeakButton.svelte';
  import { chime, praise, sayCard, stopAll, wait } from '../audio';
  import { promptSequence, withImage } from '../rounds';
  import type { TemplateProps } from './types';

  let { game, deck, cards, onfinish }: TemplateProps = $props();
  // svelte-ignore state_referenced_locally
  const rounds = promptSequence(withImage(cards), game.options.rounds);
  const RECORD_MS = 2500;

  let index = $state(0);
  let phase = $state<'model' | 'ready' | 'recording' | 'playback'>('model');
  let noMic = $state(false);
  let recorder: MediaRecorder | null = null;
  let stopTimer: ReturnType<typeof setTimeout> | undefined;
  const card = $derived(rounds[index]);

  async function model() {
    phase = 'model';
    await sayCard(card, deck.lang, true);
    phase = 'ready';
  }

  onMount(() => {
    setTimeout(model, 400);
    return () => {
      clearTimeout(stopTimer);
      if (recorder?.state === 'recording') recorder.stop();
      stopAll();
    };
  });

  function playBlob(b: Blob): Promise<void> {
    const url = URL.createObjectURL(b);
    const a = new Audio(url);
    return new Promise((resolve) => {
      const done = () => {
        URL.revokeObjectURL(url);
        resolve();
      };
      a.onended = done;
      a.onerror = done;
      a.play().catch(done);
    });
  }

  async function finishRound() {
    chime();
    await praise();
    if (index + 1 >= rounds.length) return onfinish(3);
    index += 1;
    await wait(300);
    model();
  }

  async function mic() {
    if (phase === 'recording') {
      clearTimeout(stopTimer);
      recorder?.stop();
      return;
    }
    if (phase !== 'ready') return;
    if (noMic) {
      phase = 'playback';
      await sayCard(card, deck.lang, true);
      return finishRound();
    }
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      noMic = true;
      return mic();
    }
    const chunks: Blob[] = [];
    recorder = new MediaRecorder(stream);
    recorder.ondataavailable = (e) => chunks.push(e.data);
    recorder.onstop = async () => {
      // Release the microphone right away (on iOS an open mic makes playback quiet).
      stream.getTracks().forEach((t) => t.stop());
      phase = 'playback';
      await wait(200);
      await playBlob(new Blob(chunks, { type: recorder?.mimeType }));
      await wait(250);
      await sayCard(card, deck.lang, true);
      finishRound();
    };
    recorder.start();
    phase = 'recording';
    stopTimer = setTimeout(() => recorder?.state === 'recording' && recorder.stop(), RECORD_MS);
  }
</script>

{#if card}
  <div class="game">
    <Progress done={index} total={rounds.length} />
    <div class="prompt">
      {#key index}
        <div class="card" class:speaking={phase === 'model' || phase === 'playback'}><CardImage {card} /></div>
      {/key}
      <SpeakButton onclick={model} />
    </div>
    <button
      class="mic"
      class:recording={phase === 'recording'}
      class:waiting={phase !== 'ready' && phase !== 'recording'}
      style:--ms="{RECORD_MS}ms"
      onclick={mic}
      aria-label={noMic ? 'Weiter' : 'Aufnehmen'}
    >
      {#if noMic}
        <svg viewBox="0 0 24 24"><path fill="currentColor" d="M8 5v14l11-7z" /></svg>
      {:else}
        <svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 15a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v7a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.9V22h2v-3.1a7 7 0 0 0 6-6.9z" /></svg>
      {/if}
    </button>
  </div>
{/if}

<style>
  .game { display: flex; flex-direction: column; align-items: center; gap: 3vh; height: 100%; padding: 1rem; box-sizing: border-box; }
  .prompt { display: flex; align-items: center; gap: 1.5rem; }
  .card {
    width: min(34vh, 50vw); background: var(--card); border-radius: 28px; padding: 1rem;
    box-shadow: 0 6px 0 var(--shadow); transition: transform 0.2s;
  }
  .card.speaking { transform: scale(1.04); outline: 6px solid var(--accent); }
  .mic {
    position: relative; width: min(22vh, 36vw); aspect-ratio: 1; border-radius: 50%; border: none;
    background: #e53935; color: white; box-shadow: 0 7px 0 #a42825; margin: auto 0; transition: opacity 0.2s;
  }
  .mic svg { width: 50%; }
  .mic.waiting { opacity: 0.4; }
  .mic.recording { animation: pulse 0.8s ease-in-out infinite; }
  /* A ring that fills up while recording, so the child sees time running. */
  .mic.recording::after {
    content: ''; position: absolute; inset: -12px; border-radius: 50%;
    background: conic-gradient(#e53935 var(--p, 0deg), transparent 0);
    mask: radial-gradient(farthest-side, transparent calc(100% - 8px), #000 0);
    animation: ring var(--ms) linear forwards;
  }
  @property --p { syntax: '<angle>'; inherits: false; initial-value: 0deg; }
  @keyframes ring { to { --p: 360deg; } }
  @keyframes pulse { 50% { transform: scale(1.06); } }
</style>
