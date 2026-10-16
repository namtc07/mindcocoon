/**
 * Entitlements: Pro (ad-free) and temporary rewarded unlocks.
 * Stored in localStorage for now; when billing exists, Pro must be verified
 * server-side (Stripe / App Store / Play receipts) and mirrored here.
 */

export const REWARD_UNLOCK_HOURS = 24;

export interface Entitlements {
  isPro: boolean;
  /** trackId → unlock expiry (epoch ms). */
  unlocks: Record<string, number>;
}

const STORAGE_KEY = "mindcocoon:entitlements";
const EMPTY: Entitlements = { isPro: false, unlocks: {} };

let cache: Entitlements | null = null;
const listeners = new Set<() => void>();

function read(): Entitlements {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    cache = raw ? { ...EMPTY, ...(JSON.parse(raw) as Entitlements) } : EMPTY;
  } catch {
    cache = EMPTY;
  }
  return cache;
}

function write(next: Entitlements) {
  cache = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage blocked: keep the in-memory value for this session.
  }
  listeners.forEach((l) => l());
}

export function subscribeEntitlements(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const getEntitlements = () => read();
export const getServerEntitlements = () => EMPTY;

export function setPro(isPro: boolean) {
  write({ ...read(), isPro });
}

export function grantRewardUnlock(trackId: string) {
  const current = read();
  write({
    ...current,
    unlocks: { ...current.unlocks, [trackId]: Date.now() + REWARD_UNLOCK_HOURS * 3_600_000 },
  });
}

export function isTrackUnlocked(entitlements: Entitlements, trackId: string, now: number) {
  return entitlements.isPro || (entitlements.unlocks[trackId] ?? 0) > now;
}

export function resetEntitlements() {
  write(EMPTY);
}
