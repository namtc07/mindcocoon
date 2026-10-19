import { router } from "expo-router";
import { Mail } from "lucide-react-native";
import { Pressable, StyleSheet, Text } from "react-native";
import { useMoodLogs } from "@/hooks/use-mood-logs";
import { useI18n } from "@/i18n/i18n";
import { futureLetters, isOpenable } from "@/lib/future-letters";
import { fonts } from "@/theme/fonts";
import { radius, space } from "@/theme/tokens";
import { useTheme } from "@/theme/theme";

/** A quiet line on Today when a letter you wrote to yourself can be opened. */
export function FutureLetterLine({ now }: { now: Date }) {
  const { t } = useI18n();
  const { c } = useTheme();
  const { logs } = useMoodLogs();
  const letters = futureLetters.use();
  if (!letters.some((l) => isOpenable(l, now, logs))) return null;
  return (
    <Pressable accessibilityRole="link" onPress={() => router.push("/future-letters")} style={[styles.row, { backgroundColor: c.surface }]}>
      <Mail size={18} color={c.ember} />
      <Text style={{ flex: 1, fontFamily: fonts.sans, fontSize: 15, color: c.foreground }}>{t.futureLetters.ready}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: space.md, padding: space.lg, borderRadius: radius.lg, minHeight: 44 },
});
