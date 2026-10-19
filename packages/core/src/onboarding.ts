/** Why someone came (asked once on the welcome screens; only changes what Today shows first). */
export const ONBOARDING_INTENTS = ["sleep", "worries", "feelings", "write"] as const;
export type OnboardingIntent = (typeof ONBOARDING_INTENTS)[number];

/** Longest name kept for the greeting. */
export const MAX_NAME_LENGTH = 24;
