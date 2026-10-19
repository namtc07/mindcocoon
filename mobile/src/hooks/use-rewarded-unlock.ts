import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useSyncExternalStore } from "react";
import { AppState } from "react-native";
import { AdEventType, RewardedAd, RewardedAdEventType } from "react-native-google-mobile-ads";
import { AD_REQUEST, adUnitId, useAdsReady } from "@/lib/ads/admob";
import { canOfferRewarded } from "@/lib/ads/policy";
import { useFlags } from "@/lib/remote-config";
import { SOUND_TRACKS } from "@mindcocoon/core/sounds";
import { startAdFree } from "@/lib/ads/ad-free";
import { getPref, setPref } from "@/lib/prefs";
import { unlockAllFor24h, unlockFor24h } from "@/lib/unlocks";

export type UnlockResult = "unlocked" | "unavailable" | "dismissed";

const LOAD_TIMEOUT_MS = 10_000;

/** At most one rewarded ad at a time, app-wide; cancelled if the person leaves Sanctuary or the app first. */
let cancelPending: (() => void) | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const isBusy = () => cancelPending !== null;

export function cancelRewarded() {
  cancelPending?.();
}

const PREMIUM_IDS = SOUND_TRACKS.filter((t) => t.category === "ambient" && t.isPremium).map((t) => t.id);
/** Mixes can grow from five to at most ten, one rewarded ad per extra slot. */
export const MAX_EXTRA_MIX_SLOTS = 5;

/** Shows one rewarded ad on request; `reward` runs only if the reward was earned. */
function showRewarded(reward: () => unknown): Promise<UnlockResult> {
  const unitId = adUnitId("rewarded");
  if (!unitId) return Promise.resolve("unavailable");
  if (cancelPending) return Promise.resolve("dismissed");
  const ad = RewardedAd.createForAdRequest(unitId, AD_REQUEST);
  return new Promise<UnlockResult>((resolve) => {
    let loaded = false;
    let earned = false;
    let done = false;
    const finish = (result: UnlockResult) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      ad.removeAllListeners();
      cancelPending = null;
      emit();
      resolve(result);
    };
    cancelPending = () => {
      // Before it is on screen only: never put an ad over Vent, Vault, Help or breathing.
      if (!loaded) finish("dismissed");
    };
    emit();
    const timer = setTimeout(() => {
      if (!loaded) finish("unavailable");
    }, LOAD_TIMEOUT_MS);
    ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
      if (AppState.currentState !== "active") return finish("dismissed");
      loaded = true;
      ad.show().catch(() => finish("unavailable"));
    });
    ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
      earned = true;
      void reward();
    });
    ad.addAdEventListener(AdEventType.CLOSED, () => finish(earned ? "unlocked" : "dismissed"));
    ad.addAdEventListener(AdEventType.ERROR, () => finish(earned ? "unlocked" : "unavailable"));
    ad.load();
  });
}

/** For the Sanctuary sound list: whether to offer the button, whether an ad is already on its way, and the action. */
export function useRewardedUnlock() {
  const flags = useFlags();
  const ready = useAdsReady();
  const busy = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    isBusy,
    isBusy,
  );
  useFocusEffect(useCallback(() => cancelRewarded, []));
  useEffect(() => {
    const sub = AppState.addEventListener("change", (s) => {
      if (s !== "active") cancelRewarded();
    });
    return () => sub.remove();
  }, []);
  return {
    offer: canOfferRewarded({ flags, ready }),
    busy,
    /** One extra sound for 24 hours. */
    unlock: (id: string) => showRewarded(() => unlockFor24h(id)),
    /** Every extra sound for 24 hours. */
    unlockAll: () => showRewarded(() => unlockAllFor24h(PREMIUM_IDS)),
    /** No banner or native ad for 24 hours. */
    adFree24h: () => showRewarded(() => startAdFree()),
    /** Room for one more saved mix (up to ten in all). */
    earnMixSlot: () =>
      showRewarded(() => setPref("extraMixSlots", Math.min((getPref("extraMixSlots") ?? 0) + 1, MAX_EXTRA_MIX_SLOTS))),
  };
}
