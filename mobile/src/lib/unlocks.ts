import { useSyncExternalStore } from "react";
import { getPref, setPref, subscribePrefs } from "./prefs";
import { withUnlock, type Unlocks } from "./unlocks-core";

const EMPTY: Unlocks = {};
const read = () => getPref("unlocks") ?? EMPTY;

export function unlockFor24h(id: string, now = Date.now()) {
  return setPref("unlocks", withUnlock(read(), id, now));
}

/** One reward, every listed sound: each opens for 24 hours from now. */
export function unlockAllFor24h(ids: string[], now = Date.now()) {
  return setPref("unlocks", ids.reduce((acc, id) => withUnlock(acc, id, now), read()));
}

/** The stored unlocks (compare against the clock with isUnlockedIn / unlockedUntilIn). */
export function useUnlocks(): Unlocks {
  return useSyncExternalStore(subscribePrefs, read, read);
}
