import { PRESET_MIXES, type PresetMixId } from "./audio/mixes";
import { BREATH_PATTERNS, type BreathPatternId } from "./breathing";
import { PROMPT_COUNT } from "./prompts";
import { MUSIC_TRACKS } from "./sounds";

/**
 * Tonight's combination: one writing prompt, one breathing pattern, one ready-made mix,
 * one music track — chosen by a per-person seed and the date, so the ritual's skeleton is
 * the same every evening while its surface is not.
 *
 * Non-repetition is arithmetic, not luck: each part cycles with the day count modulo its
 * own catalogue size (prompts × patterns × mixes × tracks), so the whole combination can
 * only repeat after lcm(promptCount, 3, 4, 6) days — far beyond the 14-day window the
 * plan promises. Two people with different seeds live different evenings.
 */
export interface TonightPlan {
  promptIndex: number;
  pattern: BreathPatternId;
  mix: PresetMixId;
  trackId: string;
}

const PATTERN_IDS = Object.keys(BREATH_PATTERNS) as BreathPatternId[];
const DAY_MS = 24 * 60 * 60 * 1000;

function hashSeed(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619) >>> 0;
  return h;
}

const mod = (n: number, m: number) => ((n % m) + m) % m;

export function tonightPlan(seed: string, date: Date, promptCount: number = PROMPT_COUNT): TonightPlan {
  const dayNumber = Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY_MS);
  const n = dayNumber + hashSeed(seed);
  return {
    promptIndex: mod(n, promptCount),
    pattern: PATTERN_IDS[mod(n, PATTERN_IDS.length)],
    mix: PRESET_MIXES[mod(n, PRESET_MIXES.length)].id,
    trackId: MUSIC_TRACKS[mod(n, MUSIC_TRACKS.length)].id,
  };
}
