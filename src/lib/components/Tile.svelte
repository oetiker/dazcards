<!-- A big tappable picture card with positive-only feedback states. -->
<script lang="ts">
  import { asset } from '../asset';
  import CardImage from './CardImage.svelte';
  import type { Card } from '../types';

  let {
    card,
    state = 'idle',
    onclick,
  }: { card: Card; state?: 'idle' | 'correct' | 'nudge' | 'dim' | 'active'; onclick?: () => void } = $props();
</script>

<button class="tile {state}" {onclick} aria-label={card.word}>
  <CardImage {card} />
  {#if state === 'correct'}<img class="star" src={asset('star.svg')} alt="" />{/if}
</button>

<style>
  .tile {
    position: relative;
    background: var(--card);
    border: none;
    border-radius: 28px;
    padding: 8%;
    box-shadow: 0 6px 0 var(--shadow);
    cursor: pointer;
    transition: transform 0.15s, opacity 0.3s;
    width: 100%;
    aspect-ratio: 1;
    touch-action: manipulation;
  }
  .tile:active {
    transform: translateY(4px);
    box-shadow: 0 2px 0 var(--shadow);
  }
  .correct {
    animation: pop 0.5s ease;
    outline: 6px solid var(--good);
  }
  /* A gentle wiggle instead of an error signal. */
  .nudge {
    animation: wiggle 0.4s ease;
  }
  .dim {
    opacity: 0.35;
  }
  .active {
    transform: scale(1.06);
    outline: 6px solid var(--accent);
  }
  .star {
    position: absolute;
    top: -14px;
    right: -14px;
    width: 30%;
    animation: pop 0.5s ease;
  }
  @keyframes pop {
    0% { transform: scale(1); }
    50% { transform: scale(1.12); }
    100% { transform: scale(1); }
  }
  @keyframes wiggle {
    0%, 100% { transform: rotate(0); }
    25% { transform: rotate(-4deg); }
    75% { transform: rotate(4deg); }
  }
</style>
