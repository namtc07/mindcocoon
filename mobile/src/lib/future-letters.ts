import { dayKeyFromISO } from "@mindcocoon/core/dates";
import { LOW_MOODS } from "@mindcocoon/core/moods";
import type { MoodLog } from "@mindcocoon/core/types";
import { createSealedList, type Sealed } from "./sealed-list";

/** Letters to your future self: sealed (encrypted) until a week, a month, or a hard week. */
export type LetterWhen = "week" | "month" | "hard-week";
type Meta = { when: LetterWhen; openAt: string | null };
export type FutureLetter = Sealed<Meta>;

const DAY = 24 * 60 * 60 * 1000;
const store = createSealedList<Meta>("future-letters:v1");

export const futureLetters = {
  ...store,
  add: ({ text, when }: { text: string; when: LetterWhen }, now = new Date()) => {
    const openAt = when === "week" ? new Date(now.getTime() + 7 * DAY) : when === "month" ? new Date(now.getTime() + 30 * DAY) : null;
    return store.add(text, { when, openAt: openAt?.toISOString() ?? null }, now);
  },
};

/**
 * Ready to open: its day has come — or, for "when I have a hard week", at least three days after
 * writing, four of the last seven days ended low (heavy, lonely, anxious, angry).
 */
export function isOpenable(letter: FutureLetter, now: Date, logs: MoodLog[]): boolean {
  if (letter.openAt) return new Date(letter.openAt).getTime() <= now.getTime();
  if (now.getTime() - new Date(letter.createdAt).getTime() < 3 * DAY) return false;
  const since = now.getTime() - 7 * DAY;
  const lowDays = new Set(
    logs.filter((l) => new Date(l.createdAt).getTime() > since && LOW_MOODS.includes(l.mood)).map((l) => dayKeyFromISO(l.createdAt)),
  );
  return lowDays.size >= 4;
}
