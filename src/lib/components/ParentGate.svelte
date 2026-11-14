<!--
  Adult-only entry: press and hold for 3 seconds. Young children rarely
  discover or manage this, while adults need no reading or arithmetic.
-->
<script lang="ts">
  let { onunlock, label = 'Für Erwachsene' }: { onunlock: () => void; label?: string } = $props();
  const HOLD_MS = 3000;
  let progress = $state(0);
  let raf = 0;
  let start = 0;

  function down(e: PointerEvent) {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    start = performance.now();
    const step = (t: number) => {
      progress = Math.min(1, (t - start) / HOLD_MS);
      if (progress >= 1) {
        reset();
        onunlock();
      } else raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  }
  function reset() {
    cancelAnimationFrame(raf);
    progress = 0;
  }
</script>

<button
  class="gate"
  title="{label}: 3 Sekunden gedrückt halten"
  aria-label="{label}: 3 Sekunden gedrückt halten"
  onpointerdown={down}
  onpointerup={reset}
  onpointercancel={reset}
  oncontextmenu={(e) => e.preventDefault()}
  style:--p={progress}
>
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="currentColor"
      d="M19.4 13a7.5 7.5 0 0 0 0-2l2.1-1.6-2-3.5-2.5 1a7.6 7.6 0 0 0-1.7-1L15 3h-4l-.4 2.9a7.6 7.6 0 0 0-1.7 1l-2.5-1-2 3.5L6.6 11a7.5 7.5 0 0 0 0 2l-2.1 1.6 2 3.5 2.5-1a7.6 7.6 0 0 0 1.7 1L11 21h4l.4-2.9a7.6 7.6 0 0 0 1.7-1l2.5 1 2-3.5zM13 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7z"
    />
  </svg>
</button>

<style>
  .gate {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    border: none;
    color: var(--muted);
    background: conic-gradient(var(--accent) calc(var(--p) * 360deg), transparent 0) border-box;
    padding: 6px;
    cursor: pointer;
    user-select: none;
    -webkit-user-select: none;
    -webkit-touch-callout: none;
    touch-action: none;
  }
  svg {
    width: 100%;
    height: 100%;
    background: var(--bg);
    border-radius: 50%;
    padding: 4px;
    box-sizing: border-box;
  }
</style>
