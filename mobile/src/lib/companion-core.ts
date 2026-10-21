import { dayKeyFromISO } from "@mindcocoon/core/dates";
import type { MoodLog } from "@mindcocoon/core/types";
import type { SleepNight } from "./sleep-log-core";

/**
 * The evenings on which the person showed up at all: a day with a check-in, or a night
 * that used wind-down / the sleep timer (its key is the evening it began). Sorted, once
 * each — this feeds Kén's growth in @mindcocoon/core/companion.
 */
export function eveningDays(logs: readonly MoodLog[], sleepLog: readonly SleepNight[]): string[] {
  const days = new Set<string>();
  for (const l of logs) days.add(dayKeyFromISO(l.createdAt));
  for (const n of sleepLog) days.add(n.night);
  return [...days].sort();
}
