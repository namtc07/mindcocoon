import { dayKey, dayKeyFromISO, formatDay } from "@mindcocoon/core/dates";
import { LOW_MOODS } from "@mindcocoon/core/moods";
import { router } from "expo-router";
import { useState, useSyncExternalStore } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ken } from "@/components/art/Ken";
import { useMoodLogs } from "@/hooks/use-mood-logs";
import { useI18n } from "@/i18n/i18n";
import { MIN_AGE_MS, moments } from "@/lib/moments";
import { getPref, setPref, subscribePrefs } from "@/lib/prefs";
import { fonts } from "@/theme/fonts";
import { radius, space } from "@/theme/tokens";
import { useTheme } from "@/theme/theme";

const shownOn = () => getPref("momentShownOn") ?? "";

/**
 * On a heavy day (today's check-in is low), Kén offers back one light moment kept at least a few
 * days ago — at most once a day. The text is decrypted only when tapped.
 */
export function MomentReturn({ now }: { now: Date }) {
  const { t, locale } = useI18n();
  const { c } = useTheme();
  const { logs } = useMoodLogs();
  const items = moments.use();
  const shown = useSyncExternalStore(subscribePrefs, shownOn, shownOn);
  const [revealed, setRevealed] = useState<{ text: string; at: string } | null>(null);

  const today = logs.find((l) => dayKeyFromISO(l.createdAt) === dayKey(now));
  const eligible = items.filter((m) => now.getTime() - new Date(m.createdAt).getTime() >= MIN_AGE_MS);
  const offer = !!today && LOW_MOODS.includes(today.mood) && shown !== dayKey(now) && eligible.length > 0;
  if (!revealed && !offer) return null;

  async function reveal() {
    const pick = eligible[Math.floor(Math.random() * eligible.length)];
    await setPref("momentShownOn", dayKey(now));
    const text = await moments.read(pick.id).catch(() => null);
    if (text) setRevealed({ text, at: pick.createdAt });
  }

  return (
    <View testID="moment-return" style={[styles.card, { backgroundColor: c.surface }]}>
      {revealed ? (
        <>
          <Text style={[styles.small, { color: c.mutedForeground }]}>{t.moments.fromDay.replace("{date}", formatDay(new Date(revealed.at), locale))}</Text>
          <Text style={[styles.text, { color: c.foreground }]}>{revealed.text}</Text>
          <Pressable accessibilityRole="link" hitSlop={8} onPress={() => router.push("/moments")}>
            <Text style={[styles.small, { color: c.primary }]}>{t.moments.open}</Text>
          </Pressable>
        </>
      ) : (
        <Pressable accessibilityRole="button" accessibilityLabel={t.moments.found} onPress={() => void reveal()} style={styles.row}>
          <Ken mood="glad" size={44} />
          <Text style={[styles.title, { color: c.foreground }]}>{t.moments.found}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, padding: space.lg, gap: space.sm },
  row: { flexDirection: "row", alignItems: "center", gap: space.md, minHeight: 44 },
  title: { flex: 1, fontFamily: fonts.serif, fontSize: 17, lineHeight: 23 },
  text: { fontFamily: fonts.serif, fontSize: 19, lineHeight: 27 },
  small: { fontFamily: fonts.sans, fontSize: 14 },
});
