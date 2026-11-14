// In-browser neural text-to-speech with Piper voices (VITS, ONNX), fully
// client-side via WebAssembly:
//   text --(espeak-ng phonemizer, WASM)--> phoneme ids --(ONNX Runtime, WASM)--> PCM --> WAV
// Voice models are downloaded once from Hugging Face and kept in Cache Storage.
import * as ort from 'onnxruntime-web/wasm';
import { asset } from './asset';

export interface PiperVoiceInfo {
  key: string;
  /** Path below the rhasspy/piper-voices repo, without extension. */
  path: string;
  label: string;
  sizeMB: number;
  licence: string;
  /** Named speakers of multi-speaker models. */
  speakers?: Record<string, number>;
  /** Number of speakers for anonymous multi-speaker models. */
  numSpeakers?: number;
}

const HF = 'https://huggingface.co/rhasspy/piper-voices/resolve/main/';
const V = (lang: string, name: string, quality: string) => `de/${lang}/${name}/${quality}/${lang}-${name}-${quality}`;

export const GERMAN_VOICES: PiperVoiceInfo[] = [
  { key: 'de_DE-thorsten-medium', path: V('de_DE', 'thorsten', 'medium'), label: 'Thorsten (männlich, mittel)', sizeMB: 63, licence: 'CC0' },
  { key: 'de_DE-thorsten-high', path: V('de_DE', 'thorsten', 'high'), label: 'Thorsten (männlich, hoch)', sizeMB: 114, licence: 'CC0' },
  { key: 'de_DE-kerstin-medium', path: V('de_DE', 'kerstin', 'medium'), label: 'Kerstin (weiblich, mittel)', sizeMB: 63, licence: 'CC0' },
  { key: 'de_DE-kerstin-low', path: V('de_DE', 'kerstin', 'low'), label: 'Kerstin (weiblich, niedrig)', sizeMB: 63, licence: 'CC0' },
  {
    key: 'de_DE-thorsten_emotional-medium',
    path: V('de_DE', 'thorsten_emotional', 'medium'),
    label: 'Thorsten emotional (8 Stimmungen)',
    sizeMB: 77,
    licence: 'CC0',
    speakers: { neutral: 4, amused: 0, surprised: 6, sleepy: 5, whisper: 7, angry: 1, disgusted: 2, drunk: 3 },
  },
  { key: 'de_DE-eva_k-x_low', path: V('de_DE', 'eva_k', 'x_low'), label: 'Eva K (weiblich, sehr klein)', sizeMB: 21, licence: 'M-AILABS (prüfen)' },
  { key: 'de_DE-ramona-low', path: V('de_DE', 'ramona', 'low'), label: 'Ramona (weiblich, niedrig)', sizeMB: 63, licence: 'M-AILABS (prüfen)' },
  { key: 'de_DE-karlsson-low', path: V('de_DE', 'karlsson', 'low'), label: 'Karlsson (männlich, niedrig)', sizeMB: 63, licence: 'M-AILABS (prüfen)' },
  { key: 'de_DE-pavoque-low', path: V('de_DE', 'pavoque', 'low'), label: 'Pavoque (männlich, niedrig)', sizeMB: 63, licence: 'prüfen' },
  { key: 'de_DE-mls-medium', path: V('de_DE', 'mls', 'medium'), label: 'MLS (236 Sprecher*innen)', sizeMB: 77, licence: 'CC BY 4.0', numSpeakers: 236 },
];

const CACHE = 'piper-models-v1';
const VENDOR = () => asset('tts-lab/vendor/');

export type Progress = (loadedBytes: number, totalBytes: number) => void;

async function cachedArrayBuffer(url: string, onProgress?: Progress): Promise<ArrayBuffer> {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(url);
  if (hit) return hit.arrayBuffer();
  const res = await fetch(url);
  if (!res.ok || !res.body) throw new Error(`Download fehlgeschlagen (${res.status})`);
  const total = Number(res.headers.get('content-length')) || 0;
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let loaded = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    loaded += value.length;
    onProgress?.(loaded, total);
  }
  const blob = new Blob(chunks as BlobPart[]);
  await cache.put(url, new Response(blob));
  return blob.arrayBuffer();
}

export async function cachedVoices(): Promise<string[]> {
  const keys = await (await caches.open(CACHE)).keys();
  return GERMAN_VOICES.filter((v) => keys.some((k) => k.url.endsWith(`${v.key}.onnx`))).map((v) => v.key);
}

export async function clearVoiceCache(): Promise<void> {
  await caches.delete(CACHE);
}

// ---------- phonemizer (espeak-ng compiled to WASM, Emscripten module) ----------

type PhonemizeModule = { callMain(args: string[]): number };
type CreatePhonemize = (opts: Record<string, unknown>) => Promise<PhonemizeModule>;

let factory: Promise<CreatePhonemize> | null = null;

function loadPhonemizer(): Promise<CreatePhonemize> {
  factory ??= new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = VENDOR() + 'piper_phonemize.js';
    s.onload = () => resolve((window as unknown as { createPiperPhonemize: CreatePhonemize }).createPiperPhonemize);
    s.onerror = () => reject(new Error('Phonemizer konnte nicht geladen werden'));
    document.head.appendChild(s);
  });
  return factory;
}

