import { dayKeyFromISO, formatDay, formatTime } from "@mindcocoon/core/dates";
import type { DayCell } from "@mindcocoon/core/mood/selectors";
import { readNote } from "@mindcocoon/core/mood/store";
import type { MoodLog } from "@mindcocoon/core/types";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Sheet } from "@/components/ui/Sheet";
import { useI18n } from "@/i18n/i18n";
import { fonts } from "@/theme/fonts";
import { space } from "@/theme/tokens";
import { useTheme } from "@/theme/theme";
import { useTagLabel } from "./CheckinForm";

function LogRow({ log }: { log: MoodLog }) {
  const { t, locale } = useI18n();
  const { c } = useTheme();
  const tagLabel = useTagLabel();
  const [note, setNote] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    readNote(log)
      .then((n) => live && setNote(n))
      .catch(() => live && setNote(null));
    return () => {
      live = false;
    };
  }, [log]);
  return (
    <View style={styles.row}>
      <View style={[styles.dot, { backgroundColor: c.mood[log.mood] }]} />
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={{ fontFamily: fonts.sansMedium, fontSize: 15, color: c.foreground }}>
          {t.mood.states[log.mood].label} · {formatTime(log.createdAt, locale)}
        </Text>
        {log.tags.length > 0 && <Text style={{ fontFamily: fonts.sans, fontSize: 14, color: c.mutedForeground }}>{log.tags.map(tagLabel).join(", ")}</Text>}
        {note ? <Text style={{ fontFamily: fonts.serif, fontSize: 17, lineHeight: 25, color: c.foreground }}>{note}</Text> : null}
      </View>
    </View>
  );
}

/** Every check-in on one day, with tags and decrypted notes (notes stay hidden while locked). */
export function DayDetail({ day, logs, onClose }: { day: DayCell | null; logs: MoodLog[]; onClose: () => void }) {
  const { t, locale } = useI18n();
  const { c } = useTheme();
  const ofDay = day ? logs.filter((l) => dayKeyFromISO(l.createdAt) === day.dayKey) : [];
  return (
    <Sheet visible={day !== null} onClose={onClose} title={day ? formatDay(day.date, locale) : ""}>
      {ofDay.length === 0 ? (
        <Text style={{ fontFamily: fonts.sans, fontSize: 15, color: c.mutedForeground }}>{t.moodPage.emptyDay}</Text>
      ) : (
        ofDay.map((log) => <LogRow key={log.id} log={log} />)
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: space.md, alignItems: "flex-start" },
  dot: { width: 14, height: 14, borderRadius: 7, marginTop: 4 },
});
