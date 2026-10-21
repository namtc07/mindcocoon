import { dayKey } from "./dates";

/**
 * Kén's quiet growth — the retention loop expressed visually, never as numbers.
 *
 * The input is the set of evenings (day keys) on which the person did anything at all here:
 * a check-in, a wind-down, a sleep timer. From it we derive a growth stage and an ornament
 * for Kén to wear. There are no levels to lose, no chains to break: the stage is a function
 * of the all-time total of evenings, and a total only ever grows. A missed day changes
 * nothing; coming back after a month finds Kén exactly as grown as you left it.
 */
export type CompanionOrnament = "sprout" | "star";

export interface CompanionState {
  /** 0 (just a cocoon) to 4 (fully grown). Visual only — never shown as a number. */
  stage: number;
  ornament: CompanionOrnament | null;
  /** Distinct evenings, all time. Internal: feeds the stage, never the UI. */
  totalEvenings: number;
}

const STAGE_MIN_EVENINGS = [0, 1, 3, 7, 14];

function distinctPastDays(eveningDays: readonly string[], now: Date): string[] {
  const today = dayKey(now);
  return [...new Set(eveningDays)].filter((d) => d <= today).sort();
}

export function companionState(eveningDays: readonly string[], now: Date): CompanionState {
  const totalEvenings = distinctPastDays(eveningDays, now).length;
  let stage = 0;
  for (let s = 0; s < STAGE_MIN_EVENINGS.length; s++) if (totalEvenings >= STAGE_MIN_EVENINGS[s]) stage = s;
  return { stage, ornament: stage >= 4 ? "star" : stage >= 1 ? "sprout" : null, totalEvenings };
}

/** Day key of the Monday that starts the week containing `now`. */
function weekStart(now: Date): string {
  const back = (now.getDay() + 6) % 7; // Monday = 0
  return dayKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - back));
}

/** The evenings visited in the current (Monday-first) week. Internal model for item 4. */
export function eveningsThisWeek(eveningDays: readonly string[], now: Date): string[] {
  const start = weekStart(now);
  const today = dayKey(now);
  return distinctPastDays(eveningDays, now).filter((d) => d >= start && d <= today);
}

/**
 * The forgiving weekly rhythm: this week's evenings, plus the all-time total.
 * The week is a fresh canvas every Monday; the total is the freeze — it never
 * decreases, so a quiet week costs nothing and a return is never a restart.
 */
export function weekRhythm(eveningDays: readonly string[], now: Date): { week: string[]; totalEvenings: number } {
  return { week: eveningsThisWeek(eveningDays, now), totalEvenings: distinctPastDays(eveningDays, now).length };
}

/**
 * Whether something about Kén changed overnight and is waiting to be revealed at this
 * visit (the Finch appointment, miniaturised): an evening happened after the last visit
 * and before today, or growth crossed into a new stage since the stage last seen.
 * The first ever visit only sets the baseline.
 */
export function overnightReveal(
  seen: { on: string; stage: number } | null,
  state: CompanionState,
  eveningDays: readonly string[],
  now: Date,
): boolean {
  if (!seen) return false;
  const today = dayKey(now);
  if (seen.on >= today) return false;
  if (state.stage > seen.stage) return true;
  return eveningDays.some((d) => d >= seen.on && d < today);
}