// The phonemizer module is created once and reused: creating it mounts the
// 18 MB espeak data each time (~0.8 s). If reuse ever fails, a fresh module is made.
let shared: Promise<PhonemizeModule> | null = null;
let onLine: ((line: string) => void) | null = null;

function phonemizerModule(): Promise<PhonemizeModule> {
  shared ??= loadPhonemizer().then((create) =>
    create({
      print: (line: string) => onLine?.(line),
      printErr: (msg: string) => console.warn('[phonemize]', msg),
      locateFile: (f: string) => VENDOR() + f,
    }),
  );
  return shared;
}

async function phonemize(text: string, espeakVoice: string, retry = true): Promise<number[]> {
  const m = await phonemizerModule();
  try {
    return await new Promise<number[]>((resolve, reject) => {
      onLine = (line) => {
        try {
          resolve(JSON.parse(line).phoneme_ids);
        } catch (e) {
          reject(e);
        }
      };
      m.callMain(['-l', espeakVoice, '--input', JSON.stringify([{ text }]), '--espeak_data', '/espeak-ng-data']);
      setTimeout(() => reject(new Error('Phonemizer antwortet nicht')), 5000);
    });
  } catch (e) {
    if (!retry) throw e;
    shared = null; // start over with a fresh module
    return phonemize(text, espeakVoice, false);
  } finally {
    onLine = null;
  }
}

// ---------- voice ----------

interface PiperConfig {
  audio: { sample_rate: number };
  espeak: { voice: string };
  inference: { noise_scale: number; length_scale: number; noise_w: number };
  speaker_id_map?: Record<string, number>;
  num_speakers?: number;
}

export interface SynthResult {
  wav: Blob;
  pcm: Float32Array;
  sampleRate: number;
  phonemizeMs: number;
  inferenceMs: number;
  audioSeconds: number;
}

let ortReady = false;
function setupOrt() {
  if (ortReady) return;
  ort.env.wasm.wasmPaths = VENDOR();
  // Multi-threading needs cross-origin isolation, which GitHub Pages cannot provide.
  ort.env.wasm.numThreads = self.crossOriginIsolated ? Math.min(4, navigator.hardwareConcurrency || 1) : 1;
  ortReady = true;
}

export class PiperVoice {
  private constructor(
    readonly info: PiperVoiceInfo,
    private session: ort.InferenceSession,
    private config: PiperConfig,
    readonly loadMs: number,
  ) {}

  static async load(info: PiperVoiceInfo, onProgress?: Progress): Promise<PiperVoice> {
    setupOrt();
    const t0 = performance.now();
    const config = JSON.parse(new TextDecoder().decode(await cachedArrayBuffer(`${HF}${info.path}.onnx.json`))) as PiperConfig;
    const model = await cachedArrayBuffer(`${HF}${info.path}.onnx`, onProgress);
    const session = await ort.InferenceSession.create(new Uint8Array(model), { executionProviders: ['wasm'] });
    return new PiperVoice(info, session, config, performance.now() - t0);
  }

  get sampleRate(): number {
    return this.config.audio.sample_rate;
  }

  async synth(text: string, opts: { speaker?: number; lengthScale?: number } = {}): Promise<SynthResult> {
    const t0 = performance.now();
    const ids = await phonemize(text.trim(), this.config.espeak.voice);
    const t1 = performance.now();
    const inf = this.config.inference;
    const feeds: Record<string, ort.Tensor> = {
      input: new ort.Tensor('int64', BigInt64Array.from(ids.map(BigInt)), [1, ids.length]),
      input_lengths: new ort.Tensor('int64', BigInt64Array.from([BigInt(ids.length)]), [1]),
      scales: new ort.Tensor('float32', Float32Array.from([inf.noise_scale, opts.lengthScale ?? inf.length_scale, inf.noise_w]), [3]),
    };
    if ((this.config.num_speakers ?? 1) > 1) {
      feeds.sid = new ort.Tensor('int64', BigInt64Array.from([BigInt(opts.speaker ?? 0)]), [1]);
    }
    const out = await this.session.run(feeds);
    const pcm = out.output.data as Float32Array;
    const t2 = performance.now();
    const sampleRate = this.config.audio.sample_rate;
    return {
      wav: new Blob([pcmToWav(pcm, sampleRate)], { type: 'audio/wav' }),
      pcm,
      sampleRate,
      phonemizeMs: t1 - t0,
      inferenceMs: t2 - t1,
      audioSeconds: pcm.length / sampleRate,
    };
  }
}

export function pcmToWav(pcm: Float32Array, sampleRate: number): ArrayBuffer {
  const buf = new ArrayBuffer(44 + pcm.length * 2);
  const v = new DataView(buf);
  const w = (o: number, s: string) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  w(0, 'RIFF');
  v.setUint32(4, 36 + pcm.length * 2, true);
  w(8, 'WAVE');
  w(12, 'fmt ');
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, sampleRate, true);
  v.setUint32(28, sampleRate * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  w(36, 'data');
  v.setUint32(40, pcm.length * 2, true);
  for (let i = 0; i < pcm.length; i++) {
    const s = Math.max(-1, Math.min(1, pcm[i]));
    v.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return buf;
}
