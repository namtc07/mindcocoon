import { usePathname } from "expo-router";
import { useEffect, useSyncExternalStore } from "react";
import { startAds } from "@/lib/ads/admob";
import { getPref, subscribePrefs } from "@/lib/prefs";
import { useFlags } from "@/lib/remote-config";

const seenFirstRun = () => getPref("firstRunSeen") === true;

/** Only screens that may carry a banner: the consent form must never cover Vent, Vault, breathing or Help. */
const AD_SCREENS = new Set(["/", "/mood"]);

/** Starts AdMob (consent first) once ads are switched on, the welcome is dismissed and Today or Mood is open. Renders nothing. */
export function AdsBootstrap() {
  const flags = useFlags();
  const firstRunSeen = useSyncExternalStore(subscribePrefs, seenFirstRun, seenFirstRun);
  const onAdScreen = AD_SCREENS.has(usePathname());
  const wanted = firstRunSeen && onAdScreen && (flags.adsEnabled || flags.rewardedEnabled);
  useEffect(() => {
    if (wanted) void startAds();
  }, [wanted]);
  return null;
}
