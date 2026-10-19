import { router } from "expo-router";
import { Moon, Pause, Play, Square } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNow } from "@/hooks/use-now";
import { useI18n } from "@/i18n/i18n";
import { audio, useAudio } from "@/lib/audio";
import { sleepMinutesLeft } from "@/lib/audio/engine";
import { fonts } from "@/theme/fonts";
import { radius, space } from "@/theme/tokens";
import { useTheme } from "@/theme/theme";

/**
 * Persistent player above the tab bar (also on Vent, where the tab bar is hidden —
 * then `safeBottom` keeps it clear of the home indicator).
 */
export function MiniPlayer({ safeBottom = false }: { safeBottom?: boolean }) {
  const { t } = useI18n();
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const state = useAudio();
  const now = useNow();
  const active = state.playing.length ? state.playing : state.held;
  if (!active.length) return null;

  const playing = state.playing.length > 0;
  const names = active.map((id) => t.sounds[id as keyof typeof t.sounds] ?? id).join(" + ");
  const left = sleepMinutesLeft(state, now.getTime());
  const minutes = left === null ? null : t.sanctuary.minutes.replace("{n}", String(left));

  return (
    <View style={{ paddingBottom: safeBottom ? insets.bottom : 0, backgroundColor: c.background }}>
      <View accessibilityRole="toolbar" accessibilityLabel={t.sanctuary.nowPlaying} style={[styles.bar, { backgroundColor: c.card, borderColor: c.border }]}>
        <Pressable accessibilityRole="link" accessibilityLabel={names} onPress={() => router.navigate("/sanctuary")} style={styles.names}>
          <Text numberOfLines={1} style={[styles.text, { color: c.foreground }]}>
            {names}
          </Text>
        </Pressable>
        {minutes && (
          <View accessible accessibilityLabel={`${t.sanctuary.sleepTimer}: ${minutes}`} style={styles.timer}>
            <Moon size={14} color={c.mutedForeground} />
            <Text style={[styles.small, { color: c.mutedForeground }]}>{minutes}</Text>
          </View>
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={playing ? t.sanctuary.pauseAll : t.sanctuary.resumeAll}
          onPress={() => (playing ? audio.pauseAll() : void audio.resumeAll())}
          style={styles.icon}
        >
          {playing ? <Pause size={18} color={c.foreground} /> : <Play size={18} color={c.foreground} />}
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={t.sanctuary.stopAll} onPress={() => audio.stopAll()} style={styles.icon}>
          <Square size={15} color={c.mutedForeground} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: space.md,
    marginVertical: space.sm,
    paddingLeft: space.lg,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 48,
  },
  names: { flex: 1, minHeight: 44, justifyContent: "center" },
  text: { fontFamily: fonts.sans, fontSize: 15 },
  timer: { flexDirection: "row", alignItems: "center", gap: 4, marginHorizontal: space.sm },
  small: { fontFamily: fonts.sans, fontSize: 13, fontVariant: ["tabular-nums"] },
  icon: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
});
