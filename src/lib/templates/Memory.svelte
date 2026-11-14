<!--
  Memory: find the pairs. Every turned card says its word; a pair stays open
  with a chime. Non-matching cards simply turn back – no penalty.
-->
<script lang="ts">
  import { onDestroy } from 'svelte';
  import CardImage from '../components/CardImage.svelte';
  import { chime, praise, sayCard, stopAll, wait } from '../audio';
  import { memoryTiles, type MemoryTile } from '../rounds';
  import type { TemplateProps } from './types';

  let { game, deck, cards, onfinish }: TemplateProps = $props();
  // svelte-ignore state_referenced_locally
  const tiles = memoryTiles(cards, game.options.choices);
  let open = $state<string[]>([]); // keys currently face up (max 2)
  let matched = $state(new Set<string>()); // card ids
  let busy = false;
  const cols = tiles.length <= 4 ? 2 : tiles.length <= 6 ? 3 : tiles.length <= 12 ? 4 : 5;

  onDestroy(stopAll);

  async function flip(t: MemoryTile) {
    if (busy || open.includes(t.key) || matched.has(t.card.id)) return;
    open = [...open, t.key];
    if (open.length === 1) {
      sayCard(t.card, deck.lang, true);
      return;
    }
    busy = true;
    const first = tiles.find((x) => x.key === open[0])!;
    await sayCard(t.card, deck.lang, true);
    if (first.card.id === t.card.id) {
      chime();
      matched = new Set([...matched, t.card.id]);
      open = [];
      await praise();
      if (matched.size * 2 === tiles.length) {
        await wait(300);
        onfinish(3);
      }
    } else {
      await wait(700);
      open = [];
    }
    busy = false;
  }
</script>

<div class="memory" style:--cols={cols}>
  {#each tiles as t (t.key)}
    {@const up = open.includes(t.key) || matched.has(t.card.id)}
    <button class="tile" class:up class:matched={matched.has(t.card.id)} onclick={() => flip(t)} aria-label={up ? t.card.word : 'Karte'}>
      <div class="inner">
        <div class="back"><img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 10'%3E%3Ccircle cx='5' cy='5' r='3' fill='%23fff' opacity='.5'/%3E%3C/svg%3E" alt="" /></div>
        <div class="front"><CardImage card={t.card} /></div>
      </div>
    </button>
  {/each}
</div>

<style>
  .memory {
    display: grid;
    grid-template-columns: repeat(var(--cols), 1fr);
    gap: 2.5vmin;
    padding: 5rem 1rem 1rem;
    box-sizing: border-box;
    width: min(100%, calc(var(--cols) * 22vh));
    margin: 0 auto;
  }
  .tile { aspect-ratio: 1; border: none; background: none; padding: 0; perspective: 600px; }
  .inner { position: relative; width: 100%; height: 100%; transition: transform 0.35s; transform-style: preserve-3d; }
  .up .inner { transform: rotateY(180deg); }
  .back, .front {
    position: absolute; inset: 0; border-radius: 20px; backface-visibility: hidden;
    -webkit-backface-visibility: hidden; display: grid; place-items: center;
    box-shadow: 0 5px 0 var(--shadow);
  }
  .back { background: linear-gradient(135deg, #f6a04d, #f06292); }
  .back img { width: 40%; }
  .front { background: var(--card); transform: rotateY(180deg); padding: 10%; box-sizing: border-box; }
  .matched .front { outline: 5px solid var(--good); }
</style>
