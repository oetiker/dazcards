<script lang="ts">
  let { onclick, big = false }: { onclick: () => void; big?: boolean } = $props();
</script>

<button class="speak" class:big {onclick} aria-label="Nochmals hören">
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M3 9v6h4l5 5V4L7 9H3z" fill="currentColor" />
    <path d="M16.5 12a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4zM14 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6z" fill="currentColor" />
  </svg>
</button>

<style>
  .speak {
    width: 72px;
    height: 72px;
    border-radius: 50%;
    border: none;
    background: var(--accent);
    color: white;
    box-shadow: 0 5px 0 var(--accent-dark);
    display: grid;
    place-items: center;
    cursor: pointer;
  }
  .speak:active { transform: translateY(3px); box-shadow: 0 2px 0 var(--accent-dark); }
  .big { width: 110px; height: 110px; }
  svg { width: 55%; height: 55%; }
</style>
