<!--
  Shared engine: the same picture in several variants (colours, positions).
  A phrase is spoken; the child taps the matching variant. A wrong tap names
  what was tapped and repeats the question.
-->
<script lang="ts" generics="V">
  import { onMount, type Snippet } from 'svelte';
  import Progress from '../components/Progress.svelte';
  import SpeakButton from '../components/SpeakButton.svelte';
  import { chime, praise, stopAll, wait } from '../audio';
  import type { VariantRound } from '../rounds';
  import type { Card } from '../types';

  let {
    rounds,
    say,
    option,
    onfinish,
  }: {
    rounds: VariantRound<V>[];
    say: (card: Card, variant: V) => Promise<void>;
    option: Snippet<[Card, V]>;
    onfinish: (stars: number) => void;
  } = $props();

  let index = $state(0);
  let states = $state<Record<number, 'correct' | 'nudge' | 'dim'>>({});
  let busy = false;
  const round = $derived(rounds[index]);
  const cols = $derived(round && round.options.length === 4 ? 2 : Math.min(3, round?.options.length ?? 3));

  const ask = () => round && say(round.card, round.answer);

  onMount(() => {
    setTimeout(ask, 400);
    return stopAll;
  });

  async function tap(i: number) {
    if (busy || !round) return;
    busy = true;
    const v = round.options[i];
    if (v === round.answer) {
      states = Object.fromEntries(round.options.map((_, j) => [j, j === i ? 'correct' : 'dim']));
      chime();
      await say(round.card, v);
      await praise();
      states = {};
      if (index + 1 >= rounds.length) return onfinish(3);
      index += 1;
      await wait(300);
      busy = false;
      ask();
    } else {
      states = { [i]: 'nudge' };
      await say(round.card, v);
      states = {};
      await wait(250);
      await ask();
      busy = false;
    }
  }
</script>

{#if round}
  <div class="game">
    <Progress done={index} total={rounds.length} />
    <SpeakButton big onclick={ask} />
    <div class="options" style:--cols={cols}>
      {#each round.options as v, i (index + '-' + i)}
        <button class="opt {states[i] ?? ''}" onclick={() => tap(i)}>
          {@render option(round.card, v)}
        </button>
      {/each}
    </div>
  </div>
{/if}

<style>
  .game { display: flex; flex-direction: column; align-items: center; gap: 2vh; height: 100%; padding: 1rem; box-sizing: border-box; }
  .options {
    display: grid; grid-template-columns: repeat(var(--cols), 1fr); gap: 3vmin;
    width: min(100%, calc(var(--cols) * 36vh)); margin: auto 0;
  }
  .opt {
    position: relative; aspect-ratio: 1; background: var(--card); border: none; border-radius: 28px;
    padding: 6%; box-shadow: 0 6px 0 var(--shadow); transition: opacity 0.3s; touch-action: manipulation;
  }
  .opt:active { transform: translateY(4px); box-shadow: 0 2px 0 var(--shadow); }
  .correct { outline: 6px solid var(--good); animation: pop 0.5s ease; }
  .nudge { animation: wiggle 0.4s ease; }
  .dim { opacity: 0.35; }
  @keyframes pop { 50% { transform: scale(1.06); } }
  @keyframes wiggle { 25% { transform: rotate(-3deg); } 75% { transform: rotate(3deg); } }
</style>
