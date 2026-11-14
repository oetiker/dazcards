<!-- Modal editor for one card: picture, spoken word, optional grammar fields. -->
<script lang="ts">
  import { onDestroy } from 'svelte';
  import { deleteCard, deleteMedia, putCard, putMedia } from '../../lib/db';
  import { forgetMedia, mediaUrl, shrinkImage } from '../../lib/media';
  import { LIBRARY, libraryBlob, libraryUrl } from '../../lib/library';
  import { sayCard } from '../../lib/audio';
  import { suggestRhyme } from '../../lib/rhyme';
  import Recorder from '../../lib/components/Recorder.svelte';
  import type { Article, Card, Deck } from '../../lib/types';

  let {
    card,
    deck,
    isCover,
    onclose,
    onsetcover,
  }: {
    card: Card;
    deck: Deck;
    isCover: boolean;
    onclose: () => void;
    onsetcover: (c: Card) => void;
  } = $props();

  // svelte-ignore state_referenced_locally
  const original = $state.snapshot(card) as Card;
  let draft = $state<Card>({ ...original });
  let newImage = $state<Blob | null>(null);
  let newAudio = $state<Blob | null>(null);
  let removeAudio = $state(false);
  let imageUrl = $state<string | undefined>();
  let audioUrl = $state<string | undefined>();
  let showLibrary = $state(false);
  let saving = $state(false);
  const temp: string[] = [];

  mediaUrl(original.imageId).then((u) => (imageUrl ??= u));
  mediaUrl(original.audioId).then((u) => (audioUrl ??= u));
  onDestroy(() => temp.forEach((u) => URL.revokeObjectURL(u)));

  const tmpUrl = (b: Blob) => {
    const u = URL.createObjectURL(b);
    temp.push(u);
    return u;
  };

  function setImage(b: Blob) {
    newImage = b;
    imageUrl = tmpUrl(b);
  }

  async function onImageFile(e: Event) {
    const f = (e.currentTarget as HTMLInputElement).files?.[0];
    if (f) setImage(await shrinkImage(f));
  }

  async function pickLibrary(file: string) {
    setImage(await libraryBlob(file));
    showLibrary = false;
  }

  function setAudio(b: Blob) {
    newAudio = b;
    removeAudio = false;
    audioUrl = tmpUrl(b);
  }

  function onAudioFile(e: Event) {
    const f = (e.currentTarget as HTMLInputElement).files?.[0];
    if (f) setAudio(f);
  }

  function listen() {
    if (audioUrl && !removeAudio) new Audio(audioUrl).play();
    else sayCard({ ...draft, audioId: undefined }, deck.lang, true);
  }

  const rhymeSuggestion = $derived(suggestRhyme(draft.word));
  const canSave = $derived(draft.word.trim().length > 0 && (!!newImage || !!original.imageId));

  async function save() {
    saving = true;
    const c: Card = { ...$state.snapshot(draft), word: draft.word.trim() };
    if (newImage) {
      if (original.imageId && !isCover) {
        await deleteMedia(original.imageId);
        forgetMedia(original.imageId);
      }
      c.imageId = await putMedia('image', newImage);
    }
    if (newAudio || removeAudio) {
      if (original.audioId) {
        await deleteMedia(original.audioId);
        forgetMedia(original.audioId);
      }
      c.audioId = newAudio ? await putMedia('audio', newAudio) : undefined;
    }
    // Drop empty optional fields so exports stay tidy.
    for (const k of ['article', 'plural', 'category', 'rhyme'] as const) if (!c[k]) delete c[k];
    if (!c.syllables) delete c.syllables;
    await putCard(c);
    onclose();
  }

  async function remove() {
    if (!confirm(`Karte «${original.word}» löschen?`)) return;
    await deleteCard(original);
    onclose();
  }
</script>

