"""Probe: German speech with Qwen3-TTS 1.7B (MLX, Apple Silicon / Metal).

1. VoiceDesign: create a voice from a text description, speak the test lines.
2. Base: clone that designed voice from one reference clip and speak the test
   lines again (the production path: one consistent voice for every clip).
Writes MP3 (64 kbit/s mono) plus timings to the output directory.
"""
import json, sys, time
from pathlib import Path

import lameenc
import mlx.core as mx
import numpy as np
from mlx_audio.tts.utils import load_model

OUT = Path(sys.argv[1] if len(sys.argv) > 1 else "out")
OUT.mkdir(parents=True, exist_ok=True)

LINES = {
    "hund": "der Hund",
    "rose": "die rote Rose",
    "tisch": "Der Ball ist unter dem Tisch.",
    "reim": "Haus, Maus.",
    "lob": "Super! Das hast du toll gemacht!",
}
REF_TEXT = "Hallo! Heute schauen wir uns zusammen schöne Bilder an. Hör gut zu und sprich mit mir."
VOICES = {
    "frau": "A warm, friendly young female voice, like a kind kindergarten teacher. Speaks clear standard German "
    "(Hochdeutsch) slowly, gently and very clearly for small children, with a smile in her voice.",
    "mann": "A warm, calm, friendly male voice, like a kind kindergarten teacher. Speaks clear standard German "
    "(Hochdeutsch) slowly, gently and very clearly for small children.",
}

timings = []


def mp3(audio: np.ndarray, sr: int, path: Path) -> None:
    pcm = (np.clip(audio, -1, 1) * 32767).astype(np.int16).tobytes()
    enc = lameenc.Encoder()
    enc.set_bit_rate(64)
    enc.set_in_sample_rate(sr)
    enc.set_channels(1)
    enc.set_quality(2)
    path.write_bytes(enc.encode(pcm) + enc.flush())


def speak(model, name: str, text: str, **kw) -> tuple[np.ndarray, int]:
    t = time.time()
    parts = list(model.generate(text=text, lang_code="german", **kw))
    audio = np.concatenate([np.array(p.audio, dtype=np.float32) for p in parts])
    sr = parts[0].sample_rate
    dt = time.time() - t
    dur = len(audio) / sr
    mp3(audio, sr, OUT / f"{name}.mp3")
    mem = mx.get_peak_memory() / 1e9 if hasattr(mx, "get_peak_memory") else 0
    timings.append({"file": f"{name}.mp3", "text": text, "seconds": round(dur, 2), "gen_seconds": round(dt, 2), "peak_gb": round(mem, 2)})
    print(f"{name:28s} {dur:5.1f}s audio in {dt:6.1f}s  (factor {dt / dur:4.1f})  peak {mem:.1f} GB  «{text}»", flush=True)
    return audio, sr


t0 = time.time()
design = load_model("mlx-community/Qwen3-TTS-12Hz-1.7B-VoiceDesign-8bit")
print(f"VoiceDesign loaded in {time.time() - t0:.0f}s", flush=True)
refs = {}
for v, desc in VOICES.items():
    audio, sr = speak(design, f"design-{v}-ref", REF_TEXT, instruct=desc)
    import soundfile as sf

    ref = OUT / f"ref-{v}.wav"
    sf.write(ref, audio, sr)
    refs[v] = ref
    for k, line in LINES.items():
        speak(design, f"design-{v}-{k}", line, instruct=desc)
del design

t0 = time.time()
base = load_model("mlx-community/Qwen3-TTS-12Hz-1.7B-Base-8bit")
print(f"Base loaded in {time.time() - t0:.0f}s", flush=True)
for v, ref in refs.items():
    for k, line in LINES.items():
        speak(base, f"clone-{v}-{k}", line, ref_audio=str(ref), ref_text=REF_TEXT)

(OUT / "timings.json").write_text(json.dumps(timings, ensure_ascii=False, indent=1))
total_audio = sum(t["seconds"] for t in timings)
total_gen = sum(t["gen_seconds"] for t in timings)
print(f"TOTAL {total_audio:.0f}s audio in {total_gen:.0f}s -> factor {total_gen / total_audio:.1f}")
