import type { MoodType } from "./types";

/** Display order and colour of the five core states. Labels live in the dictionaries (t.mood.states). */
export const MOODS: { id: MoodType; color: string }[] = [
  { id: "peaceful", color: "var(--mood-peaceful)" },
  { id: "hopeful", color: "var(--mood-hopeful)" },
  { id: "numb", color: "var(--mood-numb)" },
  { id: "heavy", color: "var(--mood-heavy)" },
  { id: "anxious", color: "var(--mood-anxious)" },
];

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
