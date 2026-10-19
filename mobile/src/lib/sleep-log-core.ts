/**
 * A tiny sleep diary: which nights used wind-down or the sleep timer, and (if the person answers
 * the next morning) how they slept. Words only in the app; nothing here is shown as a number.
 */
export type SleepQuality = "good" | "okay" | "rough";
export interface SleepNight {
  /** Day key of the evening the night began. */
  night: string;
  windDown: boolean;
  quality?: SleepQuality;
}

const KEEP = 90;
const key = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** 18:00–04:59 belongs to the night that began that evening; daytime has no night. */
export function nightOf(now: Date): string | null {
  const h = now.getHours();
  if (h >= 18) return key(now);
  if (h < 5) return key(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1));
  return null;
}

export function withNight(log: SleepNight[], now: Date, windDown: boolean): SleepNight[] {
  const night = nightOf(now);
  if (!night) return log;
  const existing = log.find((n) => n.night === night);
  if (existing) return log.map((n) => (n.night === night ? { ...n, windDown: n.windDown || windDown } : n));
  return [...log, { night, windDown }].slice(-KEEP);
}

export function withQuality(log: SleepNight[], night: string, quality: SleepQuality): SleepNight[] {
  return log.map((n) => (n.night === night ? { ...n, quality } : n));
}

/** In the morning (05:00–11:59): last night, if it was marked and not yet answered. */
export function questionFor(log: SleepNight[], now: Date): string | null {
  const h = now.getHours();
  if (h < 5 || h >= 12) return null;
  const last = key(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1));
  const entry = log.find((n) => n.night === last);
  return entry && !entry.quality ? last : null;
}

const goodShare = (nights: SleepNight[]) => nights.filter((n) => n.quality === "good").length / nights.length;

/** "Wind-down nights tend to go better" — only with at least three answered nights each way and a clear gap. */
export function sleepInsight(log: SleepNight[]): "wind-down-helps" | null {
  const answered = log.filter((n) => n.quality);
  const withWd = answered.filter((n) => n.windDown);
  const without = answered.filter((n) => !n.windDown);
  if (withWd.length < 3 || without.length < 3) return null;
  return goodShare(withWd) - goodShare(without) >= 0.34 ? "wind-down-helps" : null;
}
