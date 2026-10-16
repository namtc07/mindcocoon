/** Box breathing: inhale 4s, hold 4s, exhale 4s, hold 4s, four rounds (~1 minute). */

export const BREATH_PHASES = ["inhale", "hold-in", "exhale", "hold-out"] as const;
export type BreathPhase = (typeof BREATH_PHASES)[number];
export const PHASE_MS = 4_000;
export const CYCLES = 4;
export const TOTAL_MS = CYCLES * BREATH_PHASES.length * PHASE_MS;

export interface BreathState {
  phase: BreathPhase;
  secondsLeft: 1 | 2 | 3 | 4;
  cycle: number;
  /** 0..1 within the current phase. */
  progress: number;
  done: boolean;
}

export function breathAt(elapsedMs: number): BreathState {
  if (elapsedMs >= TOTAL_MS) {
    return { phase: "hold-out", secondsLeft: 1, cycle: CYCLES, progress: 1, done: true };
  }
  const t = Math.max(0, elapsedMs);
  const phaseIndex = Math.floor(t / PHASE_MS);
  const within = t - phaseIndex * PHASE_MS;
  return {
    phase: BREATH_PHASES[phaseIndex % BREATH_PHASES.length],
    secondsLeft: (4 - Math.floor(within / 1000)) as BreathState["secondsLeft"],
    cycle: Math.floor(phaseIndex / BREATH_PHASES.length) + 1,
    progress: within / PHASE_MS,
    done: false,
  };
}
