<!--
  Shared engine for "listen, then tap the right picture" templates.
  Feedback is positive-only: a wrong tap gently wiggles the card, names it,
  and repeats the question. A right tap gets a star, a chime and praise.
-->
<script lang="ts">
  import { onMount } from 'svelte';
  import Tile from '../components/Tile.svelte';
  import CardImage from '../components/CardImage.svelte';
  import SpeakButton from '../components/SpeakButton.svelte';
  import Progress from '../components/Progress.svelte';
  import { chime, praise, sayCard, stopAll } from '../audio';
  import type { Round } from '../rounds';
  import type { Card, Deck } from '../types';

  let {
    rounds,
    deck,
    showPrompt,
    onfinish,
    afterCorrect,
  }: {
    rounds: Round[];
    deck: Deck;
    /** Show the prompt card's picture (rhyme) or only a speaker button (find it). */
    showPrompt: boolean;
    onfinish: (stars: number) => void;
    afterCorrect?: (r: Round) => Promise<void>;
  } = $props();

  let index = $state(0);
  let states = $state<Record<string, 'correct' | 'nudge' | 'dim'>>({});
  let busy = $state(false);
  const round = $derived(rounds[index]);
  const cols = $derived(round ? (round.options.length === 4 ? 2 : Math.min(3, round.options.length)) : 3);

  const ask = () => round && sayCard(round.prompt, deck.lang, true);
  const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

  onMount(() => {
    setTimeout(ask, 400);
    return stopAll;
  });

  async function tap(card: Card) {
    if (busy || !round) return;
    if (card.id === round.answer.id) {
      busy = true;
      states = Object.fromEntries(round.options.map((o) => [o.id, o.id === card.id ? 'correct' : 'dim']));
      chime();
      await (afterCorrect ? afterCorrect(round) : sayCard(card, deck.lang, true));
      await praise();
      await wait(500);
      states = {};
      if (index + 1 >= rounds.length) {
        onfinish(3);
      } else {
        index += 1;
        busy = false;
        await wait(200);
        ask();
      }
    } else {
      states = { ...states, [card.id]: 'nudge' };
      busy = true;
      await sayCard(card, deck.lang, true);
      states = { ...states, [card.id]: undefined as never };
      busy = false;
      await wait(250);
      ask();
    }
  }
</script>

{#if round}
  <div class="game">
    <Progress done={index} total={rounds.length} />
    <div class="prompt">
      {#if showPrompt}
        <button class="prompt-card" onclick={ask} aria-label="Nochmals hören">
          <CardImage card={round.prompt} />
        </button>
      {/if}
      <SpeakButton big={!showPrompt} onclick={ask} />
    </div>
    <div class="options" style:--cols={cols}>
      {#each round.options as card (card.id + index)}
        <Tile {card} state={states[card.id] ?? 'idle'} onclick={() => tap(card)} />
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
  .prompt {
    display: flex;
    align-items: center;
    gap: 1.5rem;
  }
  .prompt-card {
    width: min(26vh, 40vw);
    background: var(--card-alt);
    border: none;
    border-radius: 28px;
    padding: 1rem;
    box-shadow: 0 6px 0 var(--shadow);
  }
  .options {
    display: grid;
    grid-template-columns: repeat(var(--cols), 1fr);
    gap: 3vmin;
    width: min(100%, calc(var(--cols) * 34vh));
    margin-top: auto;
    margin-bottom: auto;
  }
</style>
