<!--
  Shared engine for sorting games: a picture is shown and spoken, the child
  taps the bin (house, basket) it belongs to. Collected pictures pile up in
  their bin. Wrong bins just wiggle; the word is repeated.
-->
<script lang="ts">
  import { onMount, type Snippet } from 'svelte';
  import CardImage from '../components/CardImage.svelte';
  import SpeakButton from '../components/SpeakButton.svelte';
  import Progress from '../components/Progress.svelte';
  import { chime, praise, stopAll, wait } from '../audio';
  import type { BinRound } from '../rounds';
  import type { Card } from '../types';

  let {
    rounds,
    binCount,
    colors,
    bin,
    say,
    afterCorrect,
    onfinish,
  }: {
    rounds: BinRound[];
    binCount: number;
    colors: string[];
    /** Renders the inside of bin i (icon/example picture). */
    bin: Snippet<[number]>;
    say: (card: Card) => Promise<void>;
    afterCorrect?: (r: BinRound) => Promise<void>;
    onfinish: (stars: number) => void;
  } = $props();

  let index = $state(0);
  let busy = $state(false);
  let nudged = $state<number | null>(null);
  let flying = $state(false);
  let collected = $state<Card[][]>([]);
  const round = $derived(rounds[index]);

  // svelte-ignore state_referenced_locally
  collected = Array.from({ length: binCount }, () => []);

  onMount(() => {
    setTimeout(() => round && say(round.card), 400);
    return stopAll;
  });

  async function tap(i: number) {
    if (busy || !round) return;
    busy = true;
    if (i === round.bin) {
      flying = true;
      chime();
      await wait(450);
      collected[i] = [...collected[i], round.card];
      await (afterCorrect ? afterCorrect(round) : say(round.card));
      await praise();
      if (index + 1 >= rounds.length) return onfinish(3);
      index += 1;
      flying = false;
      busy = false;
      await wait(300);
      say(rounds[index].card);
    } else {
      nudged = i;
      await wait(400);
      nudged = null;
      await say(round.card);
      busy = false;
    }
  }
</script>

{#if round}
  <div class="game">
    <Progress done={index} total={rounds.length} />
    <div class="prompt">
      {#key index}
        <button class="card" class:flying onclick={() => say(round.card)} aria-label="Nochmals hören">
          <CardImage card={round.card} />
        </button>
      {/key}
      <SpeakButton onclick={() => say(round.card)} />
    </div>
    <div class="bins" style:--n={binCount}>
      {#each Array(binCount) as _, i}
        <button class="bin" class:nudge={nudged === i} style:--c={colors[i]} onclick={() => tap(i)}>
          <div class="inside">{@render bin(i)}</div>
          <div class="pile">
            {#each collected[i].slice(-4) as c (c.id)}
              <span class="mini"><CardImage card={c} /></span>
            {/each}
          </div>
        </button>
      {/each}
    </div>
  </div>
{/if}

<style>
  .game {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2vh;
    height: 100%;
    padding: 1rem;
    box-sizing: border-box;
  }
  .prompt { display: flex; align-items: center; gap: 1.5rem; }
  .card {
    width: min(30vh, 42vw);
    background: var(--card);
    border: none;
    border-radius: 28px;
    padding: 1rem;
    box-shadow: 0 6px 0 var(--shadow);
    animation: appear 0.35s ease;
  }
  .card.flying { transition: transform 0.45s ease-in, opacity 0.45s; transform: translateY(40vh) scale(0.2); opacity: 0; }
  .bins {
    display: grid;
    grid-template-columns: repeat(var(--n), 1fr);
    gap: 3vmin;
    width: min(100%, calc(var(--n) * 30vh));
    margin-top: auto;
    margin-bottom: auto;
  }
  .bin {
    background: var(--c);
    border: none;
    border-radius: 28px;
    box-shadow: 0 7px 0 color-mix(in srgb, var(--c) 60%, black);
    padding: 6% 6% 4%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.4rem;
    min-height: 22vh;
  }
  .bin:active { transform: translateY(4px); }
  .inside { width: 70%; }
  .pile { display: flex; gap: 2px; min-height: 36px; }
  .mini { width: 36px; height: 36px; background: #fffc; border-radius: 8px; padding: 2px; box-sizing: border-box; }
  .nudge { animation: wiggle 0.4s ease; }
  @keyframes wiggle { 25% { transform: rotate(-3deg); } 75% { transform: rotate(3deg); } }
  @keyframes appear { from { transform: scale(0.6); opacity: 0; } }
</style>
