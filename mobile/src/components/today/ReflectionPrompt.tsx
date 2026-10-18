import { promptForDay } from "@mindcocoon/core/prompts";
import { router } from "expo-router";
import { RefreshCw } from "lucide-react-native";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/i18n/i18n";
import { fonts } from "@/theme/fonts";
import { space } from "@/theme/tokens";
import { useTheme } from "@/theme/theme";

export function ReflectionPrompt({ now }: { now: Date }) {
  const { t, locale } = useI18n();
  const { c } = useTheme();
  const [offset, setOffset] = useState(0);
  return (
    <View accessibilityLabel={t.today.promptLabel} style={styles.wrap}>
      <Text style={[styles.prompt, { color: c.foreground }]}>{promptForDay(now, locale, offset)}</Text>
      <View style={styles.actions}>
        <Button onPress={() => router.push({ pathname: "/vent", params: { prompt: String(offset) } })}>{t.today.promptWrite}</Button>
        <Pressable accessibilityRole="button" accessibilityLabel={t.today.promptAnother} hitSlop={8} onPress={() => setOffset((o) => o + 1)} style={styles.another}>
          <RefreshCw size={15} color={c.mutedForeground} />
          <Text style={{ fontFamily: fonts.sans, fontSize: 15, color: c.mutedForeground }}>{t.today.promptAnother}</Text>
        </Pressable>
        <Pressable accessibilityRole="link" accessibilityLabel={t.today.promptMore} hitSlop={8} onPress={() => router.push("/prompts")} style={styles.another}>
          <Text style={{ fontFamily: fonts.sans, fontSize: 15, color: c.mutedForeground, textDecorationLine: "underline" }}>{t.today.promptMore}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.lg },
  prompt: { fontFamily: fonts.serif, fontSize: 30, lineHeight: 37 },
  actions: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: space.lg },
  another: { flexDirection: "row", alignItems: "center", gap: 6, minHeight: 44 },
});
