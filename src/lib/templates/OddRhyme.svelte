<!-- "Was reimt sich nicht?" – all pictures are named; the child taps the one that does not rhyme. -->
<script lang="ts">
  import ChoiceRounds from './ChoiceRounds.svelte';
  import { oddOneOutRounds, type Round } from '../rounds';
  import { rhymeKey } from '../rhyme';
  import { sayCard, wait } from '../audio';
  import type { TemplateProps } from './types';

  let { game, deck, cards, onfinish }: TemplateProps = $props();
  // svelte-ignore state_referenced_locally
  const rounds = oddOneOutRounds(cards, rhymeKey, game.options.choices, game.options.rounds);

  // Model the answer: "Haus – Maus … Ball".
  async function explain(r: Round) {
    for (const o of r.options.filter((o) => o.id !== r.answer.id)) {
      await sayCard(o, deck.lang);
      await wait(120);
    }
    await wait(300);
    await sayCard(r.answer, deck.lang);
  }
</script>

<ChoiceRounds {rounds} {deck} promptMode="none" introduce withArticle={false} {onfinish} afterCorrect={explain} />
