import type { MoodType } from "@/types";

export interface MoodMeta {
  id: MoodType;
  label: string;
  /** One gentle line describing the state, shown on hover / selection. */
  description: string;
  /** CSS variable holding the mood colour (defined in app/globals.css). */
  color: string;
}

export const MOODS: MoodMeta[] = [
  {
    id: "peaceful",
    label: "Peaceful",
    description: "Settled, quiet inside",
    color: "var(--mood-peaceful)",
  },
  {
    id: "hopeful",
    label: "Hopeful",
    description: "A little light ahead",
    color: "var(--mood-hopeful)",
  },
  {
    id: "numb",
    label: "Numb",
    description: "Flat, far away from it all",
    color: "var(--mood-numb)",
  },
  {
    id: "heavy",
    label: "Heavy",
    description: "Weighed down, tired",
    color: "var(--mood-heavy)",
  },
  {
    id: "anxious",
    label: "Anxious",
    description: "Restless, on edge",
    color: "var(--mood-anxious)",
  },
];

export const MOOD_BY_ID = Object.fromEntries(MOODS.map((m) => [m.id, m])) as Record<
  MoodType,
  MoodMeta
>;

export const DEFAULT_TAGS = ["Work", "Relationship", "Solitude", "Family", "Health"];
