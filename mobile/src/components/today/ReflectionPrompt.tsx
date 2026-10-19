import { promptForDay } from "@mindcocoon/core/prompts";
import { router } from "expo-router";
import { PenLine, RefreshCw } from "lucide-react-native";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useI18n } from "@/i18n/i18n";
import { fonts } from "@/theme/fonts";
import { radius, space } from "@/theme/tokens";
import { useTheme } from "@/theme/theme";

/** A small, optional writing idea — a quiet card, never a headline. Can be turned off in Settings. */
export function ReflectionPrompt({ now }: { now: Date }) {
  const { t, locale } = useI18n();
  const { c } = useTheme();
  const [offset, setOffset] = useState(0);
  const link = { fontFamily: fonts.sans, fontSize: 14, color: c.mutedForeground };
  return (
    <View accessibilityLabel={t.today.promptLabel} style={[styles.card, { backgroundColor: c.surface }]}>
      <Text style={[styles.intro, { color: c.mutedForeground }]}>{t.today.promptIntro}</Text>
      <Text testID="prompt-text" style={[styles.prompt, { color: c.foreground }]}>
        {promptForDay(now, locale, offset)}
      </Text>
      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.today.promptWrite}
          hitSlop={8}
          onPress={() => router.push({ pathname: "/vent", params: { prompt: String(offset) } })}
          style={styles.action}
        >
          <PenLine size={15} color={c.primary} />
          <Text style={{ fontFamily: fonts.sansMedium, fontSize: 14, color: c.primary }}>{t.today.promptWrite}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={t.today.promptAnother} hitSlop={8} onPress={() => setOffset((o) => o + 1)} style={styles.action}>
          <RefreshCw size={14} color={c.mutedForeground} />
          <Text style={link}>{t.today.promptAnother}</Text>
        </Pressable>
        <Pressable accessibilityRole="link" accessibilityLabel={t.today.promptMore} hitSlop={8} onPress={() => router.push("/prompts")} style={styles.action}>
          <Text style={[link, { textDecorationLine: "underline" }]}>{t.today.promptMore}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, padding: space.lg, gap: space.sm },
  intro: { fontFamily: fonts.sans, fontSize: 13 },
  prompt: { fontFamily: fonts.sans, fontSize: 16, lineHeight: 23 },
  actions: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", columnGap: space.lg },
  action: { flexDirection: "row", alignItems: "center", gap: 6, minHeight: 40 },
});
