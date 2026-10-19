import type { MoodType } from "./types";

/**
 * Display order (from heavier to lighter, the order of the arc picker) and colour of the ten states.
 * Labels live in the dictionaries (t.mood.states).
 */
export const MOODS: { id: MoodType; color: string }[] = [
  { id: "angry", color: "var(--mood-angry)" },
  { id: "confused", color: "var(--mood-confused)" },
  { id: "anxious", color: "var(--mood-anxious)" },
  { id: "alone", color: "var(--mood-alone)" },
  { id: "heavy", color: "var(--mood-heavy)" },
  { id: "numb", color: "var(--mood-numb)" },
  { id: "peaceful", color: "var(--mood-peaceful)" },
  { id: "hopeful", color: "var(--mood-hopeful)" },
  { id: "thankful", color: "var(--mood-thankful)" },
  { id: "joyful", color: "var(--mood-joyful)" },
];

/**
 * Clearly low moods: a run of these is what the gentle "heavy week" nudge and the late-night
 * observation look for. Confused and numb are not counted (they are not clearly low).
 */
export const LOW_MOODS: readonly MoodType[] = ["heavy", "alone", "anxious", "angry"];

export const MOOD_COLOR = Object.fromEntries(MOODS.map((m) => [m.id, m.color])) as Record<
  MoodType,
  string
>;

/** Built-in situational tags, stored by key and translated via t.mood.tags. */
export const DEFAULT_TAGS = ["work", "relationship", "solitude", "family", "health", "study"] as const;
export type DefaultTag = (typeof DEFAULT_TAGS)[number];

export function isDefaultTag(tag: string): tag is DefaultTag {
  return (DEFAULT_TAGS as readonly string[]).includes(tag);
}
