<!-- "Was fängt gleich an?" – find the picture that starts with the same sound (Anlaut). -->
<script lang="ts">
  import ChoiceRounds from './ChoiceRounds.svelte';
  import { sameGroupRounds, type Round } from '../rounds';
  import { onsetKey } from '../phonology';
  import { sayCard, wait } from '../audio';
  import type { TemplateProps } from './types';

  let { game, deck, cards, onfinish }: TemplateProps = $props();
  // svelte-ignore state_referenced_locally
  const rounds = sameGroupRounds(cards, onsetKey, game.options.choices, game.options.rounds);

  async function sayPair(r: Round) {
    await sayCard(r.prompt, deck.lang);
    await wait(150);
    await sayCard(r.answer, deck.lang);
  }
</script>

<ChoiceRounds {rounds} {deck} promptMode="card" withArticle={false} {onfinish} afterCorrect={sayPair} />
