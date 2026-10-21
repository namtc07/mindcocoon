import { monthGrid, type DayCell } from "@mindcocoon/core/mood/selectors";
import type { MoodLog } from "@mindcocoon/core/types";
import { router } from "expo-router";
import { useSyncExternalStore } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/i18n/i18n";
import { getPref, setPref, subscribePrefs } from "@/lib/prefs";
import { fonts } from "@/theme/fonts";
import { space } from "@/theme/tokens";
import { useTheme } from "@/theme/theme";

const readInviteMonth = () => getPref("journeyInviteMonth");

/**
 * This month as a strip of quiet colour squares on Today — the same pixels the Mood tab
 * shows in full. Visual only: no counts, no streaks, nothing to keep up. Near the month's
 * end, if there are evenings to look back on, it gently offers the shareable month picture
 * (JourneyCard on the Mood tab) — once per month, and only when taken up.
 */
export function MonthPixels({ logs, now }: { logs: readonly MoodLog[]; now: Date }) {
  const { t } = useI18n();
  const { c } = useTheme();
  const inviteMonth = useSyncExternalStore(subscribePrefs, readInviteMonth, readInviteMonth);
  const year = now.getFullYear();
  const month = now.getMonth();
  const cells = monthGrid([...logs], year, month).filter((cell): cell is DayCell => cell !== null);
  const loggedDays = cells.filter((cell) => cell.log).length;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const monthKey = `${year}-${String(month + 1).padStart(2, "0")}`;
  const invite = now.getDate() >= lastDay - 1 && loggedDays >= 5 && inviteMonth !== monthKey;
  const openMood = () => router.push("/mood");

  return (
    <View style={styles.wrap}>
      <Pressable
        testID="month-pixels"
        accessibilityRole="button"
        accessibilityLabel={t.today.monthPixels}
        onPress={openMood}
        style={styles.strip}
      >
        <Text style={[styles.label, { color: c.mutedForeground }]}>{t.today.monthPixels}</Text>
        <View style={styles.row}>
          {cells.map((cell) => (
            <View
              key={cell.dayKey}
              testID="month-pixel"
              style={[
                styles.pixel,
                {
                  backgroundColor: cell.log ? c.mood[cell.log.mood] : c.muted,
                  opacity: cell.date.getTime() > now.getTime() ? 0.35 : 1,
                },
              ]}
            />
          ))}
        </View>
      </Pressable>
      {invite && (
        <View testID="month-journey-invite" style={[styles.invite, { backgroundColor: c.surface }]}>
          <Text style={[styles.inviteText, { color: c.foreground }]}>{t.today.journeyInvite}</Text>
          <Button
            variant="outline"
            onPress={() => {
              void setPref("journeyInviteMonth", monthKey);
              openMood();
            }}
          >
            {t.today.journeyOpen}
          </Button>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.md },
  strip: { gap: space.sm },
  label: { fontFamily: fonts.serifItalic, fontSize: 15 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 3 },
  pixel: { width: 14, height: 14, borderRadius: 4 },
  invite: { borderRadius: 16, padding: space.md, gap: space.sm },
  inviteText: { fontFamily: fonts.serif, fontSize: 16, lineHeight: 22 },
});
