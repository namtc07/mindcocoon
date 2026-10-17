import { formatShortDay, formatWeekdayInitial } from "@mindcocoon/core/dates";
import { weekStrip } from "@mindcocoon/core/mood/selectors";
import type { MoodLog } from "@mindcocoon/core/types";
import { StyleSheet, Text, View } from "react-native";
import { useI18n } from "@/i18n/i18n";
import { fonts } from "@/theme/fonts";
import { space } from "@/theme/tokens";
import { useTheme } from "@/theme/theme";

export function WeekStrip({ logs, now }: { logs: MoodLog[]; now: Date }) {
  const { t, locale } = useI18n();
  const { c } = useTheme();
  return (
    <View style={styles.wrap}>
      <Text style={[styles.h, { color: c.foreground }]}>{t.moodPage.week}</Text>
      <View role="list" accessibilityLabel={t.moodPage.week} style={styles.row}>
        {weekStrip(logs, now).map((day) => {
          const mood = day.log?.mood;
          return (
            <View
              key={day.dayKey}
              role="listitem"
              accessible
              accessibilityLabel={`${formatShortDay(day.date, locale)}, ${mood ? t.mood.states[mood].label : t.moodPage.noMood}`}
              style={styles.day}
            >
              <View
                style={[
                  styles.dot,
                  mood ? { backgroundColor: c.mood[mood] } : { borderWidth: 1.5, borderStyle: "dashed", borderColor: c.border },
                ]}
              />
              <Text style={{ fontFamily: fonts.sans, fontSize: 12, color: c.mutedForeground }}>{formatWeekdayInitial(day.date, locale)}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.md },
  h: { fontFamily: fonts.sansMedium, fontSize: 16 },
  row: { flexDirection: "row", justifyContent: "space-between" },
  day: { alignItems: "center", gap: 6 },
  dot: { width: 30, height: 30, borderRadius: 15 },
});
