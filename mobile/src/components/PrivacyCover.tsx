import { StyleSheet, Text, View } from "react-native";
import { useAppState } from "@/hooks/use-app-state";
import { useI18n } from "@/i18n/i18n";
import { fonts } from "@/theme/fonts";
import { useTheme } from "@/theme/theme";

/**
 * Covers every screen when the app isn't active, so the app switcher's snapshot never shows a
 * journal entry, a worry, a note or a check-in. Nothing is drawn while the app is in use.
 */
export function PrivacyCover() {
  const { t } = useI18n();
  const { c } = useTheme();
  const state = useAppState();
  if (state === "active") return null;
  return (
    <View accessibilityLabel={t.shell.privacyCover} style={[StyleSheet.absoluteFill, styles.cover, { backgroundColor: c.background }]}>
      <Text style={{ fontFamily: fonts.serif, fontSize: 28, color: c.foreground }}>MindCocoon</Text>
    </View>
  );
}

const styles = StyleSheet.create({ cover: { alignItems: "center", justifyContent: "center", zIndex: 1000 } });
