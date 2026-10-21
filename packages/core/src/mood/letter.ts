import { dayKey, dayKeyFromISO } from "../dates";
import { LOW_MOODS } from "../moods";
import { latestMoodByDay } from "./selectors";
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
  | { kind: "slept-better" }
  | { kind: "lighter-weekday"; weekday: number }
  | { kind: "word"; word: string };

/** The shape of a sleep night the letter may notice (the app's sleep log matches this). */
export interface LetterSleepNight {
  /** Day key of the evening the night began. */
  night: string;
  windDown: boolean;
  quality?: "good" | "okay" | "rough";
}

const MAX_LINES = 5;
const SLEEP_WINDOW_DAYS = 30;
const PATTERN_WINDOW_DAYS = 28;

const DAY = 24 * 60 * 60 * 1000;
const LIGHT_MOODS: readonly MoodType[] = ["peaceful", "hopeful", "thankful", "joyful"];
const isWeekend = (d: Date) => d.getDay() === 0 || d.getDay() === 6;

/** Share of low moods among these logs (0–1), or null when there are none. */
function lowShare(logs: MoodLog[]) {
  if (!logs.length) return null;
  return logs.filter((l) => LOW_MOODS.includes(l.mood)).length / logs.length;
}

/**
 * Sleep came easier after winding down — the same fairness bar as the sleep insight:
 * at least three answered nights each way over the last month, and a clear gap.
 */
function sleptBetterAfterWindDown(sleep: readonly LetterSleepNight[], now: Date): boolean {
  const since = dayKey(new Date(now.getTime() - SLEEP_WINDOW_DAYS * DAY));
  const answered = sleep.filter((n) => n.quality && n.night >= since);
  const withWd = answered.filter((n) => n.windDown);
  const without = answered.filter((n) => !n.windDown);
  if (withWd.length < 3 || without.length < 3) return false;
  const goodShare = (ns: LetterSleepNight[]) => ns.filter((n) => n.quality === "good").length / ns.length;
  return goodShare(withWd) - goodShare(without) >= 0.34;
}

/**
 * One weekday that has clearly been lighter than the rest, or null. Judged on days (each
 * day represented by its latest moment) over the last four weeks — a weekday pattern
 * needs more than one instance of that weekday to mean anything.
 */
function lighterWeekday(logs: MoodLog[], now: Date): number | null {
  const since = now.getTime() - PATTERN_WINDOW_DAYS * DAY;
  const recent = logs.filter((l) => {
    const t = new Date(l.createdAt).getTime();
    return t > since && t <= now.getTime();
  });
  const reps = [...latestMoodByDay(recent).values()];
  for (let weekday = 0; weekday < 7; weekday++) {
    const on = reps.filter((l) => new Date(l.createdAt).getDay() === weekday);
    const rest = reps.filter((l) => new Date(l.createdAt).getDay() !== weekday);
    if (on.length < 2 || rest.length < 6) continue;
    const onLow = lowShare(on);
    const restLow = lowShare(rest);
    if (onLow !== null && restLow !== null && restLow - onLow >= 0.5) return weekday;
  }
  return null;
}

export function weeklyLetter(logs: MoodLog[], now: Date, sleep: readonly LetterSleepNight[] = []): { lines: LetterLine[] } {
  const since = now.getTime() - 7 * DAY;
  const week = logs.filter((l) => {
    const t = new Date(l.createdAt).getTime();
    return t > since && t <= now.getTime();
  });
  const days = new Set(week.map((l) => dayKeyFromISO(l.createdAt))).size;
  if (days < 2) return { lines: [{ kind: "quiet" }] };

  const lines: LetterLine[] = [{ kind: "showed-up", amount: days >= 5 ? "most" : "few" }];

  // The letter speaks about days, so each day is represented by its latest moment:
  // a day told three times still counts once, with the mood it ended on.
  const byDay = [...latestMoodByDay(week).values()];
  const low = lowShare(byDay)!;
  const light = byDay.filter((l) => LIGHT_MOODS.includes(l.mood)).length / byDay.length;
  lines.push({ kind: "mostly", family: low >= 0.6 ? "low" : light >= 0.6 ? "light" : "mixed" });

  const weekend = lowShare(byDay.filter((l) => isWeekend(new Date(l.createdAt))));
  const weekdays = lowShare(byDay.filter((l) => !isWeekend(new Date(l.createdAt))));
  if (weekend !== null && weekdays !== null && Math.abs(weekend - weekdays) >= 0.5) {
    lines.push({ kind: "lighter-on", when: weekend < weekdays ? "weekend" : "weekdays" });
  }

  // Patterns that only a fuller week (and a month of sleep notes) can show. A sparse week
  // never earns them, which is what makes a rich week's letter read richer.
  if (sleptBetterAfterWindDown(sleep, now)) lines.push({ kind: "slept-better" });
  const weekday = lighterWeekday(logs, now);
  if (weekday !== null) lines.push({ kind: "lighter-weekday", weekday });

  const counts = new Map<string, number>();
  for (const l of week) for (const w of l.feelings ?? []) counts.set(w, (counts.get(w) ?? 0) + 1);
  const top = [...counts].sort((a, b) => b[1] - a[1])[0];
  if (top && top[1] >= 2) lines.push({ kind: "word", word: top[0] });

  return { lines: lines.slice(0, MAX_LINES) };
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
