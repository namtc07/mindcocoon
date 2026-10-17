import { AdEventType, RewardedAd, RewardedAdEventType } from "react-native-google-mobile-ads";
import { AD_REQUEST, adUnitId, useAdsReady } from "@/lib/ads/admob";
import { canOfferRewarded } from "@/lib/ads/policy";
import { useFlags } from "@/lib/remote-config";
import { unlockFor24h } from "@/lib/unlocks";

export type UnlockResult = "unlocked" | "unavailable" | "dismissed";

const LOAD_TIMEOUT_MS = 10_000;

/** Shows one rewarded ad on request; the sound unlocks for 24 hours only if the reward was earned. */
function showRewarded(id: string): Promise<UnlockResult> {
  const unitId = adUnitId("rewarded");
  if (!unitId) return Promise.resolve("unavailable");
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
      resolve(result);
    };
    const timer = setTimeout(() => {
      if (!loaded) finish("unavailable");
    }, LOAD_TIMEOUT_MS);
    ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
      loaded = true;
      ad.show().catch(() => finish("unavailable"));
    });
    ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
      earned = true;
      void unlockFor24h(id);
    });
    ad.addAdEventListener(AdEventType.CLOSED, () => finish(earned ? "unlocked" : "dismissed"));
    ad.addAdEventListener(AdEventType.ERROR, () => finish(earned ? "unlocked" : "unavailable"));
    ad.load();
  });
}

export function useRewardedUnlock() {
  const flags = useFlags();
  const ready = useAdsReady();
  return { offer: canOfferRewarded({ flags, ready }), unlock: showRewarded };
}
