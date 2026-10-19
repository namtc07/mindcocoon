import { useSyncExternalStore } from "react";
import { getPref, setPref, subscribePrefs } from "@/lib/prefs";

export const AD_FREE_MS = 24 * 60 * 60 * 1000;

const read = () => getPref("adFreeUntil") ?? 0;

/** Epoch ms until which banners and native ads stay away, or 0. */
export function useAdFreeUntil(): number {
  return useSyncExternalStore(subscribePrefs, read, read);
}

/** The reward for one rewarded ad: no banner or native ad for 24 hours. */
export function startAdFree(now = Date.now()) {
  return setPref("adFreeUntil", now + AD_FREE_MS);
}
