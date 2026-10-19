import { formatDay, isEveningMode, partOfDay } from "@mindcocoon/core/dates";
import { Link } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { AdBanner } from "@/components/ads/AdBanner";
import { Screen } from "@/components/Screen";
import { HeavyNudge } from "@/components/safety/HeavyNudge";
import { EntryLinks } from "@/components/today/EntryLinks";
import { QuickCheckin } from "@/components/today/QuickCheckin";
import { SuggestionCard } from "@/components/today/SuggestionCard";
import { WorryReadyLine } from "@/components/today/WorryReadyLine";
import { ReflectionPrompt } from "@/components/today/ReflectionPrompt";
import { useNow } from "@/hooks/use-now";
import { useI18n } from "@/i18n/i18n";
import { fonts } from "@/theme/fonts";
import { space } from "@/theme/tokens";
import { useTheme } from "@/theme/theme";

export default function TodayScreen() {
  const { t, locale } = useI18n();
  const { c } = useTheme();
  const now = useNow();
  const evening = isEveningMode(now);
  const prompt = (
    <View testID="today-prompt">
      <ReflectionPrompt now={now} />
    </View>
  );
  const checkin = (
    <View testID="today-checkin" style={styles.group}>
      <QuickCheckin />
      <SuggestionCard now={now} />
    </View>
  );
  const entries = (
    <View testID="today-entries">
      <EntryLinks evening={evening} />
    </View>
  );
  return (
    <Screen title={t.today.greeting[partOfDay(now)]}>
      <Text style={{ fontFamily: fonts.sans, fontSize: 14, color: c.mutedForeground, marginTop: -space.sm }}>{formatDay(now, locale)}</Text>
      <View style={styles.sections}>
        <HeavyNudge now={now} />
        {evening ? (
          // Night: name the feeling, get something for it, wind down; writing prompts come last.
          <>
            {checkin}
            {entries}
            {prompt}
          </>
        ) : (
          <>
            <WorryReadyLine now={now} />
            {prompt}
            {checkin}
            {entries}
          </>
        )}
        {__DEV__ && (
          <Link href="/dev/spike" style={{ color: c.mutedForeground, fontFamily: fonts.sans, fontSize: 13 }}>
            Dev: crypto spike
          </Link>
        )}
      </View>
      <AdBanner placement="today" />
    </Screen>
  );
}

const styles = StyleSheet.create({ sections: { gap: space.xxl, marginTop: space.lg }, group: { gap: space.xxl } });
