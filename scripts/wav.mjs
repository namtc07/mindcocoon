import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export const SR = 22050;

/** Deterministic PRNG so regenerated files are identical. */
export function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Equal-power crossfade of the overflow back into the start, then peak-normalise. */
export function seamless(raw, length, fadeSamples, peakTarget = 0.7) {
  const out = raw.slice(0, length);
  for (let i = 0; i < fadeSamples; i++) {
    const x = i / fadeSamples;
    out[i] = raw[i] * Math.sqrt(x) + raw[length + i] * Math.sqrt(1 - x);
  }
  let peak = 0;
  for (const v of out) peak = Math.max(peak, Math.abs(v));
  const gain = peakTarget / (peak || 1);
  return out.map((v) => v * gain);
}

function toWav(samples) {
  const buffer = Buffer.alloc(44 + samples.length * 2);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + samples.length * 2, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(SR, 24);
  buffer.writeUInt32LE(SR * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(samples.length * 2, 40);
  samples.forEach((v, i) => buffer.writeInt16LE(Math.round(Math.max(-1, Math.min(1, v)) * 32767), 44 + i * 2));
  return buffer;
}

/** Writes `samples` as AAC (.m4a) via ffmpeg — small enough for night-time mobile data. */
export function writeM4a(samples, outFile) {
  const dir = mkdtempSync(join(tmpdir(), "mc-audio-"));
  const wav = join(dir, "in.wav");
  writeFileSync(wav, toWav(samples));
  try {
    execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", wav, "-c:a", "aac", "-b:a", "96k", outFile]);
  } catch (error) {
    throw new Error(`ffmpeg is required to encode audio (brew install ffmpeg): ${error.message}`);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
