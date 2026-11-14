<!--
  Eins oder viele? Hear "der Hund" or "die Hunde" and tap one dog or many dogs.
-->
<script lang="ts">
  import { onMount } from 'svelte';
  import CardImage from '../components/CardImage.svelte';
  import Progress from '../components/Progress.svelte';
  import SpeakButton from '../components/SpeakButton.svelte';
  import { chime, praise, sayPlural, sayWithArticle, stopAll, wait } from '../audio';
  import { pluralRounds } from '../rounds';
  import type { TemplateProps } from './types';

  let { game, deck, cards, onfinish }: TemplateProps = $props();
  // svelte-ignore state_referenced_locally
  const rounds = pluralRounds(cards, game.options.rounds);
  let index = $state(0);
  let fb = $state<{ side: 'one' | 'many'; kind: 'correct' | 'nudge' } | null>(null);
  let busy = false;
  const round = $derived(rounds[index]);

  const sayOne = () => sayWithArticle(round.card, deck.lang);
  const sayMany = () => sayPlural(round.card, deck.lang);
  const ask = () => (round.plural ? sayMany() : sayOne());

  onMount(() => {
    setTimeout(ask, 400);
    return stopAll;
  });

  async function tap(side: 'one' | 'many') {
    if (busy) return;
    busy = true;
    const right = (side === 'many') === round.plural;
    fb = { side, kind: right ? 'correct' : 'nudge' };
    if (right) {
      chime();
      await ask();
      await praise();
      fb = null;
      if (index + 1 >= rounds.length) return onfinish(3);
      index += 1;
      await wait(300);
      busy = false;
      ask();
    } else {
      // Name what was tapped, then repeat the question.
      await (side === 'many' ? sayMany() : sayOne());
      fb = null;
      await wait(250);
      await ask();
      busy = false;
    }
  }
</script>

{#if round}
  <div class="game">
    <Progress done={index} total={rounds.length} />
    <SpeakButton big onclick={ask} />
    <div class="sides">
      {#key index}
        <button
          class="side"
          class:correct={fb?.side === 'one' && fb.kind === 'correct'}
          class:nudge={fb?.side === 'one' && fb.kind === 'nudge'}
          onclick={() => tap('one')}
          aria-label="eins"
        >
          <div class="one"><CardImage card={round.card} /></div>
        </button>
        <button
          class="side"
          class:correct={fb?.side === 'many' && fb.kind === 'correct'}
          class:nudge={fb?.side === 'many' && fb.kind === 'nudge'}
          onclick={() => tap('many')}
          aria-label="viele"
        >
          <div class="many">
            {#each [0, 1, 2] as i}<div class="m m{i}"><CardImage card={round.card} /></div>{/each}
          </div>
        </button>
      {/key}
    </div>
  </div>
{/if}

<style>
  .game { display: flex; flex-direction: column; align-items: center; gap: 2vh; height: 100%; padding: 1rem; box-sizing: border-box; }
  .sides { display: grid; grid-template-columns: 1fr 1fr; gap: 4vmin; width: min(100%, 76vh); margin: auto 0; }
  .side {
    aspect-ratio: 1; background: var(--card); border: none; border-radius: 28px;
    box-shadow: 0 6px 0 var(--shadow); padding: 8%; display: grid; place-items: center;
  }
  .side:active { transform: translateY(4px); }
  .one { width: 62%; }
  .many { position: relative; width: 100%; height: 100%; }
  .m { position: absolute; width: 50%; }
  .m0 { left: 0; top: 4%; }
  .m1 { right: 0; top: 14%; }
  .m2 { left: 25%; bottom: 0; }
  .correct { outline: 6px solid var(--good); animation: pop 0.5s ease; }
  .nudge { animation: wiggle 0.4s ease; }
  @keyframes pop { 50% { transform: scale(1.06); } }
  @keyframes wiggle { 25% { transform: rotate(-3deg); } 75% { transform: rotate(3deg); } }
</style>
