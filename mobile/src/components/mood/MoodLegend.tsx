import { MOODS } from "@mindcocoon/core/moods";
import { StyleSheet, Text, View } from "react-native";
import { useI18n } from "@/i18n/i18n";
import { fonts } from "@/theme/fonts";
import { space } from "@/theme/tokens";
import { useTheme } from "@/theme/theme";

/** What each colour means — shown under the month and the year, so colour is never the only cue. */
export function MoodLegend() {
  const { t } = useI18n();
  const { c } = useTheme();
  return (
    <View role="list" accessibilityLabel={t.moodPage.legend} style={styles.legend}>
      {MOODS.map((m) => (
        <View key={m.id} role="listitem" accessible accessibilityLabel={t.mood.states[m.id].label} style={styles.item}>
          <View style={[styles.swatch, { backgroundColor: c.mood[m.id] }]} />
          <Text style={{ fontFamily: fonts.sans, fontSize: 13, color: c.mutedForeground }}>{t.mood.states[m.id].label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  legend: { flexDirection: "row", flexWrap: "wrap", columnGap: space.md, rowGap: space.sm },
  item: { flexDirection: "row", alignItems: "center", gap: 6 },
  swatch: { width: 12, height: 12, borderRadius: 6 },
});
