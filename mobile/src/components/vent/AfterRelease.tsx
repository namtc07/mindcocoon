import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/i18n/i18n";
import { fonts } from "@/theme/fonts";
import { space } from "@/theme/tokens";
import { useTheme } from "@/theme/theme";

/** The quiet moment after letting go. No ads, no prompts to do more. */
export function AfterRelease({ onWriteAgain }: { onWriteAgain: () => void }) {
  const { t } = useI18n();
  const { c } = useTheme();
  return (
    <Animated.View entering={FadeIn.duration(1000)} style={styles.wrap}>
      <Text accessibilityRole="header" style={[styles.title, { color: c.foreground }]}>
        {t.vent.releasedTitle}
      </Text>
      <Text style={[styles.body, { color: c.mutedForeground }]}>{t.vent.releasedBody}</Text>
      <View style={styles.actions}>
        <Button onPress={() => router.navigate("/sanctuary")}>{t.vent.listenRain}</Button>
        <Button variant="ghost" onPress={onWriteAgain}>
          {t.vent.writeAgain}
        </Button>
        <Button variant="ghost" onPress={() => router.navigate("/")}>
          {t.vent.back}
        </Button>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: "center", gap: space.lg },
  title: { fontFamily: fonts.serif, fontSize: 52, lineHeight: 58 },
  body: { fontFamily: fonts.sans, fontSize: 16 },
  actions: { gap: space.sm, marginTop: space.xl },
});
