/** Premium sounds unlocked by a rewarded ad: id → epoch ms when the unlock ends. Pure helpers. */
export type Unlocks = Record<string, number>;

export const DAY_MS = 24 * 60 * 60 * 1000;

export function isUnlockedIn(record: Unlocks, id: string, now: number): boolean {
  return (record[id] ?? 0) > now;
}

export function unlockedUntilIn(record: Unlocks, id: string, now: number): number | null {
  return isUnlockedIn(record, id, now) ? record[id] : null;
}

/** Adds (or renews) a 24-hour unlock from now, dropping expired ones. */
export function withUnlock(record: Unlocks, id: string, now: number): Unlocks {
  const kept = Object.fromEntries(Object.entries(record).filter(([, until]) => until > now));
  return { ...kept, [id]: now + DAY_MS };
}
