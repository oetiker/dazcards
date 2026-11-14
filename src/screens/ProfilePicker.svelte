<!-- "Who is playing?" – kids pick their animal; no reading needed. -->
<script lang="ts">
  import { asset } from '../lib/asset';
  import { onMount } from 'svelte';
  import { listProfiles } from '../lib/db';
  import { app, go } from '../lib/app.svelte';
  import ParentGate from '../lib/components/ParentGate.svelte';
  import SilentModeHint from '../lib/components/SilentModeHint.svelte';
  import type { Profile } from '../lib/types';

  let profiles = $state<Profile[]>([]);
  let loaded = $state(false);

  onMount(async () => {
    profiles = (await listProfiles()).sort((a, b) => a.createdAt - b.createdAt);
    loaded = true;
  });

  function pick(p: Profile) {
    app.profile = p;
    go({ name: 'home' });
  }
</script>

<div class="screen">
  <header>
    <span></span>
    <ParentGate onunlock={() => go({ name: 'admin' })} />
  </header>
  <SilentModeHint />
  {#if loaded && profiles.length === 0}
    <div class="empty">
      <p>Willkommen bei DaZ Cards!</p>
      <p class="hint">Erwachsene: Zahnrad oben rechts 3 Sekunden gedrückt halten, um Kinderprofile anzulegen.</p>
    </div>
  {/if}
  <div class="grid">
    {#each profiles as p (p.id)}
      <button class="profile" style:--c={p.color} onclick={() => pick(p)} aria-label={p.name}>
        <img src={asset(`avatars/${p.avatar}`)} alt="" />
        <span>{p.name}</span>
      </button>
    {/each}
  </div>
</div>

<style>
  header { display: flex; justify-content: space-between; padding: 1rem; }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(180px, 40vw), 1fr));
    gap: 4vmin;
    padding: 4vmin;
  }
  .profile {
    background: var(--c);
    border: none;
    border-radius: 50%;
    aspect-ratio: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    box-shadow: 0 8px 0 color-mix(in srgb, var(--c) 60%, black);
    cursor: pointer;
  }
  .profile:active { transform: translateY(5px); box-shadow: 0 3px 0 color-mix(in srgb, var(--c) 60%, black); }
  .profile img { width: 60%; }
  /* Names are for adults/older siblings; the picture is the real identifier. */
  .profile span { font-size: 1rem; font-weight: 700; color: white; text-shadow: 0 1px 2px #0006; }
  .empty { text-align: center; font-size: 1.5rem; padding: 2rem; }
  .hint { font-size: 1rem; color: var(--muted); }
</style>
