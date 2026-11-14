import { mount } from 'svelte';
import './app.css';
import App from './App.svelte';
import { unlockAudio } from './lib/audio';
import { setupPwa } from './pwa';

// iOS only allows sound after a user gesture: (re-)unlock audio on touches.
addEventListener('pointerdown', unlockAudio, { capture: true });
addEventListener('touchend', unlockAudio, { capture: true });
setupPwa();

export default mount(App, { target: document.getElementById('app')! });
