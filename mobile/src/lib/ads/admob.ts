import Constants from "expo-constants";
import { useSyncExternalStore } from "react";
import { Platform } from "react-native";
import mobileAds, { AdsConsent, AdsConsentPrivacyOptionsRequirementStatus, MaxAdContentRating, TestIds } from "react-native-google-mobile-ads";

/**
 * AdMob set-up: UMP consent first (only shows a form where the law needs one), then
 * a Teen content rating and non-personalised requests only — so no ATT prompt on iOS.
 */

export const AD_REQUEST = { requestNonPersonalizedAdsOnly: true } as const;

export type AdUnitKind = "banner-today" | "banner-mood" | "rewarded";

let started: Promise<void> | null = null;
let ready = false;
let privacyRequired = false;
const listeners = new Set<() => void>();

export function startAds(): Promise<void> {
  started ??= (async () => {
    let info: { canRequestAds: boolean; privacyOptionsRequirementStatus: string } | null = null;
    try {
      info = await AdsConsent.gatherConsent();
    } catch {
      // Offline or no consent message configured: fall back to what was decided last time.
      info = await AdsConsent.getConsentInfo().catch(() => null);
    }
    privacyRequired = info?.privacyOptionsRequirementStatus === AdsConsentPrivacyOptionsRequirementStatus.REQUIRED;
    listeners.forEach((l) => l());
    if (!info?.canRequestAds) {
      started = null; // ask again next time an ad screen opens
      return;
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

const getPrivacyRequired = () => privacyRequired;

/** True where the law (e.g. EEA/UK) requires a way to change ad consent later. */
export function useAdPrivacyRequired(): boolean {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    getPrivacyRequired,
    getPrivacyRequired,
  );
}

export function showAdPrivacyOptions() {
  return AdsConsent.showPrivacyOptionsForm().catch(() => {});
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
  privacyRequired = false;
}
