<script lang="ts">
  import { asset } from '../asset';
  import { onMount } from 'svelte';
  import { fanfare, praise } from '../audio';

  let { stars, ondone }: { stars: number; ondone: () => void } = $props();
  const confetti = Array.from({ length: 40 }, (_, i) => ({
    left: Math.random() * 100,
    delay: Math.random() * 0.8,
    hue: (i * 47) % 360,
    size: 8 + Math.random() * 10,
  }));

  onMount(() => {
    fanfare();
    setTimeout(praise, 700);
  });
</script>

<div class="celebrate" role="dialog" aria-label="Geschafft!">
  {#each confetti as c}
    <span
      class="confetti"
      style:left="{c.left}%"
      style:animation-delay="{c.delay}s"
      style:background="hsl({c.hue} 85% 60%)"
      style:width="{c.size}px"
      style:height="{c.size}px"
    ></span>
  {/each}
  <div class="stars">
    {#each Array(stars) as _, i}
      <img src={asset('star.svg')} alt="" style:animation-delay="{0.2 + i * 0.25}s" />
    {/each}
  </div>
  <button class="next" onclick={ondone} aria-label="Weiter">
    <svg viewBox="0 0 24 24"><path fill="currentColor" d="M8 5v14l11-7z" /></svg>
  </button>
</div>

<style>
  .celebrate {
    position: fixed;
    inset: 0;
    background: color-mix(in srgb, var(--bg) 96%, transparent);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6vh;
    overflow: hidden;
    z-index: 10;
  }
  .stars { display: flex; gap: 2vmin; }
  .stars img {
    width: min(22vmin, 160px);
    transform: scale(0);
    animation: grow 0.6s cubic-bezier(0.3, 1.6, 0.6, 1) forwards;
  }
  .next {
    width: 110px;
    height: 110px;
    border-radius: 50%;
    border: none;
    background: var(--good);
    color: white;
    box-shadow: 0 6px 0 var(--good-dark);
    animation: grow 0.5s 1s backwards;
  }
  .next svg { width: 60%; }
  .confetti {
    position: absolute;
    top: -20px;
    border-radius: 3px;
    animation: fall 2.6s linear forwards;
  }
  @keyframes grow { from { transform: scale(0); } to { transform: scale(1); } }
  @keyframes fall {
    to { transform: translateY(110vh) rotate(720deg); }
  }
</style>
