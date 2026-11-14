import { mount } from 'svelte';
import './app.css';
import App from './App.svelte';
import { unlockAudio } from './lib/audio';
import { setupPwa } from './pwa';

// iOS only allows sound after a user gesture: unlock audio on the first touch.
addEventListener('pointerdown', unlockAudio, { once: true, capture: true });
setupPwa();

export default mount(App, { target: document.getElementById('app')! });
