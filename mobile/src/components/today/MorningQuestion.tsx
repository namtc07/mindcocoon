import { useState, useSyncExternalStore } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Chip } from "@/components/ui/Chip";
import { useI18n } from "@/i18n/i18n";
import { getPref, subscribePrefs } from "@/lib/prefs";
import { answerSleep } from "@/lib/sleep-log";
import { questionFor, sleepInsight, type SleepNight, type SleepQuality } from "@/lib/sleep-log-core";
import { fonts } from "@/theme/fonts";
import { radius, space } from "@/theme/tokens";
import { useTheme } from "@/theme/theme";

const NONE: SleepNight[] = [];
const readLog = () => getPref("sleepLog") ?? NONE;

/**
 * The morning after a wind-down or sleep-timer night: "How did you sleep?" with three soft answers.
 * Once answered it thanks you, and — only when the evidence is clear — says wind-down nights go better.
 */
export function MorningQuestion({ now }: { now: Date }) {
  const { t } = useI18n();
  const { c } = useTheme();
  const log = useSyncExternalStore(subscribePrefs, readLog, readLog);
  const [answered, setAnswered] = useState(false);
  const night = questionFor(log, now);
  if (!night && !answered) return null;

  const answer = (quality: SleepQuality) => {
    if (!night) return;
    setAnswered(true);
    void answerSleep(night, quality);
  };
  const options: { id: SleepQuality; label: string }[] = [
    { id: "good", label: t.sleep.good },
    { id: "okay", label: t.sleep.okay },
    { id: "rough", label: t.sleep.rough },
  ];
  return (
    <View testID="morning-question" style={[styles.card, { backgroundColor: c.surface }]}>
      {answered ? (
        <>
          <Text accessibilityLiveRegion="polite" style={[styles.title, { color: c.foreground }]}>
            {t.sleep.thanks}
          </Text>
          {sleepInsight(log) === "wind-down-helps" && <Text style={[styles.small, { color: c.mutedForeground }]}>{t.sleep.windDownHelps}</Text>}
        </>
      ) : (
        <>
          <Text style={[styles.title, { color: c.foreground }]}>{t.sleep.question}</Text>
          <View style={styles.row}>
            {options.map((o) => (
              <Chip key={o.id} selected={false} onPress={() => answer(o.id)}>
                {o.label}
              </Chip>
            ))}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, padding: space.lg, gap: space.md },
  title: { fontFamily: fonts.serif, fontSize: 18, lineHeight: 24 },
  small: { fontFamily: fonts.sans, fontSize: 14, lineHeight: 20 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: space.sm },
});
