import { StyleSheet, Text, View } from "react-native";
import { Chip } from "@/components/ui/Chip";
import { useNow } from "@/hooks/use-now";
import { useI18n } from "@/i18n/i18n";
import { audio, useAudio } from "@/lib/audio";
import { SLEEP_OPTIONS, sleepMinutesLeft, type SleepMinutes } from "@/lib/audio/engine";
import { fonts } from "@/theme/fonts";
import { space } from "@/theme/tokens";
import { useTheme } from "@/theme/theme";

/** Stops every sound after 10–60 minutes, fading out over the last one. */
export function SleepTimer() {
  const { t } = useI18n();
  const { c } = useTheme();
  const state = useAudio();
  const now = useNow();
  const left = sleepMinutesLeft(state, now.getTime());
  const minutes = (n: number) => t.sanctuary.minutes.replace("{n}", String(n));
  const choose = (n: SleepMinutes | null) => audio.setSleepTimer(n);

  return (
    <View style={styles.wrap}>
      <Text accessibilityRole="header" style={[styles.label, { color: c.mutedForeground }]}>
        {t.sanctuary.sleepTimer}
      </Text>
      <View style={styles.chips}>
        <Chip selected={state.sleepMinutes === null} onPress={() => choose(null)}>
          {t.sanctuary.sleepOff}
        </Chip>
        {SLEEP_OPTIONS.map((n) => (
          <Chip key={n} selected={state.sleepMinutes === n} onPress={() => choose(n)}>
            {minutes(n)}
          </Chip>
        ))}
      </View>
      {left !== null && (
        <Text accessibilityLiveRegion="polite" style={[styles.label, { color: c.mutedForeground }]}>
          {t.sanctuary.sleepIn.replace("{time}", minutes(left))}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.md },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: space.sm },
  label: { fontFamily: fonts.sans, fontSize: 15 },
});
