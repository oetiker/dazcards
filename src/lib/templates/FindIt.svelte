<script lang="ts">
  import ChoiceRounds from './ChoiceRounds.svelte';
  import { findItRounds } from '../rounds';
  import type { TemplateProps } from './types';

  let { game, deck, cards, onfinish }: TemplateProps = $props();
  // Rounds are generated once when the game starts.
  // svelte-ignore state_referenced_locally
  const rounds = findItRounds(cards, game.options.choices, game.options.rounds);
</script>

<ChoiceRounds {rounds} {deck} showPrompt={false} {onfinish} />
