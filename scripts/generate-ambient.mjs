#!/usr/bin/env node
/**
 * Generates seamless, royalty-free placeholder ambience into public/audio.
 * Pure synthesis (filtered noise + simple partials) — replace with licensed
 * recordings before launch by changing `src` in lib/sounds.ts.
 *
 *   node scripts/generate-ambient.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SR = 22050;
const DURATION = 30; // seconds per loop
const FADE = 2; // seconds of crossfade used to make the loop seamless
const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "audio");

// Deterministic PRNG so regenerated files are identical.
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const onePoleLP = (fc) => {
  const a = 1 - Math.exp((-2 * Math.PI * fc) / SR);
  let y = 0;
  return (x) => (y += a * (x - y));
};
const onePoleHP = (fc) => {
  const lp = onePoleLP(fc);
  return (x) => x - lp(x);
};

/** RBJ biquad; `type` is "lowpass" | "bandpass". Frequency can change per sample. */
function biquad(type, q = 0.707) {
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  return (x, freq) => {
    const w = (2 * Math.PI * freq) / SR;
    const alpha = Math.sin(w) / (2 * q);
    const cos = Math.cos(w);
    let b0, b1, b2;
    if (type === "lowpass") {
      b0 = (1 - cos) / 2; b1 = 1 - cos; b2 = (1 - cos) / 2;
    } else {
      b0 = alpha; b1 = 0; b2 = -alpha;
    }
    const a0 = 1 + alpha, a1 = -2 * cos, a2 = 1 - alpha;
    const y = (b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0;
    x2 = x1; x1 = x; y2 = y1; y1 = y;
    return y;
  };
}

function pinkNoise(rand) {
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  return () => {
    const w = rand() * 2 - 1;
    b0 = 0.99886 * b0 + w * 0.0555179;
    b1 = 0.99332 * b1 + w * 0.0750759;
    b2 = 0.969 * b2 + w * 0.153852;
    b3 = 0.8665 * b3 + w * 0.3104856;
    b4 = 0.55 * b4 + w * 0.5329522;
    b5 = -0.7616 * b5 - w * 0.016898;
    const out = b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362;
    b6 = w * 0.115926;
    return out * 0.11;
  };
}

function brownNoise(rand) {
  let last = 0;
  return () => {
    last = (last + 0.02 * (rand() * 2 - 1)) / 1.02;
    return last * 3.5;
  };
}

/** Smoothly varying random value in [0,1], changing at roughly `rate` Hz. */
function drift(rand, rate) {
  const lp = onePoleLP(rate);
  let target = rand();
  let counter = 0;
  const hold = Math.max(1, Math.round(SR / (rate * 4)));
  return () => {
    if (++counter >= hold) { counter = 0; target = rand(); }
    return lp(target);
  };
}

const TAU = Math.PI * 2;

const generators = {
  rain(rand) {
    const white = () => rand() * 2 - 1;
    const hp = onePoleHP(500);
    const lp = biquad("lowpass");
    const sway = drift(rand, 0.2);
    let drop = 0, dropDecay = 0;
    const dropLp = onePoleHP(1800);
    return () => {
      if (rand() < 14 / SR) { drop = 0.25 + rand() * 0.5; dropDecay = Math.exp(-1 / (SR * (0.004 + rand() * 0.01))); }
      drop *= dropDecay;
      const bed = lp(hp(white()), 5200) * (0.55 + 0.25 * sway());
      return bed * 0.5 + dropLp(white() * drop) * 0.6;
    };
  },

  ocean(rand) {
    const brown = brownNoise(rand);
    const white = () => rand() * 2 - 1;
    const hiss = onePoleHP(1200);
    const hissLp = onePoleLP(5000);
    return (t) => {
      const swell = Math.pow(0.5 - 0.5 * Math.cos((TAU * t) / 7.5), 1.6);
      const wash = Math.pow(0.5 - 0.5 * Math.cos((TAU * (t - 0.9)) / 7.5), 3);
      return brown() * (0.25 + 0.75 * swell) + hissLp(hiss(white())) * wash * 0.35;
    };
  },

  "night-wind"(rand) {
    const pink = pinkNoise(rand);
    const lp = biquad("lowpass", 1.2);
    const whistle = biquad("bandpass", 6);
    const gust = drift(rand, 0.15);
    return (t) => {
      const lfo = 0.5 + 0.3 * Math.sin((TAU * t) / 10) + 0.2 * Math.sin((TAU * t) / 15);
      const g = gust();
      const cutoff = 220 + 900 * lfo * (0.6 + 0.4 * g);
      const n = pink();
      return lp(n, cutoff) * (0.5 + 0.5 * lfo) * 1.4 + whistle(n, 480 + 340 * lfo) * 0.35 * g;
    };
  },

  campfire(rand) {
    const brown = brownNoise(rand);
    const rumble = onePoleLP(260);
    const white = () => rand() * 2 - 1;
    const crackHp = onePoleHP(1500);
    let amp = 0, decay = 0;
    return () => {
      const r = rand();
      if (r < 7 / SR) { amp = 0.2 + rand() * 0.6; decay = Math.exp(-1 / (SR * (0.002 + rand() * 0.012))); }
      else if (r < 7.6 / SR) { amp = 0.9; decay = Math.exp(-1 / (SR * 0.02)); }
      amp *= decay;
      return rumble(brown()) * 0.9 + crackHp(white() * amp) * 0.8;
    };
  },

  thunder(rand) {
    const rain = generators.rain(rand);
    const brown = brownNoise(rand);
    const low = biquad("lowpass");
    const strikes = [3.5, 14, 23.5];
    return (t) => {
      let env = 0;
      for (const s of strikes) {
        const d = t - s;
        if (d > 0) env += (1 - Math.exp(-d / 0.6)) * Math.exp(-d / 3.2);
      }
      return rain(t) * 0.7 + low(brown(), 140) * env * 2.2;
    };
  },

  stream(rand) {
    const pink = pinkNoise(rand);
    const hp = onePoleHP(350);
    const bands = [biquad("bandpass", 4), biquad("bandpass", 4), biquad("bandpass", 4)];
    const drifts = bands.map(() => drift(rand, 6));
    const flutter = drift(rand, 9);
    return () => {
      const n = hp(pink());
      let out = n * 0.5;
      bands.forEach((band, i) => { out += band(n, 700 + 2400 * drifts[i]()) * 1.1; });
      return out * (0.6 + 0.6 * flutter());
    };
  },

  "singing-bowl"(rand) {
    const partials = [
      [196, 1, 7], [197.4, 0.6, 7], [531, 0.35, 4.5], [1004, 0.15, 2.5], [1567, 0.06, 1.6],
    ];
    const air = onePoleLP(400);
    const pink = pinkNoise(rand);
    const period = 10;
    return (t) => {
      let out = 0;
      // Include the previous strike's tail so the loop point stays continuous.
      for (const age of [t % period, (t % period) + period]) {
        for (const [f, a, tau] of partials) out += a * Math.exp(-age / tau) * Math.sin(TAU * f * age);
      }
      return out * 0.35 + air(pink()) * 0.08;
    };
  },

  "deep-hum"(rand) {
    const brown = brownNoise(rand);
    const lp = biquad("lowpass");
    return (t) => {
      const trem = 0.8 + 0.2 * Math.sin((TAU * t) / 6);
      return (lp(brown(), 120) * 1.2 + (Math.sin(TAU * 55 * t) * 0.25 + Math.sin(TAU * 82.5 * t) * 0.12) * trem) * 0.9;
    };
  },
};

function render(name, seed) {
  const rand = rng(seed);
  const gen = generators[name](rand);
  const n = SR * DURATION;
  const f = SR * FADE;
  // Warm the filters up so the first samples aren't a transient.
  for (let i = 0; i < SR; i++) gen(-1 + i / SR);
  const raw = new Float32Array(n + f);
  for (let i = 0; i < n + f; i++) raw[i] = gen(i / SR);
  // Equal-power crossfade of the overflow back into the start → seamless loop.
  const out = raw.slice(0, n);
  for (let i = 0; i < f; i++) {
    const x = i / f;
    out[i] = raw[i] * Math.sqrt(x) + raw[n + i] * Math.sqrt(1 - x);
  }
  let peak = 0;
  for (const v of out) peak = Math.max(peak, Math.abs(v));
  const gain = 0.7 / (peak || 1);
  return out.map((v) => v * gain);
}

function toWav(samples) {
  const buffer = Buffer.alloc(44 + samples.length * 2);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + samples.length * 2, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(1, 22); // mono
  buffer.writeUInt32LE(SR, 24);
  buffer.writeUInt32LE(SR * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(samples.length * 2, 40);
  samples.forEach((v, i) => buffer.writeInt16LE(Math.round(Math.max(-1, Math.min(1, v)) * 32767), 44 + i * 2));
  return buffer;
}

mkdirSync(OUT_DIR, { recursive: true });
Object.keys(generators).forEach((name, i) => {
  const file = join(OUT_DIR, `${name}.wav`);
  writeFileSync(file, toWav(render(name, 1000 + i)));
  console.log(`✓ ${name}.wav`);
});
