import type { OnboardingIntent } from "@mindcocoon/core/onboarding";

export type TodayBlock = "checkin" | "worry" | "entries" | "prompt";

/**
 * Night: name the feeling, get something for it, wind down; writing prompts come last. Day: the
 * prompt leads. What the person came for nudges one block forward. The worry line is always near
 * the top (it is the only way back to the box).
 */
export function todayOrder(evening: boolean, intents: readonly OnboardingIntent[]): TodayBlock[] {
  if (evening) return intents.includes("sleep") ? ["entries", "checkin", "worry", "prompt"] : ["checkin", "worry", "entries", "prompt"];
  return intents.includes("feelings") ? ["worry", "checkin", "prompt", "entries"] : ["worry", "prompt", "checkin", "entries"];
}
