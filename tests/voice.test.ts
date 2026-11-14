import { describe, expect, it } from 'vitest';
import { pickVoice } from '../src/lib/audio';

const v = (name: string, lang: string, localService = true) => ({ name, lang, localService }) as SpeechSynthesisVoice;

describe('pickVoice', () => {
  it('prefers an exact match, then any German voice', () => {
    const voices = [v('Samantha', 'en-US'), v('Anna', 'de-DE'), v('Petra', 'de-CH')];
    expect(pickVoice(voices, 'de-CH')?.name).toBe('Petra');
    expect(pickVoice(voices.slice(0, 2), 'de-CH')?.name).toBe('Anna');
  });
  it('handles underscore language tags (Android) and returns undefined without German voices', () => {
    expect(pickVoice([v('x', 'de_AT')], 'de-CH')?.name).toBe('x');
    expect(pickVoice([v('Samantha', 'en-US')], 'de-CH')).toBeUndefined();
  });
});
