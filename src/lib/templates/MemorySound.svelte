<!-- Hör-Memory: match the sound card to the picture card. -->
<script lang="ts">
  import Memory from './Memory.svelte';
  import type { TemplateProps } from './types';

  let props: TemplateProps = $props();
</script>

<Memory {...props} mode="sound" />
