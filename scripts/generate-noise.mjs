#!/usr/bin/env node
/**
 * Colour noise for sleep — white, pink and brown — as seamless loops. Unlike nature sounds, these
 * are synthesised by definition, so the generated files are the real thing (not placeholders).
 * Writes to public/audio (web) and mobile/assets/audio (app).
 *
 *   node scripts/generate-noise.mjs   (needs ffmpeg)
 */
import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { SR, rng, seamless, writeM4a } from "./wav.mjs";

const DURATION = 60;
const FADE = 3;
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const WEB = join(root, "public", "audio");
const APP = join(root, "mobile", "assets", "audio");

function pink(rand) {
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

function brown(rand) {
  let y = 0;
  // Leaky integrator: deep, rumbling, without drifting off.
  return () => {
    y = (y + 0.02 * (rand() * 2 - 1)) / 1.02;
    return y * 3.5;
  };
}

function white(rand) {
  // A gentle low-pass takes the hiss off the top, so it stays restful.
  let y = 0;
  return () => (y += 0.5 * (rand() * 2 - 1 - y));
}

const KINDS = { "white-noise": white, "pink-noise": pink, "brown-noise": brown };

mkdirSync(WEB, { recursive: true });
mkdirSync(APP, { recursive: true });
let i = 0;
for (const [name, make] of Object.entries(KINDS)) {
  const n = DURATION * SR;
  const f = FADE * SR;
  const next = make(rng(7000 + i++));
  const raw = new Float32Array(n + f);
  for (let s = 0; s < raw.length; s++) raw[s] = next();
  const file = join(WEB, `${name}.m4a`);
  writeM4a(seamless(raw, n, f, 0.6), file);
  copyFileSync(file, join(APP, `${name}.m4a`));
  console.log("wrote", name);
}
