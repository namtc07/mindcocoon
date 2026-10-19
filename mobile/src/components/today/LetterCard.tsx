import { letterWeek } from "@mindcocoon/core/mood/letter";
import { router } from "expo-router";
import { useSyncExternalStore } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ken } from "@/components/art/Ken";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/i18n/i18n";
import { getPref, subscribePrefs } from "@/lib/prefs";
import { fonts } from "@/theme/fonts";
import { radius, space } from "@/theme/tokens";
import { useTheme } from "@/theme/theme";

const readOn = () => getPref("letterReadOn") ?? "";
const enabled = () => getPref("weeklyLetter") !== false;

/** From Sunday 18:00 through Monday: "Kén left you a few lines", until it is read. */
export function LetterCard({ now }: { now: Date }) {
  const { t } = useI18n();
  const { c } = useTheme();
  const read = useSyncExternalStore(subscribePrefs, readOn, readOn);
  const on = useSyncExternalStore(subscribePrefs, enabled, enabled);
  const week = letterWeek(now);
  if (!on || !week || read === week) return null;
  return (
    <View testID="letter-card" style={[styles.card, { backgroundColor: c.surface }]}>
      <Ken size={44} />
      <Text style={[styles.title, { color: c.foreground }]}>{t.letter.cardTitle}</Text>
      <Button variant="outline" onPress={() => router.push("/letter")}>
        {t.letter.read}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: "row", alignItems: "center", gap: space.md, borderRadius: radius.lg, padding: space.md, flexWrap: "wrap" },
  title: { flex: 1, minWidth: 140, fontFamily: fonts.serif, fontSize: 17, lineHeight: 23 },
});
