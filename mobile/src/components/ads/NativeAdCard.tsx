import { dayKey } from "@mindcocoon/core/dates";
import { X } from "lucide-react-native";
import { useEffect, useState, useSyncExternalStore } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { NativeAd, NativeAdView, NativeAsset, NativeAssetType } from "react-native-google-mobile-ads";
import { useNow } from "@/hooks/use-now";
import { useI18n } from "@/i18n/i18n";
import { AD_REQUEST, adUnitId, useAdsReady } from "@/lib/ads/admob";
import { canShowBanner } from "@/lib/ads/policy";
import { toast } from "@/components/ui/Toast";
import { useRewardedUnlock } from "@/hooks/use-rewarded-unlock";
import { useAdFreeUntil } from "@/lib/ads/ad-free";
import { getPref, setPref, subscribePrefs } from "@/lib/prefs";
import { useFlags } from "@/lib/remote-config";
import { fonts } from "@/theme/fonts";
import { radius, space } from "@/theme/tokens";
import { useTheme } from "@/theme/theme";

/**
 * One native ad, shaped like the app's cards but always labelled "Ad" (the SDK adds AdChoices).
 * Placed like other journaling apps do: at the end of Today, and among past check-ins on Mood —
 * never right after someone names a feeling. Same switches as the banner (remote flag, consent,
 * quiet hours); nothing shows if nothing loads; the ad is released when its screen goes away.
 */
const readHidden = () => getPref("nativeHiddenOn") ?? "";

export function NativeAdCard({ placement }: { placement: "today" | "mood" }) {
  const { t } = useI18n();
  const { c } = useTheme();
  const flags = useFlags();
  const ready = useAdsReady();
  const now = useNow();
  const adFreeUntil = useAdFreeUntil();
  const hiddenOn = useSyncExternalStore(subscribePrefs, readHidden, readHidden);
  const { offer, adFree24h } = useRewardedUnlock();
  // Hidden by the person for today, or ads off for 24 hours: no request at all.
  const allowed =
    canShowBanner({ placement, now, flags, ready }) && hiddenOn !== dayKey(now) && now.getTime() >= adFreeUntil;

  /** × : gone until tomorrow; then, only if they want, one short ad turns all ads off for a day. */
  function hide() {
    void setPref("nativeHiddenOn", dayKey(now));
    toast.show(t.ads.hidden, offer ? { label: t.ads.adFree24h, onPress: () => void adFree24h() } : undefined);
  }
  const unitId = adUnitId(placement === "today" ? "native-today" : "native-mood");
  const [ad, setAd] = useState<NativeAd | null>(null);

  useEffect(() => {
    if (!allowed || !unitId) return;
    let live = true;
    let loaded: NativeAd | null = null;
    NativeAd.createForAdRequest(unitId, AD_REQUEST)
      .then((next) => {
        if (!live) return next.destroy();
        loaded = next;
        setAd(next);
      })
      .catch(() => {});
    return () => {
      live = false;
      loaded?.destroy();
      setAd(null);
    };
  }, [allowed, unitId]);

  if (!allowed || !ad) return null;
  return (
    <NativeAdView nativeAd={ad} testID="native-ad" style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
      <View style={styles.top}>
        <Text style={[styles.label, { color: c.mutedForeground, borderColor: c.border }]}>{t.ads.label}</Text>
        {ad.advertiser ? (
          <NativeAsset assetType={NativeAssetType.ADVERTISER}>
            <Text numberOfLines={1} style={[styles.advertiser, { color: c.mutedForeground }]}>
              {ad.advertiser}
            </Text>
          </NativeAsset>
        ) : null}
        {/* Our own control, kept apart from the ad's content (never over it). */}
        <Pressable accessibilityRole="button" accessibilityLabel={t.ads.hideToday} hitSlop={10} onPress={hide} style={styles.close}>
          <X size={16} color={c.mutedForeground} />
        </Pressable>
      </View>
      <View style={styles.row}>
        {ad.icon?.url ? (
          <NativeAsset assetType={NativeAssetType.ICON}>
            <Image source={{ uri: ad.icon.url }} style={styles.icon} accessibilityIgnoresInvertColors />
          </NativeAsset>
        ) : null}
        <View style={styles.text}>
          <NativeAsset assetType={NativeAssetType.HEADLINE}>
            <Text numberOfLines={2} style={[styles.headline, { color: c.foreground }]}>
              {ad.headline}
            </Text>
          </NativeAsset>
          {ad.body ? (
            <NativeAsset assetType={NativeAssetType.BODY}>
              <Text numberOfLines={2} style={[styles.body, { color: c.mutedForeground }]}>
                {ad.body}
              </Text>
            </NativeAsset>
          ) : null}
        </View>
      </View>
      {ad.callToAction ? (
        <NativeAsset assetType={NativeAssetType.CALL_TO_ACTION}>
          <Text style={[styles.cta, { color: c.primary, borderColor: c.primary }]}>{ad.callToAction}</Text>
        </NativeAsset>
      ) : null}
    </NativeAdView>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, padding: space.lg, gap: space.md },
  top: { flexDirection: "row", alignItems: "center", gap: space.sm },
  close: { marginLeft: "auto", width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  label: { fontFamily: fonts.sansMedium, fontSize: 11, borderWidth: 1, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 },
  advertiser: { fontFamily: fonts.sans, fontSize: 12, flexShrink: 1 },
  row: { flexDirection: "row", gap: space.md, alignItems: "center" },
  icon: { width: 44, height: 44, borderRadius: radius.md },
  text: { flex: 1, gap: 2 },
  headline: { fontFamily: fonts.sansMedium, fontSize: 15, lineHeight: 20 },
  body: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 18 },
  cta: { alignSelf: "flex-start", fontFamily: fonts.sansMedium, fontSize: 14, borderWidth: 1, borderRadius: radius.full, paddingHorizontal: space.lg, paddingVertical: 8, overflow: "hidden" },
});
