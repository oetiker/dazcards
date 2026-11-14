<script lang="ts">
  import { onMount } from 'svelte';
  import { app } from './lib/app.svelte';
  import { seedIfEmpty } from './lib/starter';
  import ProfilePicker from './screens/ProfilePicker.svelte';
  import Home from './screens/Home.svelte';
  import Play from './screens/Play.svelte';
  import AdminHome from './screens/admin/AdminHome.svelte';
  import DeckEditor from './screens/admin/DeckEditor.svelte';
  import GameEditor from './screens/admin/GameEditor.svelte';
  import ProfileEditor from './screens/admin/ProfileEditor.svelte';

  let ready = $state(false);
  let error = $state('');

  onMount(() => {
    seedIfEmpty()
      .then(() => (ready = true))
      .catch((e) => (error = String(e)));
  });
</script>

{#if error}
  <p class="fatal">Fehler beim Start: {error}</p>
{:else if ready}
  {@const s = app.screen}
  {#key s}
    {#if s.name === 'profiles'}
      <ProfilePicker />
    {:else if s.name === 'home'}
      <Home />
    {:else if s.name === 'play'}
      <Play gameId={s.gameId} />
    {:else if s.name === 'admin'}
      <AdminHome />
    {:else if s.name === 'deck'}
      <DeckEditor deckId={s.deckId} />
    {:else if s.name === 'game-edit'}
      <GameEditor gameId={s.gameId} />
    {:else if s.name === 'profile-edit'}
      <ProfileEditor profileId={s.profileId} />
    {/if}
  {/key}
{/if}
