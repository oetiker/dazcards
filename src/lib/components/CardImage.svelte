<script lang="ts">
  import { mediaUrl } from '../media';
  import type { Card } from '../types';

  let { card, size = '100%' }: { card: Card; size?: string } = $props();
  let url = $state<string | undefined>();

  $effect(() => {
    let alive = true;
    mediaUrl(card.imageId).then((u) => alive && (url = u));
    return () => (alive = false);
  });
</script>

<div class="img" style:width={size} style:height={size}>
  {#if url}
    <img src={url} alt={card.word} draggable="false" />
  {:else}
    <span class="placeholder">{card.word.slice(0, 1).toUpperCase()}</span>
  {/if}
</div>

<style>
  .img {
    display: grid;
    place-items: center;
    aspect-ratio: 1;
  }
  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    pointer-events: none;
  }
  .placeholder {
    font-size: 3rem;
    font-weight: 700;
    color: var(--muted);
  }
</style>
