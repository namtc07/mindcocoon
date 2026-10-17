import { formatDay, formatTime } from "@mindcocoon/core/dates";
import { removeMood } from "@mindcocoon/core/mood/store";
import type { MoodLog } from "@mindcocoon/core/types";
import { Trash2 } from "lucide-react-native";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useI18n } from "@/i18n/i18n";
import { fonts } from "@/theme/fonts";
import { space } from "@/theme/tokens";
import { useTheme } from "@/theme/theme";
import { useTagLabel } from "./CheckinForm";

const LIMIT = 30;

export function MoodHistory({ logs }: { logs: MoodLog[] }) {
  const { t, locale } = useI18n();
  const { c } = useTheme();
  const tagLabel = useTagLabel();
  const latest = [...logs].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, LIMIT);

  function confirmDelete(log: MoodLog) {
    Alert.alert(t.moodPage.deleteEntry, undefined, [
      { text: t.common.cancel, style: "cancel" },
      { text: t.common.delete, style: "destructive", onPress: () => void removeMood(log.id) },
    ]);
  }

  return (
    <View style={{ gap: space.md }}>
      <Text style={{ fontFamily: fonts.sansMedium, fontSize: 16, color: c.foreground }}>{t.moodPage.history}</Text>
      {latest.length === 0 ? (
        <Text style={{ fontFamily: fonts.sans, fontSize: 15, color: c.mutedForeground }}>{t.moodPage.emptyHistory}</Text>
      ) : (
        <View role="list" accessibilityLabel={t.moodPage.history}>
          {latest.map((log, i) => (
            <View key={log.id} role="listitem" accessibilityLabel={t.mood.states[log.mood].label} style={[styles.item, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border }]}>
              <View style={[styles.dot, { backgroundColor: c.mood[log.mood] }]} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={{ fontFamily: fonts.sansMedium, fontSize: 15, color: c.foreground }}>{t.mood.states[log.mood].label}</Text>
                <Text style={{ fontFamily: fonts.sans, fontSize: 13, color: c.mutedForeground }}>
                  {[formatDay(new Date(log.createdAt), locale), formatTime(log.createdAt, locale), ...log.tags.map(tagLabel)].join(" · ")}
                </Text>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel={t.moodPage.deleteEntry} hitSlop={8} onPress={() => confirmDelete(log)} style={styles.del}>
                <Trash2 size={18} color={c.mutedForeground} />
              </Pressable>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  item: { flexDirection: "row", alignItems: "center", gap: space.md, paddingVertical: space.md },
  dot: { width: 14, height: 14, borderRadius: 7 },
  del: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
});
