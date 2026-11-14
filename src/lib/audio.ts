// Speech output: a card's own recording if present, otherwise text-to-speech.
import { mediaUrl } from './media';
import type { Card } from './types';

let current: HTMLAudioElement | null = null;

export function ttsAvailable(): boolean {
  return typeof speechSynthesis !== 'undefined' && typeof SpeechSynthesisUtterance !== 'undefined';
}

/** True if speech had to be cancelled; Safari drops a speak() issued right after cancel(). */
function cancelSpeech(): boolean {
  if (!ttsAvailable()) return false;
  if (speechSynthesis.speaking || speechSynthesis.pending) {
    speechSynthesis.cancel();
    return true;
  }
  return false;
}

export function stopAll(): void {
  current?.pause();
  current = null;
  cancelSpeech();
}

// ---------- voices ----------
let voicesReady: Promise<SpeechSynthesisVoice[]> | null = null;

/** Voices load asynchronously (Safari/Chrome): wait for them, at most ~1.5 s. */
export function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  if (!ttsAvailable()) return Promise.resolve([]);
  voicesReady ??= new Promise((resolve) => {
    const now = speechSynthesis.getVoices();
    if (now.length) return resolve(now);
    const finish = () => resolve(speechSynthesis.getVoices());
    speechSynthesis.addEventListener?.('voiceschanged', finish, { once: true });
    setTimeout(finish, 1500);
  });
  return voicesReady.then((v) => {
    if (!v.length) voicesReady = null; // try again next time
    return v;
  });
}

/** Best voice for a language: exact match (de-CH), then same language (de-DE …), local voices first. */
export function pickVoice(voices: SpeechSynthesisVoice[], lang: string): SpeechSynthesisVoice | undefined {
  const norm = (l: string) => l.replace('_', '-').toLowerCase();
  const want = norm(lang);
  const base = want.slice(0, 2);
  const score = (v: SpeechSynthesisVoice) =>
    (norm(v.lang) === want ? 4 : 0) + (norm(v.lang).startsWith(base) ? 2 : 0) + (v.localService ? 1 : 0) + (norm(v.lang) === 'de-de' ? 0.5 : 0);
  return voices.filter((v) => norm(v.lang).startsWith(base)).sort((a, b) => score(b) - score(a))[0];
}

// Safari/Chrome can garbage-collect an utterance mid-speech, so its onend never
// fires and the audio stops. Keep references until it is done.
const alive = new Set<SpeechSynthesisUtterance>();

/** Speak text with the platform voice. Resolves when done (or immediately if unsupported). */
export async function speak(text: string, lang: string): Promise<void> {
  if (!ttsAvailable()) return;
  if (cancelSpeech()) await new Promise((r) => setTimeout(r, 120));
  const voice = pickVoice(await loadVoices(), lang);
  return new Promise((resolve) => {
    const u = new SpeechSynthesisUtterance(text);
    alive.add(u);
    // Some platforms never fire onend (e.g. no voice installed) – never let a game hang.
    const timer = setTimeout(() => done(), 2000 + text.length * 150);
    function done() {
      clearTimeout(timer);
      alive.delete(u);
      resolve();
    }
    if (voice) {
      u.voice = voice;
      u.lang = voice.lang;
    } else {
      u.lang = lang.startsWith('de') ? 'de-DE' : lang;
    }
    u.rate = 0.85; // a little slower for young learners
    u.onend = done;
    u.onerror = done;
    speechSynthesis.speak(u);
  });
}

async function playUrl(url: string): Promise<void> {
  const a = new Audio(url);
  current = a;
  await new Promise<void>((resolve) => {
    a.onended = () => resolve();
    a.onerror = () => resolve();
    a.play().catch(() => resolve());
  });
}

/** Say the word on a card. `withArticle` speaks "der Hund" instead of "Hund" for TTS. */
export async function sayCard(card: Card, lang: string, withArticle = false): Promise<void> {
  current?.pause();
  current = null;
  const url = await mediaUrl(card.audioId);
  if (url) return playUrl(url);
  const text = withArticle && card.article ? `${card.article} ${card.word}` : card.word;
  return speak(text, lang);
}

const PRAISE = ['Super!', 'Toll!', 'Prima!', 'Bravo!', 'Genau!', 'Sehr gut!', 'Juhu!'];

export function praise(): Promise<void> {
  return speak(PRAISE[Math.floor(Math.random() * PRAISE.length)], 'de-CH');
}

// ---- tiny synthesised sound effects (no audio assets needed) ----
let ctx: AudioContext | null = null;

/**
 * iOS Safari blocks audio and speech until they are first used inside a user
 * gesture. Called on every tap (cheap): resumes the audio context (iOS also
 * suspends it when the app was in the background) and primes speech once.
 */
let speechPrimed = false;
export function unlockAudio(): void {
  try {
    // Safari 17+: play even when the ring/silent switch is set to silent.
    const session = (navigator as Navigator & { audioSession?: { type: string } }).audioSession;
    if (session && session.type !== 'playback') session.type = 'playback';
  } catch {
    /* ignore */
  }
  try {
    ctx ??= new AudioContext();
    if (ctx.state !== 'running') {
      ctx.resume();
      const src = ctx.createBufferSource();
      src.buffer = ctx.createBuffer(1, 1, 22050);
      src.connect(ctx.destination);
      src.start(0);
    }
  } catch {
    /* ignore */
  }
  if (!speechPrimed && ttsAvailable()) {
    speechPrimed = true;
    const u = new SpeechSynthesisUtterance('');
    u.volume = 0;
    speechSynthesis.speak(u);
    loadVoices();
  }
}

/** Information for the sound test page in the adult area. */
export async function audioInfo() {
  const voices = await loadVoices();
  return {
    tts: ttsAvailable(),
    voices: voices.map((v) => ({ name: v.name, lang: v.lang, local: v.localService })),
    audioContext: ctx?.state ?? 'not created',
    audioSession: (navigator as Navigator & { audioSession?: { type: string } }).audioSession?.type ?? 'not supported',
    userAgent: navigator.userAgent,
  };
}

function tone(freq: number, start: number, dur: number, gain = 0.15): void {
  ctx ??= new AudioContext();
  if (ctx.state === 'suspended') ctx.resume();
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = 'sine';
  o.frequency.value = freq;
  const t = ctx.currentTime + start;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g).connect(ctx.destination);
  o.start(t);
  o.stop(t + dur);
}

/** A bright ascending chime for a correct answer. */
export function chime(): void {
  try {
    [523, 659, 784].forEach((f, i) => tone(f, i * 0.09, 0.35));
  } catch {
    /* audio not available – silently skip */
  }
}

/** A longer fanfare for finishing a game. */
export function fanfare(): void {
  try {
    [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, i * 0.12, 0.4, 0.12));
  } catch {
    /* ignore */
  }
}
