import { dayKey, dayKeyFromISO } from "../dates";
import { LOW_MOODS } from "../moods";
import type { MoodLog, MoodType } from "../types";

/**
 * Kén's weekly letter: a few lines about the last seven days, in words only (never numbers or
 * scores). It notices, it doesn't judge. Rendered with the `letter.*` templates.
 */
export type LetterLine =
  | { kind: "quiet" }
  | { kind: "showed-up"; amount: "few" | "most" }
  | { kind: "mostly"; family: "low" | "light" | "mixed" }
  | { kind: "lighter-on"; when: "weekend" | "weekdays" }
  | { kind: "word"; word: string };

const DAY = 24 * 60 * 60 * 1000;
const LIGHT_MOODS: readonly MoodType[] = ["peaceful", "hopeful", "thankful", "joyful"];
const isWeekend = (d: Date) => d.getDay() === 0 || d.getDay() === 6;

/** Share of low moods among these logs (0–1), or null when there are none. */
function lowShare(logs: MoodLog[]) {
  if (!logs.length) return null;
  return logs.filter((l) => LOW_MOODS.includes(l.mood)).length / logs.length;
}

export function weeklyLetter(logs: MoodLog[], now: Date): { lines: LetterLine[] } {
  const since = now.getTime() - 7 * DAY;
  const week = logs.filter((l) => {
    const t = new Date(l.createdAt).getTime();
    return t > since && t <= now.getTime();
  });
  const days = new Set(week.map((l) => dayKeyFromISO(l.createdAt))).size;
  if (days < 2) return { lines: [{ kind: "quiet" }] };

  const lines: LetterLine[] = [{ kind: "showed-up", amount: days >= 5 ? "most" : "few" }];

  const low = lowShare(week)!;
  const light = week.filter((l) => LIGHT_MOODS.includes(l.mood)).length / week.length;
  lines.push({ kind: "mostly", family: low >= 0.6 ? "low" : light >= 0.6 ? "light" : "mixed" });

  const weekend = lowShare(week.filter((l) => isWeekend(new Date(l.createdAt))));
  const weekdays = lowShare(week.filter((l) => !isWeekend(new Date(l.createdAt))));
  if (weekend !== null && weekdays !== null && Math.abs(weekend - weekdays) >= 0.5) {
    lines.push({ kind: "lighter-on", when: weekend < weekdays ? "weekend" : "weekdays" });
  }

  const counts = new Map<string, number>();
  for (const l of week) for (const w of l.feelings ?? []) counts.set(w, (counts.get(w) ?? 0) + 1);
  const top = [...counts].sort((a, b) => b[1] - a[1])[0];
  if (top && top[1] >= 2) lines.push({ kind: "word", word: top[0] });

  return { lines };
}

/**
 * Which week's letter is on offer now: the Sunday's day key, from Sunday 18:00 through Monday.
 * Otherwise null (no letter to show).
 */
export function letterWeek(now: Date): string | null {
  if (now.getDay() === 0 && now.getHours() >= 18) return dayKey(now);
  if (now.getDay() === 1) return dayKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1));
  return null;
}
