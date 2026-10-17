import Constants from "expo-constants";
import { useSyncExternalStore } from "react";
import { Platform } from "react-native";
import mobileAds, { AdsConsent, MaxAdContentRating, TestIds } from "react-native-google-mobile-ads";

/**
 * AdMob set-up: UMP consent first (only shows a form where the law needs one), then
 * a Teen content rating and non-personalised requests only — so no ATT prompt on iOS.
 */

export const AD_REQUEST = { requestNonPersonalizedAdsOnly: true } as const;

export type AdUnitKind = "banner-today" | "banner-mood" | "rewarded";

let started: Promise<void> | null = null;
let ready = false;
const listeners = new Set<() => void>();

export function startAds(): Promise<void> {
  started ??= (async () => {
    try {
      await AdsConsent.gatherConsent();
    } catch {
      // No consent info (offline, misconfigured messages): requests stay non-personalised anyway.
    }
    await mobileAds().setRequestConfiguration({
      maxAdContentRating: MaxAdContentRating.T,
      tagForChildDirectedTreatment: false,
      tagForUnderAgeOfConsent: false,
    });
    await mobileAds().initialize();
    ready = true;
    listeners.forEach((l) => l());
  })().catch(() => {
    started = null; // try again next time
  });
  return started;
}

export const getAdsReady = () => ready;

export function useAdsReady(): boolean {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    getAdsReady,
    getAdsReady,
  );
}

/** Google's test units in development; release ids come from app.json `extra.admob.<ios|android>`. */
export function adUnitId(kind: AdUnitKind): string {
  if (__DEV__) return kind === "rewarded" ? TestIds.REWARDED : TestIds.ADAPTIVE_BANNER;
  const ids = (Constants.expoConfig?.extra?.admob as Record<string, Partial<Record<AdUnitKind, string>>> | undefined)?.[Platform.OS];
  return ids?.[kind] ?? "";
}

export function __resetAdsForTests() {
  started = null;
  ready = false;
}
