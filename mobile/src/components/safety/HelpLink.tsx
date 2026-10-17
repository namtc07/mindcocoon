import { router } from "expo-router";
import { Pressable, Text } from "react-native";
import { useI18n } from "@/i18n/i18n";
import { fonts } from "@/theme/fonts";
import { useTheme } from "@/theme/theme";

/** The always-available, low-key link to support lines. */
export function HelpLink() {
  const { t } = useI18n();
  const { c } = useTheme();
  return (
    <Pressable accessibilityRole="link" hitSlop={10} onPress={() => router.push("/help")} style={{ minHeight: 44, justifyContent: "center" }}>
      <Text style={{ fontFamily: fonts.sans, fontSize: 15, color: c.mutedForeground, textAlign: "center" }}>{t.vent.helpLink}</Text>
    </Pressable>
  );
}
