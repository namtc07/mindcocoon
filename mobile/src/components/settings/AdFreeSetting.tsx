import { formatTime } from "@mindcocoon/core/dates";
import { Text } from "react-native";
import { toast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import { useNow } from "@/hooks/use-now";
import { useRewardedUnlock } from "@/hooks/use-rewarded-unlock";
import { useI18n } from "@/i18n/i18n";
import { useAdFreeUntil } from "@/lib/ads/ad-free";
import { fonts } from "@/theme/fonts";
import { useTheme } from "@/theme/theme";

/** "Watch one ad to turn ads off for 24 hours" — or, while it lasts, until when. Only when rewarded ads are on. */
export function AdFreeSetting() {
  const { t, locale } = useI18n();
  const { c } = useTheme();
  const now = useNow();
  const until = useAdFreeUntil();
  const { offer, busy, adFree24h } = useRewardedUnlock();
  if (until > now.getTime()) {
    return (
      <Text style={{ fontFamily: fonts.sans, fontSize: 15, color: c.mutedForeground }}>
        {t.settings.adFreeUntil.replace("{time}", formatTime(new Date(until).toISOString(), locale))}
      </Text>
    );
  }
  if (!offer) return null;
  return (
    <Button
      variant="outline"
      disabled={busy}
      onPress={() =>
        void adFree24h().then((r) => {
          if (r === "unavailable") toast.show(t.sanctuary.adUnavailable);
        })
      }
    >
      {t.settings.adFreeWithAd}
    </Button>
  );
}
