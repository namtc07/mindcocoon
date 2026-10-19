import { LOW_MOODS } from "../moods";
import { addDays, dayKey, dayKeyFromISO, startOfDay, weekdayIndex } from "../dates";
import type { MoodLog } from "../types";

export interface DayCell {
  dayKey: string;
  date: Date;
  log: MoodLog | null;
}

const WEEK_MS = 7 * 86_400_000;
const NUDGE_DAYS = 7;

/** The mood of a day is its latest log, in local time. */
export function latestMoodByDay(logs: MoodLog[]): Map<string, MoodLog> {
  const byDay = new Map<string, MoodLog>();
  for (const log of logs) {
    const key = dayKeyFromISO(log.createdAt);
    const current = byDay.get(key);
    if (!current || current.createdAt < log.createdAt) byDay.set(key, log);
  }
  return byDay;
}

/** Seven days, oldest first, ending today. */
export function weekStrip(logs: MoodLog[], now: Date): DayCell[] {
  const byDay = latestMoodByDay(logs);
  const today = startOfDay(now);
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(today, i - 6);
    const key = dayKey(date);
    return { dayKey: key, date, log: byDay.get(key) ?? null };
  });
}

/** Monday-first calendar for `month` (0-based); leading cells before the 1st are null. */
export function monthGrid(logs: MoodLog[], year: number, month: number): (DayCell | null)[] {
  const byDay = latestMoodByDay(logs);
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leading: null[] = Array.from({ length: weekdayIndex(first) }, () => null);
  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const date = new Date(year, month, i + 1);
    const key = dayKey(date);
    return { dayKey: key, date, log: byDay.get(key) ?? null };
  });
  return [...leading, ...days];
}

/** True after seven local days in a row that each ended low (LOW_MOODS), at most once a week. */
/** A whole year as twelve rows of real days (no padding), each with that day's latest check-in. */
export function yearGrid(logs: MoodLog[], year: number): DayCell[][] {
  const byDay = latestMoodByDay(logs);
  return Array.from({ length: 12 }, (_, month) =>
    Array.from({ length: new Date(year, month + 1, 0).getDate() }, (_, i) => {
      const date = new Date(year, month, i + 1);
      const key = dayKey(date);
      return { dayKey: key, date, log: byDay.get(key) ?? null };
    }),
  );
}

export function shouldShowHeavyNudge(
  logs: MoodLog[],
  now: Date,
  lastShownAt: number | null,
): boolean {
  if (lastShownAt !== null && now.getTime() - lastShownAt < WEEK_MS) return false;
  const byDay = latestMoodByDay(logs);
  const today = startOfDay(now);
  for (let i = 0; i < NUDGE_DAYS; i++) {
    const mood = byDay.get(dayKey(addDays(today, -i)))?.mood;
    if (!mood || !LOW_MOODS.includes(mood)) return false;
  }
  return true;
}
