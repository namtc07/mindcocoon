import { dayKey, dayKeyFromISO, formatDay, isEveningMode, partOfDay } from "@mindcocoon/core/dates";
import { LOW_MOODS } from "@mindcocoon/core/moods";
import { occasionFor } from "@mindcocoon/core/occasions";
import { Link } from "expo-router";
import { Fragment, useSyncExternalStore } from "react";
import { StyleSheet, Text, View } from "react-native";
import { AdBanner } from "@/components/ads/AdBanner";
import { NativeAdCard } from "@/components/ads/NativeAdCard";
import { Ken } from "@/components/art/Ken";
import { Sky } from "@/components/art/Sky";
import { Screen } from "@/components/Screen";
import { HeavyNudge } from "@/components/safety/HeavyNudge";
import { EntryLinks } from "@/components/today/EntryLinks";
import { LetterCard } from "@/components/today/LetterCard";
import { FutureLetterLine } from "@/components/today/FutureLetterLine";
import { MomentReturn } from "@/components/today/MomentReturn";
import { QuickCheckin } from "@/components/today/QuickCheckin";
import { SuggestionCard } from "@/components/today/SuggestionCard";
import { WorryReadyLine } from "@/components/today/WorryReadyLine";
import { ReflectionPrompt } from "@/components/today/ReflectionPrompt";
import { useMoodLogs } from "@/hooks/use-mood-logs";
import { useNow } from "@/hooks/use-now";
import { useI18n } from "@/i18n/i18n";
import { getPref, subscribePrefs } from "@/lib/prefs";
import { todayOrder } from "@/lib/today-order";
import { fonts } from "@/theme/fonts";
import { space } from "@/theme/tokens";
import { useTheme } from "@/theme/theme";
import { ScreenActive } from "@/components/art/activity";

const NO_INTENTS: never[] = [];
const readIntents = () => getPref("intents") ?? NO_INTENTS;
const readName = () => getPref("name") ?? "";
const readIdeas = () => getPref("writingPrompts") !== false;

export default function TodayScreen() {
  const { t, locale } = useI18n();
  const { c } = useTheme();
  const now = useNow();
  const evening = isEveningMode(now);
  const { logs } = useMoodLogs();
  const intents = useSyncExternalStore(subscribePrefs, readIntents, readIntents);
  const name = useSyncExternalStore(subscribePrefs, readName, readName);
  const ideas = useSyncExternalStore(subscribePrefs, readIdeas, readIdeas);
  const part = partOfDay(now);
  const occasion = occasionFor(now);
  const accessory = occasion === "tet" || occasion === "mid-autumn" ? "lantern" : occasion === "christmas" || occasion === "new-year" ? "scarf" : null;
  const greeting = name ? t.today.greetingNamed[part].split("{name}").join(name) : t.today.greeting[part];
  const prompt = (
    <View testID="today-prompt">
      <ReflectionPrompt now={now} />
    </View>
  );
  const checkin = (
    <View testID="today-checkin" style={styles.group}>
      <QuickCheckin />
      <SuggestionCard now={now} />
      <MomentReturn now={now} />
    </View>
  );
  const entries = (
    <View testID="today-entries">
      <EntryLinks evening={evening} />
    </View>
  );
  // The one native ad sits at the very end, and is left out on a low day (heavy, lonely, anxious, angry).
  const todayLog = logs.find((l) => dayKeyFromISO(l.createdAt) === dayKey(now));
  const lowDay = !!todayLog && LOW_MOODS.includes(todayLog.mood);
  const blocks = { checkin, worry: <WorryReadyLine now={now} />, entries, prompt };
  return (
    <ScreenActive>
    <Screen title={greeting} footer={<AdBanner placement="today" />} hero={
        <View>
          <Sky part={part} occasion={occasion} />
          <View style={styles.ken}>
            <Ken mood={part === "night" ? "sleepy" : "calm"} size={56} accessory={accessory} />
          </View>
        </View>
      }>
      <Text style={{ fontFamily: fonts.sans, fontSize: 14, color: c.mutedForeground, marginTop: -space.sm }}>{formatDay(now, locale)}</Text>
      {occasion && <Text style={{ fontFamily: fonts.serifItalic, fontSize: 15, color: c.ember }}>{t.occasions[occasion]}</Text>}
      <View style={styles.sections}>
        <HeavyNudge now={now} />
        <LetterCard now={now} />
        <FutureLetterLine now={now} />
        {/* One keyed list, so blocks move (not remount) when 18:00 / 05:00 comes — a note being typed survives. */}
        {todayOrder(evening, intents)
          .filter((key) => ideas || key !== "prompt")
          .map((key) => (
          <Fragment key={key}>{blocks[key]}</Fragment>
        ))}
        {!lowDay && <NativeAdCard placement="today" />}
        {__DEV__ && (
          <Link href="/dev/spike" style={{ color: c.mutedForeground, fontFamily: fonts.sans, fontSize: 13 }}>
            Dev: crypto spike
          </Link>
        )}
      </View>
    </Screen>
    </ScreenActive>
  );
}

const styles = StyleSheet.create({
  sections: { gap: space.xl, marginTop: space.lg },
  group: { gap: space.lg },
  ken: { position: "absolute", right: space.xl, bottom: -space.sm },
});
