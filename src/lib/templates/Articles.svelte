<!--
  Der/Die/Das: hear "der Hund" and tap the blue house. Colours follow the
  common DaZ convention: der = blue, die = red, das = green.
-->
<script lang="ts">
  import BinRounds from './BinRounds.svelte';
  import { ARTICLES, articleRounds } from '../rounds';
  import { sayWithArticle } from '../audio';
  import type { Card } from '../types';
  import type { TemplateProps } from './types';

  let { game, deck, cards, onfinish }: TemplateProps = $props();
  // svelte-ignore state_referenced_locally
  const rounds = articleRounds(cards, game.options.rounds);
  const COLORS = ['#4f8ff7', '#ef5350', '#43b049'];
  const say = (c: Card) => sayWithArticle(c, deck.lang);
</script>

<BinRounds {rounds} binCount={3} colors={COLORS} {say} {onfinish}>
  {#snippet bin(i: number)}
    <svg viewBox="0 0 100 90" aria-label={ARTICLES[i]}>
      <path d="M50 4 L96 44 H84 V86 H16 V44 H4 Z" fill="#fff" opacity="0.9" />
      <rect x="40" y="56" width="20" height="30" rx="3" fill={COLORS[i]} />
      <text x="50" y="44" text-anchor="middle" font-size="18" font-weight="700" fill={COLORS[i]}>{ARTICLES[i]}</text>
    </svg>
  {/snippet}
</BinRounds>
