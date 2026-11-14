<!--
  Ballone: balloons with pictures float upwards. A word is spoken; pop the
  balloon with that picture. Other balloons just bob and say their word.
-->
<script lang="ts">
  import { onMount } from 'svelte';
  import CardImage from '../components/CardImage.svelte';
  import Progress from '../components/Progress.svelte';
  import SpeakButton from '../components/SpeakButton.svelte';
  import { chime, pop, praise, sayCard, stopAll, wait } from '../audio';
  import { findItRounds } from '../rounds';
  import type { Card } from '../types';
  import type { TemplateProps } from './types';

  let { game, deck, cards, onfinish }: TemplateProps = $props();
  // svelte-ignore state_referenced_locally
  const rounds = findItRounds(cards, game.options.choices, game.options.rounds);
  const HUES = [0, 35, 200, 280, 130, 330];

  let index = $state(0);
  let popped = $state<string | null>(null);
  let nudged = $state<string | null>(null);
  let busy = false;
  const round = $derived(rounds[index]);

  // Spread balloons across the width; vary speed and start so they never move in lockstep.
  const layout = $derived(
    round
      ? round.options.map((c, i) => ({
          card: c,
          left: 4 + (i * 92) / round.options.length + Math.random() * 4,
          duration: 11 + Math.random() * 5,
          delay: -Math.random() * 10,
          hue: HUES[i % HUES.length],
        }))
      : [],
  );

  const ask = () => round && sayCard(round.prompt, deck.lang, true);

  onMount(() => {
    setTimeout(ask, 500);
    return stopAll;
  });

  async function tap(c: Card) {
    if (busy) return;
    busy = true;
    if (c.id === round.answer.id) {
      popped = c.id;
      pop();
      chime();
      await sayCard(c, deck.lang, true);
      await praise();
      popped = null;
      if (index + 1 >= rounds.length) return onfinish(3);
      index += 1;
      await wait(300);
      busy = false;
      ask();
    } else {
      nudged = c.id;
      await sayCard(c, deck.lang, true);
      nudged = null;
      await wait(200);
      busy = false;
      ask();
    }
  }
</script>

{#if round}
  <div class="game">
    <div class="top">
      <Progress done={index} total={rounds.length} />
      <SpeakButton onclick={ask} />
    </div>
    <div class="sky">
      {#key index}
        {#each layout as b (b.card.id)}
          <button
            class="balloon"
            class:popped={popped === b.card.id}
            class:nudge={nudged === b.card.id}
            style:left="{b.left}%"
            style:--h={b.hue}
            style:animation-duration="{b.duration}s"
            style:animation-delay="{b.delay}s"
            onpointerdown={() => tap(b.card)}
            aria-label={b.card.word}
          >
            <span class="body"><CardImage card={b.card} /></span>
            <span class="string"></span>
          </button>
        {/each}
      {/key}
    </div>
  </div>
{/if}

<style>
  .game { position: relative; height: 100%; overflow: hidden; }
  .top { position: relative; z-index: 2; display: flex; flex-direction: column; align-items: center; gap: 0.5rem; padding-top: 1rem; }
  .sky { position: absolute; inset: 0; }
  .balloon {
    position: absolute; bottom: 0; width: min(22vh, 26vw); background: none; border: none; padding: 0;
    animation-name: rise; animation-timing-function: linear; animation-iteration-count: infinite;
    touch-action: manipulation;
  }
  .body {
    display: block; aspect-ratio: 0.85; border-radius: 50% 50% 48% 48%; padding: 18%; box-sizing: border-box;
    background: radial-gradient(circle at 30% 25%, hsl(var(--h) 90% 85%), hsl(var(--h) 75% 62%));
    box-shadow: inset -6px -8px 0 hsl(var(--h) 60% 50% / 0.5);
  }
  .string { display: block; width: 2px; height: 40px; margin: 0 auto; background: var(--muted); }
  .popped .body { animation: burst 0.3s ease forwards; }
  .popped .string { opacity: 0; }
  .nudge .body { animation: wiggle 0.4s ease; }
  @keyframes rise {
    from { transform: translateY(110%); }
    to { transform: translateY(-110vh); }
  }
  @keyframes burst { to { transform: scale(1.6); opacity: 0; } }
  @keyframes wiggle { 25% { transform: rotate(-6deg); } 75% { transform: rotate(6deg); } }
</style>