<div class="backdrop">
  <div class="modal admin" role="dialog" aria-label="Karte bearbeiten">
    <h2>{original.word ? 'Karte bearbeiten' : 'Neue Karte'}</h2>

    <div class="media">
      <div class="preview">
        {#if imageUrl}<img src={imageUrl} alt="" />{:else}<span>Kein Bild</span>{/if}
      </div>
      <div class="buttons">
        <label class="button">
          Foto / Bild wählen
          <input type="file" accept="image/*" hidden onchange={onImageFile} />
        </label>
        <button type="button" onclick={() => (showLibrary = !showLibrary)}>Aus Bibliothek</button>
        {#if original.imageId && !newImage}
          <button type="button" disabled={isCover} onclick={() => onsetcover(original)}>
            {isCover ? 'Ist Titelbild' : 'Als Titelbild'}
          </button>
        {/if}
      </div>
    </div>
    {#if showLibrary}
      <div class="library">
        {#each LIBRARY as img}
          <button type="button" onclick={() => pickLibrary(img.file)}><img src={libraryUrl(img.file)} alt={img.label} /></button>
        {/each}
      </div>
    {/if}

    <div class="form">
      <label>Wort <input bind:value={draft.word} placeholder="z. B. Hund" /></label>
      <div class="audio">
        <span>Ton:</span>
        <button type="button" onclick={listen}>▶ Anhören</button>
        <Recorder onrecorded={setAudio} />
        <label class="button">
          Datei…
          <input type="file" accept="audio/*" hidden onchange={onAudioFile} />
        </label>
        {#if (original.audioId || newAudio) && !removeAudio}
          <button type="button" onclick={() => { removeAudio = true; newAudio = null; audioUrl = undefined; }}>Aufnahme entfernen</button>
        {:else}
          <small>Ohne Aufnahme wird die Sprachausgabe des Geräts verwendet.</small>
        {/if}
      </div>

      <details open={!!(original.article || original.plural || original.category || original.rhyme || original.syllables)}>
        <summary>Grammatik &amp; Laute (optional)</summary>
        <div class="grid2">
          <label>
            Artikel
            <select bind:value={draft.article}>
              <option value={undefined}>–</option>
              {#each ['der', 'die', 'das'] as a}<option value={a as Article}>{a}</option>{/each}
            </select>
          </label>
          <label>Mehrzahl <input bind:value={draft.plural} placeholder="z. B. Hunde" /></label>
          <label>Kategorie <input bind:value={draft.category} placeholder="z. B. Tiere" /></label>
          <label>
            Reim
            <input bind:value={draft.rhyme} placeholder={rhymeSuggestion ? `automatisch: ${rhymeSuggestion}` : ''} />
          </label>
          <label>Silben <input type="number" min="1" max="8" bind:value={draft.syllables} /></label>
        </div>
      </details>
    </div>

    <div class="actions">
      {#if original.word}<button type="button" class="danger" onclick={remove}>Löschen</button>{/if}
      <span class="spacer"></span>
      <button type="button" onclick={onclose}>Abbrechen</button>
      <button type="button" class="primary" disabled={!canSave || saving} onclick={save}>Speichern</button>
    </div>
  </div>
</div>

<style>
  .backdrop {
    position: fixed; inset: 0; background: #0006; display: grid; place-items: center; z-index: 20;
    padding: 1rem;
  }
  .modal {
    background: var(--bg); border-radius: 20px; padding: 1.25rem; width: min(640px, 100%);
    max-height: 100%; overflow-y: auto; box-sizing: border-box;
  }
  .media { display: flex; gap: 1rem; align-items: center; flex-wrap: wrap; }
  .preview {
    width: 140px; height: 140px; background: var(--card); border-radius: 16px;
    display: grid; place-items: center; color: var(--muted);
  }
  .preview img { max-width: 85%; max-height: 85%; }
  .buttons { display: flex; flex-direction: column; gap: 0.5rem; }
  .library {
    display: grid; grid-template-columns: repeat(auto-fill, minmax(56px, 1fr)); gap: 0.4rem;
    margin: 0.75rem 0; padding: 0.5rem; background: var(--card); border-radius: 12px;
  }
  .library button { padding: 4px; background: none; border: none; }
  .library img { width: 100%; }
  .audio { display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap; }
  .grid2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 0.75rem; margin-top: 0.75rem; }
  .actions { display: flex; gap: 0.5rem; margin-top: 1.25rem; }
  .spacer { flex: 1; }
</style>
