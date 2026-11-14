<!--
  Puzzle: drag the pieces onto the board (a faint ghost of the picture helps).
  A piece dropped near its place snaps in with a chime; anywhere else it
  simply floats back. When complete, the word is spoken.
-->
<script lang="ts">
  import { onMount } from 'svelte';
  import Progress from '../components/Progress.svelte';
  import { chime, praise, sayCard, stopAll, wait } from '../audio';
  import { mediaUrl } from '../media';
  import { promptSequence, puzzleGrid, shuffle, withImage } from '../rounds';
  import type { TemplateProps } from './types';

  let { game, deck, cards, onfinish }: TemplateProps = $props();
  // svelte-ignore state_referenced_locally
  const rounds = promptSequence(withImage(cards), game.options.rounds);
  // svelte-ignore state_referenced_locally
  const { rows, cols } = puzzleGrid(game.options.choices);
  const total = rows * cols;

  interface Piece { id: number; row: number; col: number; placed: boolean; dx: number; dy: number; dragging: boolean; }

  let index = $state(0);
  let picture = $state<string | null>(null);
  let pieces = $state<Piece[]>([]);
  let complete = $state(false);
  let slots: HTMLElement[] = $state([]);
  const card = $derived(rounds[index]);

  /** Render the card picture into a square image so pieces line up for any aspect ratio. */
  async function squareImage(url: string): Promise<string> {
    const img = new Image();
    img.src = url;
    await img.decode();
    const size = 600;
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const g = c.getContext('2d')!;
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, size, size);
    const w = img.naturalWidth || size;
    const h = img.naturalHeight || size;
    const s = (size * 0.9) / Math.max(w, h);
    g.drawImage(img, (size - w * s) / 2, (size - h * s) / 2, w * s, h * s);
    return c.toDataURL('image/png');
  }

  async function load() {
    complete = false;
    picture = null;
    const url = await mediaUrl(card.imageId);
    if (!url) return;
    picture = await squareImage(url);
    pieces = shuffle(
      Array.from({ length: total }, (_, id) => ({
        id, row: Math.floor(id / cols), col: id % cols, placed: false, dx: 0, dy: 0, dragging: false,
      })),
    );
    sayCard(card, deck.lang, true);
  }

  onMount(() => {
    load();
    return stopAll;
  });

  const bgSize = `${cols * 100}% ${rows * 100}%`;
  const bgPos = (p: { row: number; col: number }) =>
    `${cols > 1 ? (p.col / (cols - 1)) * 100 : 0}% ${rows > 1 ? (p.row / (rows - 1)) * 100 : 0}%`;

  let start = { x: 0, y: 0 };

  function down(e: PointerEvent, p: Piece) {
    if (p.placed || complete) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    start = { x: e.clientX, y: e.clientY };
    p.dragging = true;
  }

  function move(e: PointerEvent, p: Piece) {
    if (!p.dragging) return;
    p.dx = e.clientX - start.x;
    p.dy = e.clientY - start.y;
  }

  async function up(e: PointerEvent, p: Piece) {
    if (!p.dragging) return;
    p.dragging = false;
    const slot = slots[p.row * cols + p.col]?.getBoundingClientRect();
    const el = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const cx = el.left + el.width / 2;
    const cy = el.top + el.height / 2;
    const near =
      slot &&
      Math.abs(cx - (slot.left + slot.width / 2)) < slot.width * 0.55 &&
      Math.abs(cy - (slot.top + slot.height / 2)) < slot.height * 0.55;
    p.dx = 0;
    p.dy = 0;
    if (!near) return;
    p.placed = true;
    chime();
    if (pieces.every((x) => x.placed)) {
      complete = true;
      await wait(300);
      await sayCard(card, deck.lang, true);
      await praise();
      await wait(400);
      if (index + 1 >= rounds.length) return onfinish(3);
      index += 1;
      load();
    }
  }
</script>

<div class="game">
  <Progress done={index} total={rounds.length} />
  {#if picture}
    <div class="area" style:--rows={rows} style:--cols={cols}>
      <div class="board" class:complete>
        <img class="ghost" src={picture} alt="" />
        {#each Array(total) as _, i}
          {@const p = pieces.find((x) => x.id === i)}
          <div class="slot" bind:this={slots[i]}>
            {#if p?.placed}
              <div class="piece placed" style:background-image="url({picture})" style:background-size={bgSize} style:background-position={bgPos(p)}></div>
            {/if}
          </div>
        {/each}
      </div>
      <div class="tray">
        {#each pieces as p (p.id)}
          {#if !p.placed}
            <div
              class="piece loose"
              class:dragging={p.dragging}
              role="button"
              tabindex="-1"
              aria-label="Puzzleteil"
              style:background-image="url({picture})"
              style:background-size={bgSize}
              style:background-position={bgPos(p)}
              style:transform="translate({p.dx}px, {p.dy}px) {p.dragging ? 'scale(1.08)' : ''}"
              onpointerdown={(e) => down(e, p)}
              onpointermove={(e) => move(e, p)}
              onpointerup={(e) => up(e, p)}
              onpointercancel={(e) => up(e, p)}
            ></div>
          {/if}
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .game { display: flex; flex-direction: column; align-items: center; gap: 2vh; height: 100%; padding: 1rem; box-sizing: border-box; }
  @media (orientation: portrait) {
    .area { --board: min(40vh, 86vw) !important; }
  }
  .area {
    --board: min(56vh, 44vw);
    display: flex; flex-wrap: wrap; gap: 4vmin; align-items: center; justify-content: center; margin: auto 0;
  }
  .board {
    position: relative; width: var(--board); aspect-ratio: 1; display: grid;
    grid-template-columns: repeat(var(--cols), 1fr); grid-template-rows: repeat(var(--rows), 1fr);
    background: var(--card); border-radius: 20px; overflow: hidden; box-shadow: 0 6px 0 var(--shadow);
  }
  .ghost { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0.18; pointer-events: none; }
  .slot { border: 1px dashed var(--shadow); position: relative; }
  .complete .slot { border-color: transparent; }
  .complete { outline: 6px solid var(--good); }
  .piece { background-repeat: no-repeat; }
  .placed { position: absolute; inset: 0; animation: snap 0.25s ease; }
  .tray {
    display: grid; grid-template-columns: repeat(var(--cols), calc(var(--board) / var(--cols)));
    gap: 10px; touch-action: none;
  }
  .loose {
    height: calc(var(--board) / var(--rows)); width: calc(var(--board) / var(--cols));
    border-radius: 10px; box-shadow: 0 4px 10px #0003; touch-action: none; cursor: grab;
    transition: transform 0.25s ease; background-color: white;
  }
  .loose.dragging { transition: none; z-index: 10; position: relative; cursor: grabbing; box-shadow: 0 10px 24px #0005; }
  @keyframes snap { from { transform: scale(1.1); } }
</style>
