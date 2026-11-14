<script lang="ts">
  import { asset } from '../../lib/asset';
  import { onMount } from 'svelte';
  import { listDecks, listGames, listProfiles, putDeck, listCards } from '../../lib/db';
  import { go } from '../../lib/app.svelte';
  import { getTemplate, templates } from '../../lib/templates';
  const templateCount = templates.length;
  import { buildExport, importData, saveTextFile } from '../../lib/exchange';
  import { newId } from '../../lib/id';
  import SoundTest from './SoundTest.svelte';
  import SilentModeHint from '../../lib/components/SilentModeHint.svelte';
  import { checkForUpdate, pwa } from '../../pwa.svelte';
  import { isTauri } from '@tauri-apps/api/core';
  const version = __APP_VERSION__;
  import type { Deck, Game, Profile } from '../../lib/types';

  type Tab = 'games' | 'decks' | 'profiles' | 'data' | 'sound';
  let tab = $state<Tab>((sessionStorage.getItem('adminTab') as Tab) || 'games');
  $effect(() => sessionStorage.setItem('adminTab', tab));

  let decks = $state<Deck[]>([]);
  let games = $state<(Game & { problem: string | null })[]>([]);
  let profiles = $state<Profile[]>([]);
  let counts = $state<Record<string, number>>({});
  let message = $state('');
  let includeProfiles = $state(false);

  async function load() {
    decks = (await listDecks()).sort((a, b) => a.name.localeCompare(b.name));
    const c: Record<string, number> = {};
    const cardsByDeck = new Map<string, Awaited<ReturnType<typeof listCards>>>();
    for (const d of decks) {
      const cards = await listCards(d.id);
      cardsByDeck.set(d.id, cards);
      c[d.id] = cards.length;
    }
    counts = c;
    games = (await listGames())
      .sort((a, b) => a.createdAt - b.createdAt)
      .map((g) => {
        const t = getTemplate(g.templateId);
        return { ...g, problem: t ? t.check(cardsByDeck.get(g.deckId) ?? []) : 'Unbekannte Spielvorlage' };
      });
    profiles = (await listProfiles()).sort((a, b) => a.createdAt - b.createdAt);
  }
  onMount(load);

  async function newDeck() {
    const deck: Deck = { id: newId(), name: 'Neues Kartenset', lang: 'de-CH', createdAt: Date.now() };
    await putDeck(deck);
    go({ name: 'deck', deckId: deck.id });
  }

  async function doExport() {
    const data = await buildExport({ includeProfiles });
    const stamp = new Date().toISOString().slice(0, 10);
    if (await saveTextFile(`dazcards-${stamp}.json`, JSON.stringify(data))) message = 'Export gespeichert.';
  }

  async function doImport(e: Event) {
    const file = (e.currentTarget as HTMLInputElement).files?.[0];
    if (!file) return;
    try {
      const r = await importData(await file.text());
      message = `Importiert: ${r.decks} Kartensets, ${r.cards} Karten, ${r.games} Spiele, ${r.profiles} Profile.`;
      await load();
    } catch (err) {
      message = `Import fehlgeschlagen: ${(err as Error).message}`;
    }
  }
</script>

<div class="screen admin">
  <header class="bar">
    <h1>Erwachsenenbereich</h1>
    <button onclick={() => go({ name: 'profiles' })}>Fertig</button>
  </header>
  <SilentModeHint />
  <nav class="tabs">
    <button class:active={tab === 'games'} onclick={() => (tab = 'games')}>Spiele</button>
    <button class:active={tab === 'decks'} onclick={() => (tab = 'decks')}>Kartensets</button>
    <button class:active={tab === 'profiles'} onclick={() => (tab = 'profiles')}>Kinder</button>
    <button class:active={tab === 'data'} onclick={() => (tab = 'data')}>Daten</button>
    <button class:active={tab === 'sound'} onclick={() => (tab = 'sound')}>Ton</button>
  </nav>

  <main>
    {#if tab === 'games'}
      <p class="help">Ein Spiel ist eine Spielvorlage angewendet auf ein Kartenset. Kinder sehen alle spielbaren Spiele.</p>
      <ul class="list">
        {#each games as g (g.id)}
          <li>
            <button class="row" onclick={() => go({ name: 'game-edit', gameId: g.id })}>
              <strong>{g.name}</strong>
              <span>{getTemplate(g.templateId)?.name} · {decks.find((d) => d.id === g.deckId)?.name ?? '?'}</span>
              {#if g.problem}<span class="warn">Nicht spielbar: {g.problem}</span>{/if}
            </button>
          </li>
        {/each}
      </ul>
      <button class="primary" onclick={() => go({ name: 'game-edit' })}>+ Neues Spiel</button>
    {:else if tab === 'decks'}
      <ul class="list">
        {#each decks as d (d.id)}
          <li>
            <button class="row" onclick={() => go({ name: 'deck', deckId: d.id })}>
              <strong>{d.name}</strong>
              <span>{counts[d.id] ?? 0} Karten · {d.lang}</span>
            </button>
          </li>
        {/each}
      </ul>
      <button class="primary" onclick={newDeck}>+ Neues Kartenset</button>
    {:else if tab === 'profiles'}
      <ul class="list">
        {#each profiles as p (p.id)}
          <li>
            <button class="row with-avatar" onclick={() => go({ name: 'profile-edit', profileId: p.id })}>
              <img src={asset(`avatars/${p.avatar}`)} alt="" style:background={p.color} />
              <strong>{p.name}</strong>
            </button>
          </li>
        {/each}
      </ul>
      <button class="primary" onclick={() => go({ name: 'profile-edit' })}>+ Neues Kind</button>
    {:else if tab === 'sound'}
      <SoundTest />
    {:else}
      <section>
        <h2>Exportieren</h2>
        <p class="help">Alle Kartensets und Spiele (inkl. Bilder und Aufnahmen) in eine JSON-Datei speichern – z. B. um sie von der Schule nach Hause mitzugeben.</p>
        <label class="check"><input type="checkbox" bind:checked={includeProfiles} /> Kinderprofile und Sterne mitexportieren</label>
        <button class="primary" onclick={doExport}>Export speichern</button>
      </section>
      <section>
        <h2>Importieren</h2>
        <p class="help">Bestehende Einträge mit gleicher Kennung werden ersetzt, alles andere bleibt erhalten.</p>
        <input type="file" accept="application/json,.json" onchange={doImport} />
      </section>
      {#if message}<p class="message">{message}</p>{/if}
      <section>
        <h2>Version</h2>
        <p class="help">{version} · {templateCount} Spielvorlagen</p>
        {#if !isTauri()}
          <button onclick={checkForUpdate} disabled={pwa.checking}>
            {pwa.checking ? 'Suche …' : 'Nach Update suchen'}
          </button>
          {#if pwa.updateReady}
            <p class="help">Neue Version geladen – sie wird beim Verlassen dieser Seite aktiviert.</p>
          {:else if pwa.lastCheck}
            <p class="help">Aktuell (geprüft {pwa.lastCheck}).</p>
          {/if}
        {/if}
      </section>
    {/if}
  </main>
</div>
