<script lang="ts">
  import ChoiceRounds from './ChoiceRounds.svelte';
  import { rhymeRounds, type Round } from '../rounds';
  import { sayCard } from '../audio';
  import type { TemplateProps } from './types';

  let { game, deck, cards, onfinish }: TemplateProps = $props();
  // Rounds are generated once when the game starts.
  // svelte-ignore state_referenced_locally
  const rounds = rhymeRounds(cards, game.options.choices, game.options.rounds);

  // After a correct answer, say the rhyming pair: "Haus – Maus".
  async function sayPair(r: Round) {
    await sayCard(r.prompt, deck.lang);
    await new Promise((res) => setTimeout(res, 150));
    await sayCard(r.answer, deck.lang);
  }
</script>

<ChoiceRounds {rounds} {deck} showPrompt={true} {onfinish} afterCorrect={sayPair} />
