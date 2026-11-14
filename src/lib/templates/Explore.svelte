<!-- Free exploration: tap any picture to hear it. Celebrates once every card was heard. -->
<script lang="ts">
  import { onDestroy } from 'svelte';
  import Tile from '../components/Tile.svelte';
  import Progress from '../components/Progress.svelte';
  import { sayCard, stopAll } from '../audio';
  import type { Card } from '../types';
  import type { TemplateProps } from './types';

  let { deck, cards, onfinish }: TemplateProps = $props();
  // svelte-ignore state_referenced_locally
  const shown = cards.filter((c) => c.imageId);
  let heard = $state(new Set<string>());
  let active = $state<string | null>(null);
  let finished = false;

  onDestroy(stopAll);

  async function tap(card: Card) {
    active = card.id;
    heard = new Set([...heard, card.id]);
    await sayCard(card, deck.lang, true);
    if (active === card.id) active = null;
    if (!finished && heard.size === shown.length) {
      finished = true;
      setTimeout(() => onfinish(3), 600);
    }
  }
</script>

<div class="explore">
  <Progress done={heard.size} total={shown.length} />
  <div class="grid">
    {#each shown as card (card.id)}
      <Tile {card} state={active === card.id ? 'correct' : 'idle'} onclick={() => tap(card)} />
    {/each}
  </div>
</div>

<style>
  .explore {
    padding: 1rem;
    height: 100%;
    box-sizing: border-box;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(150px, 28vw), 1fr));
    gap: 3vmin;
  }
</style>
