<!-- Wo ist es? Hear "Der Ball ist unter dem Tisch." and tap the matching scene. -->
<script lang="ts">
  import VariantRounds from './VariantRounds.svelte';
  import PrepositionScene from '../components/PrepositionScene.svelte';
  import { PREPOSITIONS, prepositionPhrase, type Preposition } from '../phrases';
  import { variantRounds, withImage } from '../rounds';
  import { sayPhrase } from '../audio';
  import type { Card } from '../types';
  import type { TemplateProps } from './types';

  let { game, deck, cards, onfinish }: TemplateProps = $props();
  const preps = PREPOSITIONS.map((p) => p.id);
  // svelte-ignore state_referenced_locally
  const rounds = variantRounds(withImage(cards).filter((c) => c.article), preps, game.options.choices, game.options.rounds);

  function say(card: Card, prep: Preposition) {
    const p = prepositionPhrase(card, prep);
    return sayPhrase(card, p.before, p.after, deck.lang);
  }
</script>

<VariantRounds {rounds} {say} {onfinish}>
  {#snippet option(card: Card, prep: Preposition)}
    <PrepositionScene {card} {prep} />
  {/snippet}
</VariantRounds>
