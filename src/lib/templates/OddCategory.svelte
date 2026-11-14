<!-- "Was gehört nicht dazu?" – three animals and a ball: tap the one that does not belong. -->
<script lang="ts">
  import ChoiceRounds from './ChoiceRounds.svelte';
  import { oddOneOutRounds } from '../rounds';
  import type { TemplateProps } from './types';

  let { game, deck, cards, onfinish }: TemplateProps = $props();
  // svelte-ignore state_referenced_locally
  const rounds = oddOneOutRounds(cards, (c) => c.category?.trim() || undefined, game.options.choices, game.options.rounds);
</script>

<ChoiceRounds {rounds} {deck} promptMode="none" introduce {onfinish} />
