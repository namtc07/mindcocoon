import { tonightPlan, type TonightPlan } from "@mindcocoon/core/tonight-plan";
import { getPref, setPref } from "./prefs";

/**
 * This person's seed for the nightly rotation: created once, kept only on this device.
 * Until the first save lands, a module-level seed keeps the plan stable within the visit.
 */
let sessionSeed: string | null = null;

export function tonightSeed(): string {
  const saved = getPref("tonightSeed");
  if (saved) return saved;
  if (!sessionSeed) {
    sessionSeed = `seed-${Math.random().toString(36).slice(2, 10)}`;
    void setPref("tonightSeed", sessionSeed);
  }
  return sessionSeed;
}

/** Tonight's combination (prompt / breathing pattern / mix / track) for this person. */
export function planForTonight(now: Date): TonightPlan {
  return tonightPlan(tonightSeed(), now);
}
