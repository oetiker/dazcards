<script lang="ts">
  import { onMount } from 'svelte';
  import { getDeck, getGame, listCards, recordPlay } from '../lib/db';
  import { app, go } from '../lib/app.svelte';
  import { getTemplate } from '../lib/templates';
  import { stopAll } from '../lib/audio';
  import Celebration from '../lib/components/Celebration.svelte';
  import type { Card, Deck, Game, Id } from '../lib/types';
  import type { GameTemplate } from '../lib/templates/types';

  let { gameId }: { gameId: Id } = $props();
  let data = $state<{ game: Game; deck: Deck; cards: Card[]; template: GameTemplate } | null>(null);
  let finished = $state<number | null>(null);

  onMount(async () => {
    const game = await getGame(gameId);
    const deck = game && (await getDeck(game.deckId));
    const template = game && getTemplate(game.templateId);
    if (!game || !deck || !template) return go({ name: 'home' });
    data = { game, deck, cards: await listCards(deck.id), template };
  });

  async function onfinish(stars: number) {
    finished = stars;
    if (app.profile && data) await recordPlay(app.profile.id, data.game.id, stars);
  }

  function home() {
    stopAll();
    go({ name: 'home' });
  }
</script>

<div class="play">
  <button class="home" onclick={home} aria-label="Zurück">
    <svg viewBox="0 0 24 24"><path fill="currentColor" d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" /></svg>
  </button>
  {#if data}
    {@const T = data.template.component}
    <T game={data.game} deck={data.deck} cards={data.cards} {onfinish} />
  {/if}
  {#if finished !== null}
    <Celebration stars={finished} ondone={home} />
  {/if}
</div>

<style>
  .play { position: relative; height: 100%; }
  .home {
    position: absolute; top: 1rem; left: 1rem; z-index: 5;
    width: 60px; height: 60px; border-radius: 50%; border: none;
    background: var(--card); color: var(--accent); box-shadow: 0 4px 0 var(--shadow);
  }
  .home svg { width: 60%; }
</style>
