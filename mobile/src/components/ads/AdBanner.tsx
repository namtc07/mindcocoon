import { useState } from "react";
import { View } from "react-native";
import { BannerAd, BannerAdSize } from "react-native-google-mobile-ads";
import { useNow } from "@/hooks/use-now";
import { AD_REQUEST, adUnitId, useAdsReady } from "@/lib/ads/admob";
import { canShowBanner, type AdPlacement } from "@/lib/ads/policy";
import { useFlags } from "@/lib/remote-config";
import { space } from "@/theme/tokens";

/**
 * The one banner, at the end of Today or Mood (only ever placed there). Hidden when ads are
 * off, before AdMob is ready and in quiet hours; collapses if nothing loads.
 */
export function AdBanner({ placement }: { placement: AdPlacement }) {
  const flags = useFlags();
  const ready = useAdsReady();
  const now = useNow();
  const [failed, setFailed] = useState(false);
  const unitId = adUnitId(placement === "today" ? "banner-today" : "banner-mood");
  if (failed || !unitId || !canShowBanner({ placement, now, flags, ready })) return null;
  return (
    <View testID="ad-banner" style={{ marginTop: space.xl, alignItems: "center" }}>
      <BannerAd unitId={unitId} size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER} requestOptions={AD_REQUEST} onAdFailedToLoad={() => setFailed(true)} />
    </View>
  );
}
