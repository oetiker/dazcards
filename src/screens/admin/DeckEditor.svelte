<script lang="ts">
  import { onMount } from 'svelte';
  import { deleteDeck, getDeck, listCards, putDeck } from '../../lib/db';
  import { go } from '../../lib/app.svelte';
  import { buildExport, saveTextFile } from '../../lib/exchange';
  import { newId } from '../../lib/id';
  import CardImage from '../../lib/components/CardImage.svelte';
  import CardEditor from './CardEditor.svelte';
  import type { Card, Deck, Id } from '../../lib/types';

  let { deckId }: { deckId: Id } = $props();
  let deck = $state<Deck | null>(null);
  let cards = $state<Card[]>([]);
  let editing = $state<Card | null>(null);

  async function load() {
    deck = (await getDeck(deckId)) ?? null;
    cards = (await listCards(deckId)).sort((a, b) => a.word.localeCompare(b.word));
  }
  onMount(load);

  async function save() {
    if (deck) await putDeck($state.snapshot(deck));
  }

  async function remove() {
    if (!deck || !confirm(`Kartenset «${deck.name}» mit allen Karten und Spielen löschen?`)) return;
    await deleteDeck(deck.id);
    go({ name: 'admin' });
  }

  async function exportDeck() {
    if (!deck) return;
    const data = await buildExport({ deckIds: [deck.id] });
    await saveTextFile(`${deck.name.replace(/[^\p{L}\p{N}]+/gu, '-')}.json`, JSON.stringify(data));
  }

  function setCover(card: Card) {
    if (!deck || !card.imageId) return;
    deck.coverImageId = card.imageId;
    save();
  }
</script>

{#if deck}
  <div class="screen admin">
    <header class="bar">
      <button onclick={() => go({ name: 'admin' })}>‹ Zurück</button>
      <h1>{deck.name}</h1>
      <span></span>
    </header>
    <main>
      <div class="form">
        <label>Name <input bind:value={deck.name} onchange={save} /></label>
        <label>
          Sprache
          <select bind:value={deck.lang} onchange={save}>
            <option value="de-CH">Deutsch (Schweiz)</option>
            <option value="de-DE">Deutsch (Deutschland)</option>
            <option value="de-AT">Deutsch (Österreich)</option>
          </select>
        </label>
      </div>

      <h2>Karten ({cards.length})</h2>
      <div class="cards">
        {#each cards as c (c.id)}
          <button class="card" class:cover={c.imageId && c.imageId === deck.coverImageId} onclick={() => (editing = c)}>
            <CardImage card={c} />
            <span>{c.article ? c.article + ' ' : ''}{c.word}</span>
            {#if !c.audioId}<small title="Keine Aufnahme – Sprachausgabe wird verwendet">TTS</small>{/if}
          </button>
        {/each}
        <button class="card add" onclick={() => (editing = { id: newId(), deckId, word: '' })}>+</button>
      </div>

      <div class="actions">
        <button onclick={exportDeck}>Dieses Kartenset exportieren</button>
        <button class="danger" onclick={remove}>Kartenset löschen</button>
      </div>
    </main>
  </div>

  {#if editing}
    <CardEditor
      card={editing}
      {deck}
      isCover={!!editing.imageId && editing.imageId === deck.coverImageId}
      onsetcover={setCover}
      onclose={async () => {
        editing = null;
        await load();
      }}
    />
  {/if}
{/if}

<style>
  .cards {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 0.75rem;
  }
  .card {
    position: relative;
    background: var(--card);
    border: 2px solid transparent;
    border-radius: 16px;
    padding: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    align-items: center;
    cursor: pointer;
  }
  .card.cover { border-color: var(--accent); }
  .card small {
    position: absolute; top: 6px; right: 6px; font-size: 0.65rem;
    background: var(--card-alt); border-radius: 6px; padding: 1px 4px; color: var(--muted);
  }
  .add { font-size: 3rem; color: var(--muted); justify-content: center; min-height: 140px; }
  .actions { display: flex; gap: 1rem; margin-top: 2rem; flex-wrap: wrap; }
</style>
