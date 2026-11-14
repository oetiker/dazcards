<!--
  A small scene with a table and a box; the card picture is placed according
  to a preposition. Every scene has the same furniture, so only the position
  (and the spoken words) tell them apart. Depth is shown by size and by which
  layer covers which: behind -> table -> box back -> inside -> box front -> in front.
-->
<script lang="ts">
  import { mediaUrl } from '../media';
  import type { Preposition } from '../phrases';
  import type { Card } from '../types';

  let { card, prep }: { card: Card; prep: Preposition } = $props();
  let url = $state<string | undefined>();
  $effect(() => {
    let alive = true;
    mediaUrl(card.imageId).then((u) => alive && (url = u));
    return () => (alive = false);
  });

  type Layer = 'behind' | 'inside' | 'front';
  const PLACES: Record<Preposition, { x: number; y: number; s: number; layer: Layer }> = {
    auf: { x: 82, y: 18, s: 72, layer: 'front' }, // sits on the table top (y = 90)
    unter: { x: 90, y: 146, s: 54, layer: 'behind' }, // between the legs, on the floor
    neben: { x: 2, y: 144, s: 56, layer: 'front' }, // left of the table, on the floor
    vor: { x: 67, y: 106, s: 100, layer: 'front' }, // big (close) and covering the table
    hinter: { x: 87, y: 60, s: 62, layer: 'behind' }, // only the top peeks over the table
    in: { x: 184, y: 116, s: 50, layer: 'inside' }, // in the box, lower part hidden
  };
  const p = $derived(PLACES[prep]);
</script>

{#snippet object()}
  {#if url}
    <image href={url} x={p.x} y={p.y} width={p.s} height={p.s} preserveAspectRatio="xMidYMax meet" />
  {/if}
{/snippet}

<svg viewBox="0 0 240 220" role="img" aria-label={prep}>
  <!-- floor -->
  <rect x="0" y="200" width="240" height="20" fill="#ead9bd" />
  <line x1="0" y1="200" x2="240" y2="200" stroke="#d2bb94" stroke-width="2" />

  {#if p.layer === 'behind'}{@render object()}{/if}

  <!-- table -->
  <rect x="74" y="116" width="10" height="84" rx="2" fill="#8d5f36" />
  <rect x="156" y="116" width="10" height="84" rx="2" fill="#8d5f36" />
  <rect x="68" y="100" width="104" height="18" rx="2" fill="#9c6a3d" />
  <rect x="62" y="90" width="116" height="12" rx="4" fill="#b98250" />

  <!-- box: back wall -->
  <path d="M182 158 L188 142 H232 L238 158 Z" fill="#b48a52" />

  {#if p.layer === 'inside'}{@render object()}{/if}

  <!-- box: front wall -->
  <rect x="180" y="156" width="58" height="44" rx="3" fill="#d9b277" stroke="#b48a52" stroke-width="2" />
  <line x1="180" y1="170" x2="238" y2="170" stroke="#c9a064" stroke-width="2" />

  {#if p.layer === 'front'}{@render object()}{/if}
</svg>

<style>
  svg { width: 100%; height: 100%; display: block; }
</style>
