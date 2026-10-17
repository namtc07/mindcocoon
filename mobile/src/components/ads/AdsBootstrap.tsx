import { useEffect, useSyncExternalStore } from "react";
import { startAds } from "@/lib/ads/admob";
import { getPref, subscribePrefs } from "@/lib/prefs";
import { useFlags } from "@/lib/remote-config";

const seenFirstRun = () => getPref("firstRunSeen") === true;

/** Starts AdMob once ads are switched on remotely and the welcome has been dismissed. Renders nothing. */
export function AdsBootstrap() {
  const flags = useFlags();
  const firstRunSeen = useSyncExternalStore(subscribePrefs, seenFirstRun, seenFirstRun);
  const wanted = firstRunSeen && (flags.adsEnabled || flags.rewardedEnabled);
  useEffect(() => {
    if (wanted) void startAds();
  }, [wanted]);
  return null;
}
