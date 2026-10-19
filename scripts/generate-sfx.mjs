#!/usr/bin/env node
/**
 * Generates the short "letting go" sounds for the mobile Vent rituals into mobile/assets/audio/sfx.
 * Pure synthesis, royalty-free placeholders (like generate-ambient.mjs) — swap for licensed
 * recordings before launch if wanted.
 *
 *   node scripts/generate-sfx.mjs   (needs ffmpeg)
 */
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { SR, rng, writeM4a } from "./wav.mjs";

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "mobile", "assets", "audio", "sfx");

const lowpass = (fc) => {
  const a = 1 - Math.exp((-2 * Math.PI * fc) / SR);
  let y = 0;
  return (x) => (y += a * (x - y));
};

function bandpass(q = 1.2) {
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  return (x, freq) => {
    const w = (2 * Math.PI * freq) / SR;
    const alpha = Math.sin(w) / (2 * q);
    const cos = Math.cos(w);
    // RBJ band-pass (constant 0 dB peak): b = [α, 0, -α], a = [1 + α, -2cos, 1 - α].
    const y = (alpha * x - alpha * x2 + 2 * cos * y1 - (1 - alpha) * y2) / (1 + alpha);
    x2 = x1; x1 = x; y2 = y1; y1 = y;
    return y;
  };
}

/** Rise over `attack` s, hold, then fade over the last `release` s. */
const envelope = (t, total, attack, release) => Math.min(1, t / attack, (total - t) / release);

function normalise(samples, peak = 0.5) {
  let max = 0;
  for (const v of samples) max = Math.max(max, Math.abs(v));
  return samples.map((v) => (v * peak) / (max || 1));
}

function burn(seconds = 2.6) {
  const r = rng(11);
  const rumble = lowpass(180);
  const crackle = lowpass(3000);
  const n = Math.floor(seconds * SR);
  const out = new Float32Array(n);
  let pop = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    if (r() < 0.0016) pop = 0.6 + r() * 0.4;
    pop *= 0.985;
    const v = rumble(r() * 2 - 1) * 1.4 + crackle((r() * 2 - 1) * pop);
    out[i] = v * envelope(t, seconds, 0.15, 1.2);
  }
  return normalise(Array.from(out), 0.45);
}

function float(seconds = 3.6) {
  const r = rng(23);
  const water = lowpass(500);
  const n = Math.floor(seconds * SR);
  const out = new Float32Array(n);
  let bubble = 0, freq = 600, phase = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    if (r() < 0.0004) { bubble = 0.5; freq = 380 + r() * 520; }
    bubble *= 0.9993;
    freq *= 1.00004;
    phase += (2 * Math.PI * freq) / SR;
    const swell = 0.6 + 0.4 * Math.sin(2 * Math.PI * 0.6 * t);
    out[i] = (water(r() * 2 - 1) * 2.2 * swell + Math.sin(phase) * bubble * 0.25) * envelope(t, seconds, 0.4, 1.6);
  }
  return normalise(Array.from(out), 0.4);
}

function scatter(seconds = 2.2) {
  const r = rng(37);
  const bp = bandpass(0.9);
  const n = Math.floor(seconds * SR);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const x = t / seconds;
    const center = 300 + 1300 * Math.sin(Math.PI * x);
    out[i] = bp(r() * 2 - 1, center) * Math.sin(Math.PI * x) ** 1.5;
  }
  return normalise(Array.from(out), 0.4);
}

function fade(seconds = 2.8) {
  const n = Math.floor(seconds * SR);
  const out = new Float32Array(n);
  const partials = [
    [528, 1], [792, 0.5], [1056, 0.25],
  ];
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    let v = 0;
    for (const [f, a] of partials) v += a * Math.sin(2 * Math.PI * f * t) * Math.exp(-t * (1.4 + f / 1200));
    out[i] = v * Math.min(1, t / 0.01) * envelope(t, seconds, 0.01, 0.6);
  }
  return normalise(Array.from(out), 0.35);
}

mkdirSync(OUT_DIR, { recursive: true });
for (const [name, make] of Object.entries({ burn, float, scatter, fade })) {
  writeM4a(make(), join(OUT_DIR, `${name}.m4a`));
  console.log(`wrote ${name}.m4a`);
}
