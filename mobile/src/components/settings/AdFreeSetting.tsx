import { formatTime } from "@mindcocoon/core/dates";
import { Text } from "react-native";
import { toast } from "@/components/ui/Toast";
import { Sparkles } from "lucide-react-native";
import { SettingsRow } from "./SettingsGroup";
import { useNow } from "@/hooks/use-now";
import { useRewardedUnlock } from "@/hooks/use-rewarded-unlock";
import { useI18n } from "@/i18n/i18n";
import { useAdFreeUntil } from "@/lib/ads/ad-free";
import { fonts } from "@/theme/fonts";
import { useTheme } from "@/theme/theme";

/** "Watch one ad to turn ads off for N hours" (remote ad_free_*) — or, while it lasts, until when. */
export function AdFreeSetting() {
  const { t, locale } = useI18n();
  const { c } = useTheme();
  const now = useNow();
  const until = useAdFreeUntil();
  const { adFreeOffer, adFreeHours, busy, adFree } = useRewardedUnlock();
  if (until > now.getTime()) {
    return (
      <Text style={{ fontFamily: fonts.sans, fontSize: 15, color: c.mutedForeground, paddingVertical: 10 }}>
        {t.settings.adFreeUntil.replace("{time}", formatTime(new Date(until).toISOString(), locale))}
      </Text>
    );
  }
  if (!adFreeOffer) return null;
  return (
    <SettingsRow
      icon={Sparkles}
      role="button"
      disabled={busy}
      label={t.settings.adFreeWithAd.replace("{hours}", String(adFreeHours))}
      onPress={() =>
        void adFree().then((r) => {
          if (r === "unavailable") toast.show(t.sanctuary.adUnavailable);
        })
      }
    />
  );
}
