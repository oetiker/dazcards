<script lang="ts">
  import { asset } from '../../lib/asset';
  import { onMount } from 'svelte';
  import { deleteProfile, listPlays, listProfiles, putProfile } from '../../lib/db';
  import { app, go } from '../../lib/app.svelte';
  import { newId } from '../../lib/id';
  import type { Id, Profile } from '../../lib/types';

  let { profileId }: { profileId?: Id } = $props();

  const AVATARS = ['1f981', '1f43c', '1f438', '1f984', '1f425', '1f42f', '1f428', '1f419', '1f996', '1f98a', '1f427', '1f41d'];
  const COLORS = ['#ff8a65', '#4fc3f7', '#81c784', '#ba68c8', '#ffd54f', '#f06292', '#4db6ac', '#9575cd'];

  let profile = $state<Profile | null>(null);
  let stars = $state(0);
  let plays = $state(0);

  onMount(async () => {
    const all = await listProfiles();
    const existing = all.find((p) => p.id === profileId);
    const used = new Set(all.map((p) => p.avatar));
    profile = existing ?? {
      id: newId(),
      name: '',
      avatar: (AVATARS.find((a) => !used.has(`${a}.svg`)) ?? AVATARS[0]) + '.svg',
      color: COLORS[all.length % COLORS.length],
      createdAt: Date.now(),
    };
    if (existing) {
      const ps = await listPlays(existing.id);
      plays = ps.length;
      stars = ps.reduce((s, p) => s + p.stars, 0);
    }
  });

  async function save() {
    if (!profile) return;
    await putProfile({ ...$state.snapshot(profile), name: profile.name.trim() || 'Kind' });
    go({ name: 'admin' });
  }

  async function remove() {
    if (!profile || !confirm(`Profil «${profile.name}» mit allen Sternen löschen?`)) return;
    await deleteProfile(profile.id);
    if (app.profile?.id === profile.id) app.profile = null;
    go({ name: 'admin' });
  }
</script>

<div class="screen admin">
  <header class="bar">
    <button onclick={() => go({ name: 'admin' })}>‹ Zurück</button>
    <h1>{profileId ? 'Kind bearbeiten' : 'Neues Kind'}</h1>
    <span></span>
  </header>
  {#if profile}
    <main>
      <div class="form">
        <label>Name <input bind:value={profile.name} placeholder="Vorname" /></label>
      </div>
      <h2>Tier</h2>
      <div class="pick">
        {#each AVATARS as a}
          <button
            class:active={profile.avatar === `${a}.svg`}
            style:background={profile.color}
            onclick={() => profile && (profile.avatar = `${a}.svg`)}
          >
            <img src={asset(`avatars/${a}.svg`)} alt="" />
          </button>
        {/each}
      </div>
      <h2>Farbe</h2>
      <div class="pick colors">
        {#each COLORS as c}
          <button
            class:active={profile.color === c}
            style:background={c}
            aria-label={c}
            onclick={() => profile && (profile.color = c)}
          ></button>
        {/each}
      </div>
      {#if profileId}
        <p class="help">{plays} Spiele abgeschlossen · {stars} Sterne gesammelt</p>
      {/if}
      <div class="actions">
        {#if profileId}<button class="danger" onclick={remove}>Löschen</button>{/if}
        <span class="spacer"></span>
        <button class="primary" onclick={save}>Speichern</button>
      </div>
    </main>
  {/if}
</div>

<style>
  .pick { display: flex; flex-wrap: wrap; gap: 0.6rem; }
  .pick button {
    width: 64px; height: 64px; border-radius: 50%; border: 4px solid transparent; padding: 8px;
  }
  .pick button.active { border-color: var(--text); }
  .pick img { width: 100%; }
  .colors button { width: 48px; height: 48px; }
  .actions { display: flex; gap: 0.5rem; margin-top: 2rem; }
  .spacer { flex: 1; }
</style>
