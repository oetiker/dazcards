<!-- Record a spoken word with the microphone (adult editor). -->
<script lang="ts">
  let { onrecorded }: { onrecorded: (blob: Blob) => void } = $props();
  let recorder: MediaRecorder | null = null;
  let recording = $state(false);
  let error = $state('');

  function pickMime(): string | undefined {
    for (const m of ['audio/webm;codecs=opus', 'audio/mp4', 'audio/ogg;codecs=opus', 'audio/webm']) {
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(m)) return m;
    }
  }

  async function start() {
    error = '';
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = pickMime();
      recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        onrecorded(new Blob(chunks, { type: recorder?.mimeType || mimeType || 'audio/webm' }));
        recording = false;
      };
      recorder.start();
      recording = true;
    } catch (e) {
      error = 'Mikrofon nicht verfügbar. Alternativ eine Audiodatei wählen.';
      console.warn(e);
    }
  }

  const stop = () => recorder?.state === 'recording' && recorder.stop();
</script>

{#if recording}
  <button type="button" class="rec on" onclick={stop}>■ Stopp</button>
{:else}
  <button type="button" class="rec" onclick={start}>● Aufnehmen</button>
{/if}
{#if error}<p class="error">{error}</p>{/if}

<style>
  .rec { color: #c62828; font-weight: 600; }
  .on { background: #c62828; color: white; animation: pulse 1s infinite; }
  @keyframes pulse { 50% { opacity: 0.7; } }
</style>
