#!/usr/bin/env node
/**
 * Generates "Tonight's music" placeholders into public/audio/music: soft,
 * piano-like loops (additive partials, slow chord progressions, small-room
 * reverb). Royalty-free by construction; replace with licensed music before launch.
 *
 *   node scripts/generate-music.mjs   (needs ffmpeg)
 */
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { SR, rng, seamless, writeM4a } from "./wav.mjs";

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "audio", "music");
const FADE_S = 3;

const midiToHz = (m) => 440 * 2 ** ((m - 69) / 12);

/** Adds one piano-ish note into `buf`. */
function addNote(buf, midi, start, velocity, rand) {
  const f0 = midiToHz(midi);
  const s0 = Math.floor(start * SR);
  const length = Math.floor(4.5 * SR);
  const partials = [1, 2, 3, 4, 5, 6];
  const detune = 1 + (rand() - 0.5) * 0.0015;
  for (const k of partials) {
    const f = f0 * k * detune * (1 + 0.0004 * k * k); // slight inharmonicity
    if (f > SR / 2.2) break;
    const amp = (velocity * 0.18) / k ** 1.6;
    const tau = 2.8 / (k ** 0.8) * (midi < 50 ? 1.4 : 1);
    const w = (2 * Math.PI * f) / SR;
    for (let i = 0; i < length && s0 + i < buf.length; i++) {
      const t = i / SR;
      const attack = Math.min(1, t / 0.006);
      buf[s0 + i] += amp * attack * Math.exp(-t / tau) * Math.sin(w * i);
    }
  }
}

/** Small Schroeder reverb: 4 damped combs in parallel, 2 allpasses in series. */
function reverb(dry, mix = 0.28) {
  const combs = [557, 593, 641, 677].map((d) => ({ d, buf: new Float32Array(d), i: 0, lp: 0 }));
  const allpasses = [225, 341].map((d) => ({ d, buf: new Float32Array(d), i: 0 }));
  const out = new Float32Array(dry.length);
  for (let n = 0; n < dry.length; n++) {
    const x = dry[n];
    let wet = 0;
    for (const c of combs) {
      const y = c.buf[c.i];
      c.lp = y * 0.6 + c.lp * 0.4;
      c.buf[c.i] = x + c.lp * 0.8;
      c.i = (c.i + 1) % c.d;
      wet += y;
    }
    wet /= combs.length;
    for (const a of allpasses) {
      const y = a.buf[a.i];
      a.buf[a.i] = wet + y * 0.5;
      a.i = (a.i + 1) % a.d;
      wet = y - wet * 0.5;
    }
    out[n] = x * (1 - mix) + wet * mix * 2.2;
  }
  return out;
}

function lofiTexture(buf, rand) {
  let lp = 0;
  let pink = 0;
  for (let i = 0; i < buf.length; i++) {
    lp += 0.35 * (buf[i] - lp); // gentle low-pass, ~3 kHz
    pink = 0.97 * pink + 0.03 * (rand() * 2 - 1);
    const crackle = rand() < 3 / SR ? (rand() - 0.5) * 0.25 : 0;
    buf[i] = lp + pink * 0.05 + crackle;
  }
}

/**
 * Pieces: chords are MIDI note lists; `pattern` picks chord tones per eighth note
 * (null = rest). Low notes play as a bass on beat one of each bar.
 */
const PIECES = {
  "piano-still": { bpm: 58, chords: [[48, 60, 63, 67, 70], [44, 60, 63, 67, 72], [51, 63, 67, 70, 74], [46, 62, 65, 69, 70]], pattern: [1, null, null, 2, null, null, 3, null], lofi: false },
  "piano-dawn": { bpm: 66, chords: [[50, 62, 66, 69, 73], [47, 59, 62, 66, 69], [43, 59, 62, 66, 71], [45, 61, 64, 66, 69]], pattern: [1, 2, 3, 4, 3, 2, 1, null], lofi: false },
  "lofi-rain": { bpm: 70, chords: [[41, 57, 60, 64, 67], [40, 55, 59, 62, 67], [38, 57, 60, 62, 65], [36, 55, 59, 64, 67]], pattern: [1, null, 3, 2, null, 4, null, 2], lofi: true },
  "lofi-slow": { bpm: 64, chords: [[45, 55, 60, 64, 67], [41, 57, 60, 64, 69], [36, 55, 59, 64, 67], [43, 55, 59, 62, 64]], pattern: [2, null, 1, null, 3, null, 4, null], lofi: true },
  "piano-drift": { bpm: 62, chords: [[51, 63, 67, 70, 74, 77], [48, 63, 67, 70, 72], [44, 63, 67, 72, 75], [46, 65, 70, 72, 74]], pattern: [3, 4, 5, null, 4, 3, null, null], lofi: false },
  "piano-letter": { bpm: 68, chords: [[43, 59, 62, 66, 71], [40, 59, 62, 66, 67], [36, 59, 64, 67, 71], [38, 57, 62, 66, 69]], pattern: [1, 3, 2, 4, null, 3, 2, null], lofi: false },
};

function render(name, { bpm, chords, pattern, lofi }, seed) {
  const rand = rng(seed);
  const eighth = 60 / bpm / 2;
  const barSeconds = eighth * 8;
  const loopSeconds = barSeconds * 2 * chords.length * Math.max(1, Math.round(60 / (barSeconds * 2 * chords.length)));
  const n = Math.floor(loopSeconds * SR);
  const f = FADE_S * SR;
  const buf = new Float32Array(n + f + 5 * SR);
  const totalBars = Math.ceil((loopSeconds + FADE_S) / barSeconds) + 1;

  for (let bar = 0; bar < totalBars; bar++) {
    const chord = chords[Math.floor(bar / 2) % chords.length];
    const barStart = bar * barSeconds;
    addNote(buf, chord[0], barStart, 0.8, rand); // bass
    if (bar % 2 === 0) addNote(buf, chord[0] + 12, barStart + eighth * 0.02, 0.35, rand);
    pattern.forEach((tone, step) => {
      if (tone === null || tone >= chord.length) return;
      const swing = lofi && step % 2 === 1 ? eighth * 0.18 : 0;
      const human = (rand() - 0.5) * 0.02;
      addNote(buf, chord[tone], barStart + step * eighth + swing + human, 0.45 + rand() * 0.2, rand);
    });
  }

  const wet = reverb(buf, lofi ? 0.22 : 0.32);
  if (lofi) lofiTexture(wet, rand);
  return seamless(wet, n, f, 0.6);
}

mkdirSync(OUT_DIR, { recursive: true });
Object.entries(PIECES).forEach(([name, piece], i) => {
  writeM4a(render(name, piece, 2000 + i), join(OUT_DIR, `${name}.m4a`));
  console.log(`✓ music/${name}.m4a`);
});
