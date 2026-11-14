<!--
  Silben klatschen: hear the word, tap the drum once per syllable. After a
  short pause the taps are counted. If the count is off, the app claps it
  out together with the word, and the child tries once more.
-->
<script lang="ts">
  import { onMount } from 'svelte';
  import CardImage from '../components/CardImage.svelte';
  import Progress from '../components/Progress.svelte';
  import SpeakButton from '../components/SpeakButton.svelte';
  import { chime, drum, praise, sayCard, stopAll, wait } from '../audio';
  import { promptSequence, withImage } from '../rounds';
  import { syllableCount } from '../phonology';
  import { asset } from '../asset';
  import type { TemplateProps } from './types';

  let { game, deck, cards, onfinish }: TemplateProps = $props();
  // svelte-ignore state_referenced_locally
  const rounds = promptSequence(withImage(cards).filter((c) => syllableCount(c) <= 5), game.options.rounds);
  const PAUSE_MS = 1600;

  let index = $state(0);
  let taps = $state(0);
  let lit = $state(-1); // dot highlighted during a demonstration
  let phase = $state<'listen' | 'clap' | 'demo' | 'done'>('listen');
  let tries = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const card = $derived(rounds[index]);
  const target = $derived(card ? syllableCount(card) : 0);

  async function start() {
    phase = 'listen';
    taps = 0;
    await sayCard(card, deck.lang);
    phase = 'clap';
  }

  onMount(() => {
    setTimeout(start, 400);
    return () => {
      clearTimeout(timer);
      stopAll();
    };
  });

  function hit() {
    if (phase !== 'clap' && phase !== 'listen') return;
    phase = 'clap';
    drum();
    taps += 1;
    clearTimeout(timer);
    timer = setTimeout(evaluate, PAUSE_MS);
  }

  async function demonstrate() {
    phase = 'demo';
    taps = 0;
    await sayCard(card, deck.lang);
    await wait(250);
    for (let i = 0; i < target; i++) {
      lit = i;
      drum();
      await wait(450);
    }
    lit = -1;
    await wait(300);
  }

  async function evaluate() {
    if (taps === target) {
      phase = 'done';
      chime();
      await praise();
      await next();
      return;
    }
    tries += 1;
    await demonstrate();
    if (tries >= 2) {
      await praise(); // still a good try – move on
      await next();
    } else {
      taps = 0;
      phase = 'clap';
    }
  }

  async function next() {
    tries = 0;
    if (index + 1 >= rounds.length) return onfinish(3);
    index += 1;
    await wait(300);
    start();
  }
</script>

{#if card}
  <div class="game">
    <Progress done={index} total={rounds.length} />
    <div class="prompt">
      {#key index}
        <div class="card"><CardImage {card} /></div>
      {/key}
      <SpeakButton onclick={() => sayCard(card, deck.lang)} />
    </div>
    <div class="dots" aria-label="{taps} Mal geklatscht">
      <!-- Only show what was clapped (or demonstrated) – never the expected count. -->
      {#each Array(phase === 'demo' ? lit + 1 : taps) as _, i (i)}
        <span class="on"></span>
      {/each}
    </div>
    <button class="drum" class:done={phase === 'done'} onpointerdown={hit} aria-label="Klatschen">
      <img src={asset('templates/syllables.svg')} alt="" />
    </button>
  </div>
{/if}

<style>
  .game { display: flex; flex-direction: column; align-items: center; gap: 2.5vh; height: 100%; padding: 1rem; box-sizing: border-box; }
  .prompt { display: flex; align-items: center; gap: 1.5rem; }
  .card {
    width: min(28vh, 40vw); background: var(--card); border-radius: 28px; padding: 1rem;
    box-shadow: 0 6px 0 var(--shadow); animation: appear 0.35s ease;
  }
  .dots { display: flex; gap: 14px; min-height: 40px; align-items: center; }
  .dots span { width: 34px; height: 34px; border-radius: 50%; background: var(--accent); animation: pop-in 0.2s ease; }
  @keyframes pop-in { from { transform: scale(0); } }
  .drum {
    width: min(34vh, 60vw); aspect-ratio: 1; border-radius: 50%; border: none;
    background: var(--card-alt); box-shadow: 0 8px 0 var(--shadow); padding: 14%;
    display: grid; place-items: center;
    touch-action: manipulation; margin-top: auto; margin-bottom: auto;
  }
  .drum:active { transform: translateY(5px) scale(0.97); box-shadow: 0 3px 0 var(--shadow); }
  .drum.done { outline: 8px solid var(--good); }
  .drum img { width: 100%; height: 100%; pointer-events: none; }
  @keyframes appear { from { transform: scale(0.6); opacity: 0; } }
</style>
