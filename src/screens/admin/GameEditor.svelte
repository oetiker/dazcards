<!-- Create a game: choose a template, a deck and a few options. -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { deleteGame, getGame, listCards, listDecks, putGame } from '../../lib/db';
  import { go } from '../../lib/app.svelte';
  import { templates, getTemplate } from '../../lib/templates';
  import { newId } from '../../lib/id';
  import type { Card, Deck, Game, Id } from '../../lib/types';

  let { gameId }: { gameId?: Id } = $props();
  let decks = $state<Deck[]>([]);
  let game = $state<Game | null>(null);
  let cards = $state<Card[]>([]);
  let isNew = $state(false);

  onMount(async () => {
    decks = (await listDecks()).sort((a, b) => a.name.localeCompare(b.name));
    const existing = gameId ? await getGame(gameId) : undefined;
    isNew = !existing;
    const t = templates[1];
    game = existing ?? {
      id: newId(),
      name: '',
      templateId: t.id,
      deckId: decks[0]?.id ?? '',
      options: { ...t.defaults },
      createdAt: Date.now(),
    };
  });

  $effect(() => {
    const id = game?.deckId;
    if (id) listCards(id).then((c) => (cards = c));
  });

  const template = $derived(game ? getTemplate(game.templateId) : undefined);
  const problem = $derived(template ? template.check(cards) : 'Vorlage wählen');

  function chooseTemplate(id: string) {
    if (!game) return;
    const t = getTemplate(id)!;
    game.templateId = id;
    game.options = { ...t.defaults };
  }

  async function save() {
    if (!game) return;
    const g = $state.snapshot(game) as Game;
    if (!g.name.trim()) {
      const deck = decks.find((d) => d.id === g.deckId);
      g.name = `${template?.name} – ${deck?.name ?? ''}`;
    }
    await putGame(g);
    go({ name: 'admin' });
  }

  async function remove() {
    if (game && confirm('Spiel löschen? Die Karten bleiben erhalten.')) {
      await deleteGame(game.id);
      go({ name: 'admin' });
    }
  }
</script>

<div class="screen admin">
  <header class="bar">
    <button onclick={() => go({ name: 'admin' })}>‹ Zurück</button>
    <h1>{isNew ? 'Neues Spiel' : 'Spiel bearbeiten'}</h1>
    <span></span>
  </header>
  {#if game}
    <main>
      <h2>1. Spielvorlage</h2>
      <div class="templates">
        {#each templates as t (t.id)}
          <button class="template" class:active={game.templateId === t.id} onclick={() => chooseTemplate(t.id)}>
            <img src={t.icon} alt="" />
            <strong>{t.name}</strong>
            <span>{t.description}</span>
          </button>
        {/each}
      </div>

      <h2>2. Kartenset</h2>
      <select bind:value={game.deckId}>
        {#each decks as d (d.id)}<option value={d.id}>{d.name}</option>{/each}
      </select>

      <h2>3. Einstellungen</h2>
      <div class="form">
        <label>Name (für Erwachsene) <input bind:value={game.name} placeholder="automatisch" /></label>
        {#if template?.uses.choices}
          <label>
            Bilder pro Runde: <strong>{game.options.choices}</strong>
            <input type="range" min="2" max="6" bind:value={game.options.choices} />
          </label>
        {/if}
        {#if template?.uses.rounds}
          <label>
            Runden: <strong>{game.options.rounds}</strong>
            <input type="range" min="3" max="20" bind:value={game.options.rounds} />
          </label>
        {/if}
      </div>

      {#if problem}<p class="warn">Mit diesem Kartenset nicht spielbar: {problem}</p>{/if}

      <div class="actions">
        {#if !isNew}<button class="danger" onclick={remove}>Löschen</button>{/if}
        <span class="spacer"></span>
        <button class="primary" disabled={!game.deckId} onclick={save}>Speichern</button>
      </div>
    </main>
  {/if}
</div>

<style>
  .templates { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 0.75rem; }
  .template {
    display: flex; flex-direction: column; align-items: flex-start; gap: 0.3rem; text-align: left;
    background: var(--card); border: 3px solid transparent; border-radius: 16px; padding: 0.9rem;
  }
  .template.active { border-color: var(--accent); }
  .template img { width: 48px; }
  .template span { font-size: 0.85rem; color: var(--muted); }
  .actions { display: flex; gap: 0.5rem; margin-top: 2rem; }
  .spacer { flex: 1; }
</style>
