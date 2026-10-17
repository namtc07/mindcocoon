import { useSyncExternalStore } from "react";
import { getPref, setPref, subscribePrefs } from "./prefs";
import { withUnlock, type Unlocks } from "./unlocks-core";

const EMPTY: Unlocks = {};
const read = () => getPref("unlocks") ?? EMPTY;

export function unlockFor24h(id: string, now = Date.now()) {
  return setPref("unlocks", withUnlock(read(), id, now));
}

/** The stored unlocks (compare against the clock with isUnlockedIn / unlockedUntilIn). */
export function useUnlocks(): Unlocks {
  return useSyncExternalStore(subscribePrefs, read, read);
}
