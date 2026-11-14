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
  import { chime, praise, sayCard, stopAll, wait } from '../audio';
  import type { Round } from '../rounds';
  import type { Card, Deck } from '../types';

  type TileState = 'correct' | 'nudge' | 'dim' | 'active';

  let {
    rounds,
    deck,
    promptMode,
    introduce = false,
    withArticle = true,
    onfinish,
    afterCorrect,
  }: {
    rounds: Round[];
    deck: Deck;
    /** 'speaker': only hear the prompt; 'card': see and hear it; 'none': no prompt (odd one out). */
    promptMode: 'speaker' | 'card' | 'none';
    /** Name every option in turn at the start of each round. */
    introduce?: boolean;
    /** Speak nouns with their article ("der Hund"). Off for sound games (rhymes, first sounds). */
    withArticle?: boolean;
    onfinish: (stars: number) => void;
    afterCorrect?: (r: Round) => Promise<void>;
  } = $props();

  let index = $state(0);
  let states = $state<Record<string, TileState | undefined>>({});
  let busy = $state(false);
  let asking = 0; // invalidates an intro that is still running when the child taps
  const round = $derived(rounds[index]);
  const cols = $derived(round ? (round.options.length === 4 ? 2 : Math.min(3, round.options.length)) : 3);

  async function ask() {
    if (!round) return;
    const token = ++asking;
    if (promptMode !== 'none') await sayCard(round.prompt, deck.lang, withArticle);
    if (!introduce) return;
    for (const o of round.options) {
      if (token !== asking) return;
      states = { ...states, [o.id]: 'active' };
      await sayCard(o, deck.lang, withArticle);
      states = { ...states, [o.id]: undefined };
      await wait(150);
    }
  }

  onMount(() => {
    setTimeout(ask, 400);
    return () => {
      asking++;
      stopAll();
    };
  });

  async function tap(card: Card) {
    if (busy || !round) return;
    asking++; // stop a running introduction
    if (card.id === round.answer.id) {
      busy = true;
      states = Object.fromEntries(round.options.map((o) => [o.id, o.id === card.id ? 'correct' : 'dim']));
      chime();
      await (afterCorrect ? afterCorrect(round) : sayCard(card, deck.lang, withArticle));
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
      states = { [card.id]: 'nudge' };
      busy = true;
      await sayCard(card, deck.lang, withArticle);
      states = {};
      busy = false;
      await wait(250);
      // After a wrong guess, only repeat the prompt – not the whole introduction.
      if (promptMode !== 'none') sayCard(round.prompt, deck.lang, withArticle);
    }
  }
</script>

{#if round}
  <div class="game">
    <Progress done={index} total={rounds.length} />
    <div class="prompt">
      {#if promptMode === 'card'}
        <button class="prompt-card" onclick={ask} aria-label="Nochmals hören">
          <CardImage card={round.prompt} />
        </button>
      {/if}
      <SpeakButton big={promptMode === 'speaker'} onclick={ask} />
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
