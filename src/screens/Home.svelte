<!-- Game selection for the current child: big picture buttons, no text needed. -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { listDecks, listGames, listPlays, listCards } from '../lib/db';
  import { app, go } from '../lib/app.svelte';
  import { getTemplate } from '../lib/templates';
  import { mediaUrl } from '../lib/media';
  import ParentGate from '../lib/components/ParentGate.svelte';
  import type { Game } from '../lib/types';

  interface Entry { game: Game; cover?: string; icon: string; color: string; }
  let entries = $state<Entry[]>([]);
  let stars = $state(0);

  onMount(async () => {
    const decks = new Map((await listDecks()).map((d) => [d.id, d]));
    const games = (await listGames()).sort((a, b) => a.createdAt - b.createdAt);
    const out: Entry[] = [];
    for (const game of games) {
      const t = getTemplate(game.templateId);
      const deck = decks.get(game.deckId);
      if (!t || !deck) continue;
      if (t.check(await listCards(deck.id))) continue; // hide games that cannot be played
      out.push({ game, icon: t.icon, color: t.color, cover: await mediaUrl(deck.coverImageId) });
    }
    entries = out;
    if (app.profile) stars = (await listPlays(app.profile.id)).reduce((s, p) => s + p.stars, 0);
  });
</script>

<div class="screen">
  <header>
    <button class="me" style:--c={app.profile?.color} onclick={() => go({ name: 'profiles' })} aria-label="Kind wechseln">
      <img src="/avatars/{app.profile?.avatar}" alt="" />
    </button>
    <div class="stars" aria-label="{stars} Sterne">
      <img src="/star.svg" alt="" /> <span>{stars}</span>
    </div>
    <ParentGate onunlock={() => go({ name: 'admin' })} />
  </header>
  <div class="grid">
    {#each entries as e (e.game.id)}
      <button
        class="game"
        style:--c={e.color}
        onclick={() => go({ name: 'play', gameId: e.game.id })}
        aria-label={e.game.name}
      >
        <img class="icon" src={e.icon} alt="" />
        {#if e.cover}<img class="deck" src={e.cover} alt="" />{/if}
      </button>
    {/each}
  </div>
</div>

<style>
  header { display: flex; justify-content: space-between; align-items: center; padding: 1rem; }
  .me {
    width: 72px; height: 72px; border-radius: 50%; border: none; background: var(--c); padding: 10px;
  }
  .me img { width: 100%; }
  .stars { display: flex; align-items: center; gap: 0.4rem; font-size: 2rem; font-weight: 800; }
  .stars img { width: 44px; }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(200px, 42vw), 1fr));
    gap: 4vmin;
    padding: 2vmin 4vmin 4vmin;
  }
  .game {
    position: relative;
    aspect-ratio: 1;
    border: none;
    border-radius: 32px;
    background: var(--c);
    box-shadow: 0 8px 0 color-mix(in srgb, var(--c) 65%, black);
    padding: 16%;
    cursor: pointer;
  }
  .game:active { transform: translateY(5px); box-shadow: 0 3px 0 color-mix(in srgb, var(--c) 65%, black); }
  .icon { width: 100%; height: 100%; object-fit: contain; }
  /* Which card set this game uses. */
  .deck {
    position: absolute; right: 5%; bottom: 5%; width: 36%; aspect-ratio: 1; object-fit: contain;
    background: var(--card); border-radius: 50%; padding: 6%; box-sizing: border-box;
    box-shadow: 0 2px 6px #0003;
  }
</style>
