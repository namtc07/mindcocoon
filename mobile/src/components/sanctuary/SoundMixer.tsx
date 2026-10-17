import { formatTime } from "@mindcocoon/core/dates";
import { AMBIENT_TRACKS, SOUND_TRACKS } from "@mindcocoon/core/sounds";
import Slider from "@react-native-community/slider";
import { Lock } from "lucide-react-native";
import { StyleSheet, Switch, Text, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toast";
import { useNow } from "@/hooks/use-now";
import { useRewardedUnlock } from "@/hooks/use-rewarded-unlock";
import { useI18n } from "@/i18n/i18n";
import { audio, useAudio } from "@/lib/audio";
import { unlockedUntilIn } from "@/lib/unlocks-core";
import { useUnlocks } from "@/lib/unlocks";
import { fonts } from "@/theme/fonts";
import { space } from "@/theme/tokens";
import { useTheme } from "@/theme/theme";
import { MixChips } from "./MixChips";
import { PlayButton } from "./PlayButton";
import { toggleSound } from "./play";

const PREMIUM_TRACKS = SOUND_TRACKS.filter((t) => t.category === "ambient" && t.isPremium);

function TrackRow({ id, note }: { id: string; note?: string }) {
  const { t } = useI18n();
  const { c } = useTheme();
  const state = useAudio();
  const playing = state.playing.includes(id);
  const name = t.sounds[id as keyof typeof t.sounds];
  return (
    <View>
      <View style={styles.row}>
        <PlayButton name={name} playing={playing} onPress={() => void toggleSound(id, t.sanctuary.playError)} />
        <Text style={[styles.name, { color: playing ? c.foreground : c.mutedForeground }]}>{name}</Text>
        <Slider
          style={styles.slider}
          value={state.volumes[id] ?? 0.6}
          minimumValue={0}
          maximumValue={1}
          step={0.01}
          onValueChange={(v) => audio.setTrackVolume(id, v)}
          accessibilityLabel={t.sanctuary.volumeFor.replace("{name}", name)}
          minimumTrackTintColor={c.primary}
          maximumTrackTintColor={c.border}
          thumbTintColor={c.primary}
        />
      </View>
      {note && <Text style={[styles.note, { color: c.mutedForeground }]}>{note}</Text>}
    </View>
  );
}

/** Rewarded unlock for one premium sound: only on the person's tap, never automatic. */
function LockedRow({ id, busy, unlock }: { id: string; busy: boolean; unlock: (id: string) => Promise<string> }) {
  const { t } = useI18n();
  const { c } = useTheme();
  const name = t.sounds[id as keyof typeof t.sounds];
  async function watch() {
    const result = await unlock(id);
    if (result === "unavailable") toast.show(t.sanctuary.adUnavailable);
  }
  return (
    <View style={styles.locked}>
      <View style={styles.row}>
        <View style={styles.lockIcon}>
          <Lock size={16} color={c.mutedForeground} />
        </View>
        <Text style={[styles.name, { color: c.mutedForeground, width: undefined, flex: 1 }]}>{name}</Text>
      </View>
      <Button variant="outline" disabled={busy} onPress={() => void watch()}>
        {t.sanctuary.unlockWithAd.replace("{name}", name)}
      </Button>
    </View>
  );
}

/** Ambient sounds, mixed: each with its own volume, plus overall volume and loop. */
export function SoundMixer() {
  const { t, locale } = useI18n();
  const { c } = useTheme();
  const state = useAudio();
  const now = useNow();
  const unlocks = useUnlocks();
  const { offer, busy, unlock } = useRewardedUnlock();
  const premium = PREMIUM_TRACKS.map((track) => ({ id: track.id, until: unlockedUntilIn(unlocks, track.id, now.getTime()) })).filter(
    (p) => p.until !== null || offer,
  );
  const sliderColors = { minimumTrackTintColor: c.primary, maximumTrackTintColor: c.border, thumbTintColor: c.primary };

  return (
    <View style={styles.wrap}>
      <Text accessibilityRole="header" style={[styles.title, { color: c.foreground }]}>
        {t.sanctuary.soundsTitle}
      </Text>
      <MixChips />
      {AMBIENT_TRACKS.map((track) => (
        <TrackRow key={track.id} id={track.id} />
      ))}
      {premium.length > 0 && (
        <View style={styles.group}>
          <Text accessibilityRole="header" style={[styles.label, { color: c.mutedForeground }]}>
            {t.sanctuary.moreSounds}
          </Text>
          {premium.map(({ id, until }) =>
            until !== null ? (
              <TrackRow key={id} id={id} note={t.sanctuary.unlockedUntil.replace("{time}", formatTime(new Date(until).toISOString(), locale))} />
            ) : (
              <LockedRow key={id} id={id} busy={busy} unlock={unlock} />
            ),
          )}
        </View>
      )}
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
          <Switch value={state.loop} onValueChange={(v) => audio.setLoop(v)} accessibilityLabel={t.sanctuary.loop} trackColor={{ true: c.primary, false: c.muted }} />
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
  note: { fontFamily: fonts.sans, fontSize: 13, marginLeft: 44 + space.lg },
  label: { fontFamily: fonts.sans, fontSize: 15, flex: 0, minWidth: 92 },
  slider: { flex: 1, height: 44 },
  group: { gap: space.sm, marginTop: space.md },
  locked: { gap: space.sm },
  lockIcon: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  footer: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: space.md, marginTop: space.sm, gap: space.xs },
});
