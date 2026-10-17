import { AMBIENT_TRACKS } from "@mindcocoon/core/sounds";
import Slider from "@react-native-community/slider";
import { StyleSheet, Switch, Text, View } from "react-native";
import { useI18n } from "@/i18n/i18n";
import { audio, useAudio } from "@/lib/audio";
import { fonts } from "@/theme/fonts";
import { space } from "@/theme/tokens";
import { useTheme } from "@/theme/theme";
import { PlayButton } from "./PlayButton";
import { toggleSound } from "./play";

/** Free ambient sounds, mixed: each with its own volume, plus overall volume and loop. */
export function SoundMixer() {
  const { t } = useI18n();
  const { c } = useTheme();
  const state = useAudio();
  const sliderColors = { minimumTrackTintColor: c.primary, maximumTrackTintColor: c.border, thumbTintColor: c.primary };

  return (
    <View style={styles.wrap}>
      <Text accessibilityRole="header" style={[styles.title, { color: c.foreground }]}>
        {t.sanctuary.soundsTitle}
      </Text>
      {AMBIENT_TRACKS.map((track) => {
        const playing = state.playing.includes(track.id);
        const name = t.sounds[track.id as keyof typeof t.sounds];
        return (
          <View key={track.id} style={styles.row}>
            <PlayButton name={name} playing={playing} onPress={() => void toggleSound(track.id, t.sanctuary.playError)} />
            <Text style={[styles.name, { color: playing ? c.foreground : c.mutedForeground }]}>{name}</Text>
            <Slider
              style={styles.slider}
              value={state.volumes[track.id] ?? 0.6}
              minimumValue={0}
              maximumValue={1}
              step={0.01}
              onValueChange={(v) => audio.setTrackVolume(track.id, v)}
              accessibilityLabel={t.sanctuary.volumeFor.replace("{name}", name)}
              {...sliderColors}
            />
          </View>
        );
      })}
      <View style={[styles.footer, { borderTopColor: c.border }]}>
        <View style={styles.row}>
          <Text style={[styles.label, { color: c.mutedForeground }]}>{t.sanctuary.master}</Text>
          <Slider
            style={styles.slider}
            value={state.master}
            minimumValue={0}
            maximumValue={1}
            step={0.01}
            onValueChange={(v) => audio.setMasterVolume(v)}
            accessibilityLabel={t.sanctuary.master}
            {...sliderColors}
          />
        </View>
        <View style={styles.row}>
          <Text style={[styles.label, { color: c.mutedForeground }]}>{t.sanctuary.loop}</Text>
          <Switch
            value={state.loop}
            onValueChange={(v) => audio.setLoop(v)}
            accessibilityLabel={t.sanctuary.loop}
            trackColor={{ true: c.primary, false: c.muted }}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.sm },
  title: { fontFamily: fonts.serif, fontSize: 24, lineHeight: 30, marginBottom: space.sm },
  row: { flexDirection: "row", alignItems: "center", gap: space.lg, minHeight: 48 },
  name: { fontFamily: fonts.sans, fontSize: 15, width: 92 },
  label: { fontFamily: fonts.sans, fontSize: 15, flex: 0, minWidth: 92 },
  slider: { flex: 1, height: 44 },
  footer: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: space.md, marginTop: space.sm, gap: space.xs },
});
