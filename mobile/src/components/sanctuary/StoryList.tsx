import { isNew } from "@mindcocoon/core/remote-content";
import { STORIES } from "@mindcocoon/core/stories";
import { useNow } from "@/hooks/use-now";
import { useRemoteContent } from "@/lib/remote-content";
import { router } from "expo-router";
import { BookOpen, ChevronRight } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useI18n } from "@/i18n/i18n";
import { fonts } from "@/theme/fonts";
import { radius, space } from "@/theme/tokens";
import { useTheme } from "@/theme/theme";

/** Sleep stories, each opening a page the phone can read aloud. */
export function StoryList() {
  const { t, locale } = useI18n();
  const { c } = useTheme();
  const extra = useRemoteContent().stories[locale];
  const now = useNow();
  return (
    <View style={[styles.card, { backgroundColor: c.surface }]}>
      {[...STORIES[locale], ...extra].map((s, i) => {
        const fresh = isNew((s as { addedAt?: string }).addedAt, now);
        return (
        <Pressable
          key={s.id}
          accessibilityRole="link"
          accessibilityLabel={fresh ? `${s.title}. ${t.content.new}. ${s.summary}` : `${s.title}. ${s.summary}`}
          onPress={() => router.push({ pathname: "/stories/[id]", params: { id: s.id } })}
          style={[styles.row, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border }]}
        >
          <BookOpen size={18} color={c.mutedForeground} />
          <View style={styles.text}>
            <Text style={{ fontFamily: fonts.sansMedium, fontSize: 16, color: c.foreground }}>
              {s.title}
              {fresh ? <Text style={{ color: c.ember, fontSize: 13 }}>{`  ${t.content.new}`}</Text> : null}
            </Text>
            <Text style={{ fontFamily: fonts.sans, fontSize: 14, color: c.mutedForeground }}>{s.summary}</Text>
          </View>
          <Text style={{ fontFamily: fonts.sans, fontSize: 13, color: c.mutedForeground }}>{t.stories.minutes.replace("{n}", String(s.minutes))}</Text>
          <ChevronRight size={18} color={c.mutedForeground} />
        </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, paddingHorizontal: space.lg },
  row: { flexDirection: "row", alignItems: "center", gap: space.md, paddingVertical: space.lg, minHeight: 64 },
  text: { flex: 1, gap: 2 },
});
