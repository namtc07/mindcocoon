import { promptForDay } from "@mindcocoon/core/prompts";
import { Link } from "expo-router";
import { Text } from "react-native";
import { Muted, Screen } from "@/components/Screen";
import { useI18n } from "@/i18n/i18n";
import { fonts } from "@/theme/fonts";
import { useTheme } from "@/theme/theme";

/** Today — placeholder until M3 (prompt + check-in). */
export default function TodayScreen() {
  const { t, locale } = useI18n();
  const { c } = useTheme();
  return (
    <Screen title={t.nav.today}>
      <Text style={{ fontFamily: fonts.serif, fontSize: 28, lineHeight: 34, color: c.foreground, marginTop: 8 }}>
        {promptForDay(new Date(), locale)}
      </Text>
      <Muted>{t.today.checkinQuestion}</Muted>
      {__DEV__ && (
        <Link href="/dev/spike" style={{ color: c.primary, fontFamily: fonts.sans, marginTop: 24 }}>
          Dev: crypto spike
        </Link>
      )}
    </Screen>
  );
}
