import { shouldShowHeavyNudge } from "@mindcocoon/core/mood/selectors";
import { router } from "expo-router";
import { X } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useMoodLogs } from "@/hooks/use-mood-logs";
import { useI18n } from "@/i18n/i18n";
import { getPref, setPref } from "@/lib/prefs";
import { fonts } from "@/theme/fonts";
import { radius, space } from "@/theme/tokens";
import { useTheme } from "@/theme/theme";

/** One quiet line after a week of heavy days, at most once a week, computed on this device. */
export function HeavyNudge({ now }: { now: Date }) {
  const { t } = useI18n();
  const { c } = useTheme();
  const { status, logs } = useMoodLogs();
  // Captured once per visit so the line doesn't vanish the moment it is recorded as shown.
  const [lastShownAt] = useState(() => getPref("heavyNudgeAt") ?? null);
  const [dismissed, setDismissed] = useState(false);
  const visible = status === "ready" && !dismissed && shouldShowHeavyNudge(logs, now, lastShownAt);

  useEffect(() => {
    if (visible) void setPref("heavyNudgeAt", Date.now());
  }, [visible]);

  if (!visible) return null;
  return (
    <View style={[styles.card, { backgroundColor: c.surface }]}>
      <View style={styles.text}>
        <Text style={{ fontFamily: fonts.sans, fontSize: 15, lineHeight: 21, color: c.foreground }}>{t.safety.heavyNudge}</Text>
        <Pressable accessibilityRole="link" onPress={() => router.push("/help")} hitSlop={8} style={{ minHeight: 44, justifyContent: "center" }}>
          <Text style={{ fontFamily: fonts.sansMedium, fontSize: 15, color: c.primary }}>{t.safety.heavyNudgeLink}</Text>
        </Pressable>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t.safety.dismiss}
        hitSlop={12}
        onPress={() => setDismissed(true)}
        style={{ minHeight: 44, minWidth: 44, alignItems: "center", justifyContent: "center" }}
      >
        <X size={18} color={c.mutedForeground} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: "row", gap: space.md, borderRadius: radius.lg, padding: space.lg, alignItems: "flex-start" },
  text: { flex: 1, gap: space.sm },
});
