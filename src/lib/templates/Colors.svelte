<!-- Farben: hear "der rote Ball" and tap the red ball among the same picture in other colours. -->
<script lang="ts">
  import VariantRounds from './VariantRounds.svelte';
  import TintedImage from '../components/TintedImage.svelte';
  import { COLOURS, colourPhrase, type Colour } from '../phrases';
  import { variantRounds, withImage } from '../rounds';
  import { sayPhrase } from '../audio';
  import type { Card } from '../types';
  import type { TemplateProps } from './types';

  let { game, deck, cards, onfinish }: TemplateProps = $props();
  // svelte-ignore state_referenced_locally
  const rounds = variantRounds(withImage(cards).filter((c) => c.article), COLOURS, game.options.choices, game.options.rounds);

  function say(card: Card, colour: Colour) {
    const p = colourPhrase(card, colour);
    return sayPhrase(card, p.before, p.after, deck.lang);
  }
</script>

<VariantRounds {rounds} {say} {onfinish}>
  {#snippet option(card: Card, colour: Colour)}
    <TintedImage {card} hex={colour.hex} />
  {/snippet}
</VariantRounds>
