// Copies the WebAssembly runtimes for in-browser Piper TTS from node_modules
// into public/tts-lab/vendor (git-ignored), so they are served from our own
// origin and work offline. Runs before `vite` dev/build.
import { copyFileSync, mkdirSync } from 'node:fs';

const out = 'public/tts-lab/vendor';
mkdirSync(out, { recursive: true });
const files = [
  'node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.mjs',
  'node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.wasm',
  'node_modules/@diffusionstudio/piper-wasm/build/piper_phonemize.js',
  'node_modules/@diffusionstudio/piper-wasm/build/piper_phonemize.wasm',
  'node_modules/@diffusionstudio/piper-wasm/build/piper_phonemize.data',
];
for (const f of files) copyFileSync(f, `${out}/${f.split('/').pop()}`);
console.log(`copied ${files.length} TTS runtime files to ${out}`);
