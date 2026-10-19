import { yearGrid } from "@mindcocoon/core/mood/selectors";
import type { MoodLog } from "@mindcocoon/core/types";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useI18n } from "@/i18n/i18n";
import { fonts } from "@/theme/fonts";
import { space } from "@/theme/tokens";
import { useTheme } from "@/theme/theme";

const MAX_CELL = 8;
const GAP = 2;
const MAX_DAYS = 31;

/** The whole year: one row per month, one small square per day in that day's mood colour. Nothing counted. */
export function YearPixels({ logs, now }: { logs: MoodLog[]; now: Date }) {
  const { t, locale } = useI18n();
  const { c } = useTheme();
  const year = now.getFullYear();
  const months = yearGrid(logs, year);
  // Squares shrink so a 31-day month always fits on one line, whatever the phone width.
  const [cell, setCell] = useState(MAX_CELL);
  const monthName = (m: number) => new Date(year, m, 1).toLocaleDateString(locale === "vi" ? "vi-VN" : "en-US", { month: "short" });
  return (
    <View accessible accessibilityLabel={t.moodPage.yearLabel} style={styles.wrap}>
      <Text style={{ fontFamily: fonts.serif, fontSize: 20, color: c.foreground }}>{year}</Text>
      {months.map((days, m) => (
        <View key={m} testID="year-month" style={styles.row}>
          <Text style={[styles.month, { color: c.mutedForeground }]}>{monthName(m)}</Text>
          <View
            testID="year-days"
            style={styles.days}
            onLayout={(e) => {
              const fit = Math.max(2, Math.min(MAX_CELL, Math.floor((e.nativeEvent.layout.width - (MAX_DAYS - 1) * GAP) / MAX_DAYS)));
              if (m === 0 && fit !== cell) setCell(fit);
            }}
          >
            {days.map((d) => (
              <View
                key={d.dayKey}
                testID="year-day"
                style={[
                  styles.cell,
                  { width: cell, height: cell },
                  { backgroundColor: d.log ? c.mood[d.log.mood] : c.muted, opacity: d.date > now ? 0.35 : 1 },
                ]}
              />
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: GAP + 2 },
  row: { flexDirection: "row", alignItems: "center", gap: space.sm },
  month: { fontFamily: fonts.sans, fontSize: 11, width: 34 },
  days: { flexDirection: "row", flexWrap: "nowrap", gap: GAP, flex: 1 },
  cell: { borderRadius: 2 },
});
