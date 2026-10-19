import { useSyncExternalStore } from "react";
import { getPref, setPref, subscribePrefs } from "@/lib/prefs";


const read = () => getPref("adFreeUntil") ?? 0;

/** Epoch ms until which banners and native ads stay away, or 0. */
export function useAdFreeUntil(): number {
  return useSyncExternalStore(subscribePrefs, read, read);
}

/** The reward for one rewarded ad: no banner or native ad for `hours` (remote ad_free_hours). */
export function startAdFree(hours: number, now = Date.now()) {
  return setPref("adFreeUntil", now + hours * 60 * 60 * 1000);
}
