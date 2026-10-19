import type { MoodLog, MoodType } from "../types";

/**
 * Gentle observations from the last 30 days, in words only (never numbers or scores), and only
 * when there is enough to be fair: a tag that often comes with one mood, a feeling word that keeps
 * coming back this week, heavy moments that tend to arrive late at night. At most three.
 */
export type Insight =
  | { kind: "tag-mood"; tag: string; mood: MoodType }
  | { kind: "feeling-lately"; word: string }
  | { kind: "late-night"; mood: MoodType };

const DAY = 24 * 60 * 60 * 1000;
const WINDOW_DAYS = 30;
const RECENT_DAYS = 7;
const MIN_TAG_LOGS = 4;
const TAG_SHARE = 0.6;
const MIN_FEELING_LOGS = 3;
const MIN_LATE_LOGS = 4;
const LATE_SHARE = 0.7;
const HEAVY_MOODS: MoodType[] = ["anxious", "heavy"];

const isLate = (d: Date) => d.getHours() >= 22 || d.getHours() < 4;

function topCount<T>(items: T[]): { value: T; count: number } | null {
  const counts = new Map<T, number>();
  for (const item of items) counts.set(item, (counts.get(item) ?? 0) + 1);
  let best: { value: T; count: number } | null = null;
  for (const [value, count] of counts) if (!best || count > best.count) best = { value, count };
  return best;
}

export function gentleInsights(logs: MoodLog[], now: Date): Insight[] {
  const since = now.getTime() - WINDOW_DAYS * DAY;
  const recent = logs.filter((l) => {
    const t = new Date(l.createdAt).getTime();
    return t >= since && t <= now.getTime();
  });
  const out: Insight[] = [];

  // A tag that often comes with one mood.
  const tags = new Set(recent.flatMap((l) => l.tags));
  let bestTag: { tag: string; mood: MoodType; n: number } | null = null;
  for (const tag of tags) {
    const tagged = recent.filter((l) => l.tags.includes(tag));
    if (tagged.length < MIN_TAG_LOGS) continue;
    const top = topCount(tagged.map((l) => l.mood));
    if (top && top.count / tagged.length >= TAG_SHARE && (!bestTag || tagged.length > bestTag.n)) {
      bestTag = { tag, mood: top.value, n: tagged.length };
    }
  }
  if (bestTag) out.push({ kind: "tag-mood", tag: bestTag.tag, mood: bestTag.mood });

  // A feeling word that keeps coming back this week.
  const week = recent.filter((l) => new Date(l.createdAt).getTime() >= now.getTime() - RECENT_DAYS * DAY);
  const word = topCount(week.flatMap((l) => l.feelings ?? []));
  if (word && word.count >= MIN_FEELING_LOGS) out.push({ kind: "feeling-lately", word: word.value });

  // Heavy moments that tend to come late at night.
  const heavy = recent.filter((l) => HEAVY_MOODS.includes(l.mood));
  if (heavy.length >= MIN_LATE_LOGS) {
    const late = heavy.filter((l) => isLate(new Date(l.createdAt)));
    const top = topCount(late.map((l) => l.mood));
    if (late.length / heavy.length >= LATE_SHARE && top) out.push({ kind: "late-night", mood: top.value });
  }

  return out.slice(0, 3);
}
