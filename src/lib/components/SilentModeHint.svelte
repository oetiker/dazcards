<!--
  iPhone/iPad only: in silent mode iOS mutes speech output (sound effects
  still play). Web pages cannot detect the switch, so we tell adults once.
-->
<script lang="ts">
  import { isIOS, prefs } from '../platform';

  const KEY = 'hint.silentMode.dismissed';
  let show = $state(isIOS() && prefs.get(KEY) !== '1');

  function dismiss() {
    prefs.set(KEY, '1');
    show = false;
  }
</script>

{#if show}
  <div class="hint" role="note">
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M3 9v6h4l5 5V4L7 9H3z" />
      <path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M16 9l5 6M21 9l-5 6" />
    </svg>
    <p>
      <strong>Keine Sprache zu hören?</strong> Im <strong>Stumm-Modus</strong> bleibt die Sprachausgabe auf iPhone und
      iPad still – Klänge sind trotzdem hörbar. Stumm-Modus ausschalten (Schalter bzw. Aktionstaste seitlich am Gerät
      oder im Kontrollzentrum).
    </p>
    <button onclick={dismiss}>Verstanden</button>
  </div>
{/if}

<style>
  .hint {
    display: flex;
    gap: 0.75rem;
    align-items: center;
    flex-wrap: wrap;
    margin: 0.75rem 1rem;
    padding: 0.75rem 1rem;
    border-radius: 14px;
    background: #fff3cd;
    color: #5c4400;
    font-size: 0.9rem;
    user-select: text;
    -webkit-user-select: text;
  }
  svg { width: 32px; height: 32px; flex: none; }
  p { margin: 0; flex: 1 1 220px; }
  button {
    font: inherit; padding: 0.4rem 0.9rem; border-radius: 10px; border: 1px solid #e0c36a;
    background: #fff; color: inherit; cursor: pointer;
  }
  @media (prefers-color-scheme: dark) {
    .hint { background: #4a3c12; color: #f6e7b8; }
    button { background: #2d2721; border-color: #7a6526; }
  }
</style>
