import { router } from "expo-router";
import { Archive } from "lucide-react-native";
import { Pressable, StyleSheet, Text } from "react-native";
import { useI18n } from "@/i18n/i18n";
import { isReady, useWorries } from "@/lib/worries";
import { fonts } from "@/theme/fonts";
import { radius, space } from "@/theme/tokens";
import { useTheme } from "@/theme/theme";

/** A quiet line on Today when a worry from last night is ready (no count). */
export function WorryReadyLine({ now }: { now: Date }) {
  const { t } = useI18n();
  const { c } = useTheme();
  const worries = useWorries();
  if (!worries.some((w) => isReady(w, now))) return null;
  return (
    <Pressable accessibilityRole="link" onPress={() => router.push("/worries")} style={[styles.row, { backgroundColor: c.surface }]}>
      <Archive size={18} color={c.mutedForeground} />
      <Text style={{ flex: 1, fontFamily: fonts.sans, fontSize: 15, color: c.foreground }}>{t.worries.readyLine}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: space.md, padding: space.lg, borderRadius: radius.lg, minHeight: 44 },
});
