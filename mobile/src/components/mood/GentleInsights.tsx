import { gentleInsights, type Insight } from "@mindcocoon/core/mood/insights";
import type { MoodType } from "@mindcocoon/core/types";
import { Sparkles } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";
import { useFeelingLabels } from "@/components/mood/FeelingChips";
import { useTagLabel } from "@/components/mood/CheckinForm";
import { useMoodLogs } from "@/hooks/use-mood-logs";
import { useNow } from "@/hooks/use-now";
import { useI18n } from "@/i18n/i18n";
import { fonts } from "@/theme/fonts";
import { radius, space } from "@/theme/tokens";
import { useTheme } from "@/theme/theme";

/** "Gently noticed": up to three patterns in words, from this phone's check-ins only. Hidden when there's too little. */
export function GentleInsights() {
  const { t } = useI18n();
  const { c } = useTheme();
  const now = useNow();
  const { logs } = useMoodLogs();
  const tagLabel = useTagLabel();
  const feelingLabel = useFeelingLabels();
  const insights = gentleInsights(logs, now);
  if (!insights.length) return null;
  const moodWord = (m: MoodType) => t.mood.states[m].label.toLowerCase();
  const sentence = (i: Insight) =>
    i.kind === "tag-mood"
      ? t.insights.tagMood.replace("{tag}", tagLabel(i.tag)).replace("{mood}", moodWord(i.mood))
      : i.kind === "feeling-lately"
        ? t.insights.feelingLately.replace("{word}", feelingLabel([i.word]))
        : t.insights.lateNight.replace("{mood}", moodWord(i.mood));
  return (
    <View testID="mood-insights" style={[styles.card, { backgroundColor: c.surface }]}>
      <View style={styles.head}>
        <Sparkles size={16} color={c.mutedForeground} />
        <Text accessibilityRole="header" style={{ fontFamily: fonts.serif, fontSize: 20, color: c.foreground }}>
          {t.insights.title}
        </Text>
      </View>
      {insights.map((i) => (
        <Text key={i.kind} style={[styles.line, { color: c.foreground }]}>
          {sentence(i)}
        </Text>
      ))}
      <Text style={[styles.hint, { color: c.mutedForeground }]}>{t.insights.hint}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, padding: space.xl, gap: space.md },
  head: { flexDirection: "row", alignItems: "center", gap: space.sm },
  line: { fontFamily: fonts.sans, fontSize: 16, lineHeight: 23 },
  hint: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 18 },
});
