// Speech output: a card's own recording if present, otherwise text-to-speech.
import { mediaUrl } from './media';
import type { Card } from './types';

let current: HTMLAudioElement | null = null;

export function stopAll(): void {
  current?.pause();
  current = null;
  if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();
}

export function ttsAvailable(): boolean {
  return typeof speechSynthesis !== 'undefined';
}

/** Speak text with the platform voice. Resolves when done (or immediately if unsupported). */
export function speak(text: string, lang: string): Promise<void> {
  if (!ttsAvailable()) return Promise.resolve();
  return new Promise((resolve) => {
    // Some platforms never fire onend (e.g. no voice installed) – never let a game hang.
    const timer = setTimeout(resolve, 1500 + text.length * 150);
    const done = () => {
      clearTimeout(timer);
      resolve();
    };
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    u.rate = 0.85; // a little slower for young learners
    const voice = speechSynthesis.getVoices().find((v) => v.lang.startsWith(lang.slice(0, 2)));
    if (voice) u.voice = voice;
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
  stopAll();
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
 * gesture. Call this from the first tap; later (timer-driven) playback then works.
 */
export function unlockAudio(): void {
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') ctx.resume();
    const b = ctx.createBuffer(1, 1, 22050);
    const src = ctx.createBufferSource();
    src.buffer = b;
    src.connect(ctx.destination);
    src.start(0);
  } catch {
    /* ignore */
  }
  if (ttsAvailable()) speechSynthesis.speak(new SpeechSynthesisUtterance(' '));
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
