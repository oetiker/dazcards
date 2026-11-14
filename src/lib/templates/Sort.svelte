<!-- Sort pictures into baskets by category; each basket shows an example picture. -->
<script lang="ts">
  import BinRounds from './BinRounds.svelte';
  import CardImage from '../components/CardImage.svelte';
  import { sortSetup, type BinRound } from '../rounds';
  import { sayCard, speak, wait } from '../audio';
  import type { Card } from '../types';
  import type { TemplateProps } from './types';

  let { game, deck, cards, onfinish }: TemplateProps = $props();
  // svelte-ignore state_referenced_locally
  const setup = sortSetup(cards, game.options.choices, game.options.rounds);
  const COLORS = ['#ffb74d', '#4fc3f7', '#aed581', '#f48fb1'];
  const say = (c: Card) => sayCard(c, deck.lang, true);

  // "der Hund … Tiere"
  async function afterCorrect(r: BinRound) {
    await say(r.card);
    await wait(200);
    await speak(setup.bins[r.bin].category, deck.lang);
  }
</script>

<BinRounds rounds={setup.rounds} binCount={setup.bins.length} colors={COLORS} {say} {afterCorrect} {onfinish}>
  {#snippet bin(i: number)}
    <div class="example"><CardImage card={setup.bins[i].example} /></div>
  {/snippet}
</BinRounds>

<style>
  .example { background: #fffd; border-radius: 50%; padding: 12%; }
</style>
