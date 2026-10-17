import { pickTonightTrack } from "@mindcocoon/core/audio/tonight";
import { dayKey, dayKeyFromISO } from "@mindcocoon/core/dates";
import { SOUND_TRACKS } from "@mindcocoon/core/sounds";
import { StyleSheet, Text, View } from "react-native";
import { useMoodLogs } from "@/hooks/use-mood-logs";
import { useI18n } from "@/i18n/i18n";
import { useAudio } from "@/lib/audio";
import { fonts } from "@/theme/fonts";
import { radius, space } from "@/theme/tokens";
import { useTheme } from "@/theme/theme";
import { PlayButton } from "./PlayButton";
import { toggleSound } from "./play";

/** Tonight's music, picked for today's latest check-in. Plays alongside ambient sounds. */
export function TonightCard({ now }: { now: Date }) {
  const { t } = useI18n();
  const { c } = useTheme();
  const { playing } = useAudio();
  const { logs } = useMoodLogs();
  const today = logs.find((l) => dayKeyFromISO(l.createdAt) === dayKey(now)) ?? null;
  const mood = today?.mood ?? null;
  const track = pickTonightTrack(SOUND_TRACKS, mood, now);
  const name = t.sounds[track.id as keyof typeof t.sounds];

  return (
    <View style={[styles.card, { backgroundColor: c.surface }]}>
      <Text accessibilityRole="header" style={[styles.label, { color: c.mutedForeground }]}>
        {t.sanctuary.tonightTitle}
      </Text>
      <View style={styles.row}>
        <PlayButton filled size={56} name={name} playing={playing.includes(track.id)} onPress={() => void toggleSound(track.id, t.sanctuary.playError)} />
        <View style={styles.text}>
          <Text style={[styles.name, { color: c.foreground }]}>{name}</Text>
          <Text style={[styles.label, { color: c.mutedForeground }]}>
            {mood ? t.sanctuary.tonightFor.replace("{mood}", t.mood.states[mood].label.toLowerCase()) : t.sanctuary.tonightAny}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, padding: space.xl, gap: space.md },
  row: { flexDirection: "row", alignItems: "center", gap: space.lg },
  text: { flex: 1, gap: 2 },
  name: { fontFamily: fonts.serif, fontSize: 24, lineHeight: 30 },
  label: { fontFamily: fonts.sans, fontSize: 14 },
});
