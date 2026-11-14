<!-- A card picture recoloured to a target colour (cached per picture + colour). -->
<script lang="ts" module>
  const cache = new Map<string, Promise<string | undefined>>();
</script>

<script lang="ts">
  import { mediaUrl } from '../media';
  import { tintPixels } from '../phrases';
  import type { Card } from '../types';

  let { card, hex }: { card: Card; hex: string } = $props();
  let url = $state<string | undefined>();

  async function render(imageId: string, hex: string): Promise<string | undefined> {
    const src = await mediaUrl(imageId);
    if (!src) return undefined;
    const img = new Image();
    img.src = src;
    await img.decode();
    const size = 400;
    const s = size / Math.max(img.naturalWidth || size, img.naturalHeight || size);
    const w = Math.round((img.naturalWidth || size) * s);
    const h = Math.round((img.naturalHeight || size) * s);
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const g = c.getContext('2d', { willReadFrequently: true })!;
    g.drawImage(img, 0, 0, w, h);
    const data = g.getImageData(0, 0, w, h);
    tintPixels(data.data, hex);
    g.putImageData(data, 0, 0);
    return c.toDataURL('image/png');
  }

  $effect(() => {
    const id = card.imageId;
    if (!id) return;
    const key = `${id}|${hex}`;
    let p = cache.get(key);
    if (!p) {
      p = render(id, hex);
      cache.set(key, p);
    }
    let alive = true;
    p.then((u) => alive && (url = u));
    return () => (alive = false);
  });
</script>

{#if url}<img src={url} alt="" draggable="false" />{/if}

<style>
  img { width: 100%; height: 100%; object-fit: contain; pointer-events: none; }
</style>
