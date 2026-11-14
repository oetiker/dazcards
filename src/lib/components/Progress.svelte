<!-- Stars filling up as rounds are completed – only ever counts upwards. -->
<script lang="ts">
  let { done, total }: { done: number; total: number } = $props();
</script>

<div class="progress" aria-label="{done} von {total}">
  {#each Array(total) as _, i}
    <img src="/star.svg" alt="" class:off={i >= done} />
  {/each}
</div>

<style>
  .progress { display: flex; gap: 4px; justify-content: center; flex-wrap: wrap; padding: 0 72px; min-height: 60px; align-items: center; }
  img { width: 28px; height: 28px; transition: filter 0.3s, transform 0.3s; }
  .off { filter: grayscale(1) opacity(0.3); }
  img:not(.off) { transform: scale(1.1); }
</style>
