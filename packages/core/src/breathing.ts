/**
 * Paced breathing. Box breathing (in 4 / hold 4 / out 4 / hold 4, four rounds ≈ 1 minute) is the
 * original exercise; 4-7-8 ("relax") and slow exhale ("calm") are alternatives, each for 1–5 minutes.
 */

export const BREATH_PHASES = ["inhale", "hold-in", "exhale", "hold-out"] as const;
export type BreathPhase = (typeof BREATH_PHASES)[number];
export const PHASE_MS = 4_000;
export const CYCLES = 4;
export const TOTAL_MS = CYCLES * BREATH_PHASES.length * PHASE_MS;

export interface BreathState {
  phase: BreathPhase;
  /** Whole seconds left in this phase (counts down to 1). */
  secondsLeft: number;
  cycle: number;
  /** 0..1 within the current phase. */
  progress: number;
  done: boolean;
}

export type BreathPatternId = "box" | "relax" | "calm";

export interface BreathPattern {
  id: BreathPatternId;
  phases: { phase: BreathPhase; ms: number }[];
}

export const BREATH_PATTERNS: Record<BreathPatternId, BreathPattern> = {
  box: { id: "box", phases: BREATH_PHASES.map((phase) => ({ phase, ms: PHASE_MS })) },
  relax: {
    id: "relax",
    phases: [
      { phase: "inhale", ms: 4_000 },
      { phase: "hold-in", ms: 7_000 },
      { phase: "exhale", ms: 8_000 },
    ],
  },
  calm: {
    id: "calm",
    phases: [
      { phase: "inhale", ms: 4_000 },
      { phase: "exhale", ms: 6_000 },
    ],
  },
};

const cycleMs = (pattern: BreathPattern) => pattern.phases.reduce((sum, p) => sum + p.ms, 0);

/** Whole cycles closest to the chosen length (never fewer than one). */
export function cyclesFor(pattern: BreathPattern, minutes: number): number {
  return Math.max(1, Math.round((minutes * 60_000) / cycleMs(pattern)));
}

export function totalMsFor(pattern: BreathPattern, cycles: number): number {
  return cycles * cycleMs(pattern);
}

export function breathAtPattern(pattern: BreathPattern, cycles: number, elapsedMs: number): BreathState & { phaseMs: number } {
  const last = pattern.phases[pattern.phases.length - 1];
  if (elapsedMs >= totalMsFor(pattern, cycles)) {
    return { phase: last.phase, secondsLeft: 1, cycle: cycles, progress: 1, done: true, phaseMs: last.ms };
  }
  const t = Math.max(0, elapsedMs);
  const length = cycleMs(pattern);
  const cycle = Math.floor(t / length) + 1;
  let within = t - (cycle - 1) * length;
  for (const p of pattern.phases) {
    if (within < p.ms) {
      return {
        phase: p.phase,
        secondsLeft: Math.ceil((p.ms - within) / 1000 - 1e-9) || 1,
        cycle,
        progress: within / p.ms,
        done: false,
        phaseMs: p.ms,
      };
    }
    within -= p.ms;
  }
  return { phase: last.phase, secondsLeft: 1, cycle, progress: 1, done: false, phaseMs: last.ms };
}

/** The original one-minute box breathing. */
export function breathAt(elapsedMs: number): BreathState {
  const { phaseMs: _phaseMs, ...state } = breathAtPattern(BREATH_PATTERNS.box, CYCLES, elapsedMs);
  return state;
}
