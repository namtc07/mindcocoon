import type { BreathPhase } from "@mindcocoon/core/breathing";

/**
 * Box-breathing drawing, as worklets so Reanimated can run them on the UI thread.
 * Timing mirrors core `breathAt` (4 s phases); test/breath-geometry.test.ts keeps them in step.
 */
export const SIZE = 220;
export const PAD = 20;
const SIDE = SIZE - PAD * 2;
const PHASE_MS = 4_000;
const PHASES: BreathPhase[] = ["inhale", "hold-in", "exhale", "hold-out"];

/** Up the left on inhale, across the top on hold, down the right on exhale, back along the bottom. */
export function dotPosition(phase: BreathPhase, progress: number) {
  "worklet";
  switch (phase) {
    case "inhale":
      return { x: PAD, y: PAD + SIDE * (1 - progress) };
    case "hold-in":
      return { x: PAD + SIDE * progress, y: PAD };
    case "exhale":
      return { x: PAD + SIDE, y: PAD + SIDE * progress };
    case "hold-out":
      return { x: PAD + SIDE * (1 - progress), y: PAD + SIDE };
  }
}

/** How large the breathing shape is: grows on inhale, rests full while holding in, shrinks on exhale. */
export function breathScale(phase: BreathPhase, progress: number) {
  "worklet";
  if (phase === "inhale") return 0.6 + 0.4 * progress;
  if (phase === "hold-in") return 1;
  if (phase === "exhale") return 1 - 0.4 * progress;
  return 0.6;
}

export const innerScale = breathScale;

/** Phase index and progress for any pattern (phases passed as plain data so this runs on the UI thread). */
export function breathAtPatternWorklet(phases: { phase: BreathPhase; ms: number }[], elapsedMs: number) {
  "worklet";
  let cycle = 0;
  for (let i = 0; i < phases.length; i++) cycle += phases[i].ms;
  let within = Math.max(0, elapsedMs) % cycle;
  for (let i = 0; i < phases.length; i++) {
    if (within < phases[i].ms) return { phaseIndex: i, progress: within / phases[i].ms };
    within -= phases[i].ms;
  }
  return { phaseIndex: phases.length - 1, progress: 1 };
}

export function breathAtWorklet(elapsedMs: number) {
  "worklet";
  const t = Math.max(0, elapsedMs);
  const index = Math.floor(t / PHASE_MS);
  return { phaseIndex: index % PHASES.length, progress: (t - index * PHASE_MS) / PHASE_MS };
}

export function phaseOf(index: number): BreathPhase {
  "worklet";
  return PHASES[index];
}

export const INNER_SIDE = SIDE * 0.62;
