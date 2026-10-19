import { getPractices } from "@mindcocoon/core/practices";
import { isNew } from "@mindcocoon/core/remote-content";
import { useNow } from "@/hooks/use-now";
import { useRemoteContent } from "@/lib/remote-content";
import { router } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useI18n } from "@/i18n/i18n";
import { fonts } from "@/theme/fonts";
import { radius, space } from "@/theme/tokens";
import { useTheme } from "@/theme/theme";

/** The gentle practices, each opening its own step-by-step screen. */
export function PracticeList() {
  const { t, locale } = useI18n();
  const { c } = useTheme();
  const extra = useRemoteContent().practices[locale];
  const now = useNow();
  return (
    <View style={[styles.card, { backgroundColor: c.surface }]}>
      {[...getPractices(locale), ...extra].map((p, i) => {
        const fresh = isNew((p as { addedAt?: string }).addedAt, now);
        return (
        <Pressable
          key={p.id}
          accessibilityRole="button"
          accessibilityLabel={fresh ? `${p.title}. ${t.content.new}. ${p.summary}` : `${p.title}. ${p.summary}`}
          onPress={() => router.push({ pathname: "/practices/[id]", params: { id: p.id } })}
          style={[styles.row, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border }]}
        >
          <View style={styles.text}>
            <Text style={{ fontFamily: fonts.sansMedium, fontSize: 16, color: c.foreground }}>
              {p.title}
              {fresh ? <Text style={{ color: c.ember, fontSize: 13 }}>{`  ${t.content.new}`}</Text> : null}
            </Text>
            <Text style={{ fontFamily: fonts.sans, fontSize: 14, color: c.mutedForeground }}>{p.summary}</Text>
          </View>
          <Text style={{ fontFamily: fonts.sans, fontSize: 13, color: c.mutedForeground }}>{t.sanctuary.minutes.replace("{n}", String(p.minutes))}</Text>
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
