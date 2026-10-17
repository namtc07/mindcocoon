import { dayKey, formatDay } from "@mindcocoon/core/dates";
import { monthGrid, type DayCell } from "@mindcocoon/core/mood/selectors";
import { MOODS } from "@mindcocoon/core/moods";
import type { MoodLog } from "@mindcocoon/core/types";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useI18n } from "@/i18n/i18n";
import { fonts } from "@/theme/fonts";
import { space } from "@/theme/tokens";
import { useTheme } from "@/theme/theme";

const GAP = 2;

export function MonthHeatmap({ logs, now, onSelect }: { logs: MoodLog[]; now: Date; onSelect: (day: DayCell) => void }) {
  const { t, locale } = useI18n();
  const { c } = useTheme();
  const [view, setView] = useState({ year: now.getFullYear(), month: now.getMonth() });
  const atCurrent = view.year === now.getFullYear() && view.month === now.getMonth();
  const todayKey = dayKey(now);
  const cells = monthGrid(logs, view.year, view.month);
  const title = new Date(view.year, view.month, 1).toLocaleDateString(locale, { month: "long", year: "numeric" });
  const shift = (delta: number) =>
    setView(({ year, month }) => {
      const d = new Date(year, month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  // Monday-first weekday initials from a known Monday (2024-01-01).
  const weekdays = Array.from({ length: 7 }, (_, i) => new Date(2024, 0, 1 + i).toLocaleDateString(locale, { weekday: "narrow" }));

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={[styles.h, { color: c.foreground }]}>{title}</Text>
        <View style={styles.nav}>
          <Pressable accessibilityRole="button" accessibilityLabel={t.moodPage.prevMonth} hitSlop={8} onPress={() => shift(-1)} style={styles.navBtn}>
            <ChevronLeft size={20} color={c.foreground} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.moodPage.nextMonth}
            accessibilityState={{ disabled: atCurrent }}
            disabled={atCurrent}
            hitSlop={8}
            onPress={() => shift(1)}
            style={[styles.navBtn, atCurrent && { opacity: 0.35 }]}
          >
            <ChevronRight size={20} color={c.foreground} />
          </Pressable>
        </View>
      </View>
      <View style={styles.grid}>
        {weekdays.map((w, i) => (
          <Text key={`w${i}`} style={[styles.cell, styles.weekday, { color: c.mutedForeground }]}>
            {w}
          </Text>
        ))}
        {cells.map((cell, i) => {
          if (!cell) return <View key={`e${i}`} style={styles.cell} />;
          const mood = cell.log?.mood;
          const isToday = cell.dayKey === todayKey;
          const label = [formatDay(cell.date, locale), mood ? t.mood.states[mood].label : t.moodPage.noMood, isToday ? t.moodPage.today : null]
            .filter(Boolean)
            .join(", ");
          return (
            <View key={cell.dayKey} style={styles.cell}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={label}
                onPress={() => onSelect(cell)}
                style={[styles.day, { backgroundColor: mood ? c.mood[mood] : c.surface }, isToday && { borderWidth: 2, borderColor: c.foreground }]}
              >
                <Text style={{ fontFamily: fonts.sans, fontSize: 11, color: mood ? "#0F172A" : c.mutedForeground }}>{cell.date.getDate()}</Text>
              </Pressable>
            </View>
          );
        })}
      </View>
      <View role="list" accessibilityLabel={t.moodPage.legend} style={styles.legend}>
        {MOODS.map((m) => (
          <View key={m.id} role="listitem" accessible accessibilityLabel={t.mood.states[m.id].label} style={styles.legendItem}>
            <View style={[styles.swatch, { backgroundColor: c.mood[m.id] }]} />
            <Text style={{ fontFamily: fonts.sans, fontSize: 13, color: c.mutedForeground }}>{t.mood.states[m.id].label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.md },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  h: { fontFamily: fonts.sansMedium, fontSize: 16, textTransform: "capitalize" },
  nav: { flexDirection: "row", gap: space.sm },
  navBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  grid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -GAP / 2 },
  cell: { width: `${100 / 7}%`, aspectRatio: 1, padding: GAP / 2 },
  weekday: { aspectRatio: undefined, textAlign: "center", fontFamily: fonts.sans, fontSize: 12, paddingBottom: 4 },
  day: { flex: 1, borderRadius: 4, alignItems: "center", justifyContent: "center" },
  legend: { flexDirection: "row", flexWrap: "wrap", gap: space.md },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  swatch: { width: 12, height: 12, borderRadius: 3 },
});
