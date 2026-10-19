import { formatTime } from "@mindcocoon/core/dates";
import { AMBIENT_TRACKS, NOISE_TRACKS, SOUND_TRACKS } from "@mindcocoon/core/sounds";
import Slider from "@react-native-community/slider";
import { AudioLines, AudioWaveform, Bell, CloudLightning, CloudRain, Droplets, Flame, Lock, Waves, Wind, type LucideIcon } from "lucide-react-native";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { toast } from "@/components/ui/Toast";
import { useNow } from "@/hooks/use-now";
import { useRewardedUnlock } from "@/hooks/use-rewarded-unlock";
import { useI18n } from "@/i18n/i18n";
import { audio, useAudio } from "@/lib/audio";
import { unlockedUntilIn } from "@/lib/unlocks-core";
import { useUnlocks } from "@/lib/unlocks";
import { useFlags } from "@/lib/remote-config";
import { fonts } from "@/theme/fonts";
import { radius, space } from "@/theme/tokens";
import { useTheme } from "@/theme/theme";
import { MixChips } from "./MixChips";
import { toggleSound } from "./play";

const PREMIUM_TRACKS = SOUND_TRACKS.filter((t) => t.category === "ambient" && t.isPremium);
const ICONS: Record<string, LucideIcon> = {
  rain: CloudRain,
  ocean: Waves,
  "night-wind": Wind,
  campfire: Flame,
  thunder: CloudLightning,
  stream: Droplets,
  "singing-bowl": Bell,
  "deep-hum": AudioLines,
  "white-noise": AudioWaveform,
  "pink-noise": AudioWaveform,
  "brown-noise": AudioWaveform,
};

/** One sound as a tile: tap to play or pause ("Play: Rain" / "Pause: Rain"). */
function SoundTile({ id, note }: { id: string; note?: string }) {
  const { t } = useI18n();
  const { c } = useTheme();
  const { playing } = useAudio();
  const on = playing.includes(id);
  const name = t.sounds[id as keyof typeof t.sounds];
  const Icon = ICONS[id] ?? AudioLines;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${on ? t.sanctuary.pause : t.sanctuary.play}: ${name}`}
      accessibilityState={{ selected: on }}
      onPress={() => void toggleSound(id, t.sanctuary.playError)}
      style={({ pressed }) => [
        styles.tile,
        { backgroundColor: on ? c.surface : "transparent", borderColor: on ? c.primary : c.border, opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <View style={[styles.tileIcon, { backgroundColor: on ? c.primary : c.surface }]}>
        <Icon size={20} color={on ? c.primaryForeground : c.mutedForeground} />
      </View>
      <View style={{ flex: 1 }}>
        <Text numberOfLines={1} style={[styles.tileName, { color: on ? c.foreground : c.mutedForeground }]}>
          {name}
        </Text>
        {note && <Text style={[styles.tileNote, { color: c.mutedForeground }]}>{note}</Text>}
      </View>
    </Pressable>
  );
}

function TrackRow({ id, note }: { id: string; note?: string }) {
  const { t } = useI18n();
  const { c } = useTheme();
  const state = useAudio();
  const playing = state.playing.includes(id);
  const name = t.sounds[id as keyof typeof t.sounds];
  return (
    <View>
      <View style={styles.row}>
        <Text numberOfLines={1} style={[styles.name, { color: playing ? c.foreground : c.mutedForeground }]}>{name}</Text>
        <Slider
          style={styles.slider}
          value={state.volumes[id] ?? 0.6}
          minimumValue={0}
          maximumValue={1}
          step={0.01}
          onValueChange={(v) => audio.setTrackVolume(id, v, false)}
          onSlidingComplete={(v) => audio.setTrackVolume(id, v)}
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
function LockedTile({ id, busy, unlock }: { id: string; busy: boolean; unlock: (id: string) => Promise<string> }) {
  const { t } = useI18n();
  const { c } = useTheme();
  const name = t.sounds[id as keyof typeof t.sounds];
  async function watch() {
    const result = await unlock(id);
    if (result === "unavailable") toast.show(t.sanctuary.adUnavailable);
  }
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t.sanctuary.unlockWithAd.replace("{name}", name)}
      accessibilityState={{ disabled: busy }}
      disabled={busy}
      onPress={() => void watch()}
      style={[styles.tile, { borderColor: c.border, borderStyle: "dashed", opacity: busy ? 0.5 : 1 }]}
    >
      <View style={[styles.tileIcon, { backgroundColor: c.surface }]}>
        <Lock size={18} color={c.mutedForeground} />
      </View>
      <Text numberOfLines={1} style={[styles.tileName, { color: c.mutedForeground, flex: 1 }]}>
        {name}
      </Text>
    </Pressable>
  );
}

/** Ambient sounds as tiles; the ones playing get a volume slider; overall volume and loop. */
export function SoundMixer() {
  const { t, locale } = useI18n();
  const { c } = useTheme();
  const state = useAudio();
  const now = useNow();
  const unlocks = useUnlocks();
  const flags = useFlags();
  const { offer, busy, unlock, unlockAll } = useRewardedUnlock();
  // Extra sounds are free unless the remote premium_sounds_locked switch is on.
  const locked = flags.premiumSoundsLocked === true;
  const freeTracks = locked ? AMBIENT_TRACKS : [...AMBIENT_TRACKS, ...PREMIUM_TRACKS];
  const premium = (locked ? PREMIUM_TRACKS : []).map((track) => ({ id: track.id, until: unlockedUntilIn(unlocks, track.id, now.getTime()) })).filter(
    (p) => p.until !== null || offer,
  );
  const sliderColors = { minimumTrackTintColor: c.primary, maximumTrackTintColor: c.border, thumbTintColor: c.primary };

  const playingNow = state.playing.filter((id) => SOUND_TRACKS.some((tr) => tr.id === id && (tr.category === "ambient" || tr.category === "noise")));

  return (
    <View style={styles.wrap}>
      {/* The "Sounds" tab names this part; no second heading. */}
      <MixChips />
      <View style={styles.grid}>
        {freeTracks.map((track) => (
          <SoundTile key={track.id} id={track.id} />
        ))}
      </View>
      <View testID="noise-group" style={styles.group}>
        <Text accessibilityRole="header" style={[styles.label, { color: c.mutedForeground }]}>
          {t.sanctuary.noiseTitle}
        </Text>
        <View style={styles.grid}>
          {NOISE_TRACKS.map((track) => (
            <SoundTile key={track.id} id={track.id} />
          ))}
        </View>
      </View>
      {premium.length > 0 && (
        <View style={styles.group}>
          <Text accessibilityRole="header" style={[styles.label, { color: c.mutedForeground }]}>
            {t.sanctuary.moreSounds}
          </Text>
          {offer && premium.filter((p) => p.until === null).length > 1 && (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: busy }}
              disabled={busy}
              onPress={() =>
                void unlockAll().then((r) => {
                  if (r === "unavailable") toast.show(t.sanctuary.adUnavailable);
                })
              }
              style={[styles.allButton, { borderColor: c.ember, opacity: busy ? 0.5 : 1 }]}
            >
              <Lock size={14} color={c.ember} />
              <Text style={{ fontFamily: fonts.sansMedium, fontSize: 14, color: c.ember, flexShrink: 1 }}>{t.sanctuary.unlockAllWithAd}</Text>
            </Pressable>
          )}
          <View style={styles.grid}>
            {premium.map(({ id, until }) =>
              until !== null ? (
                <SoundTile key={id} id={id} note={t.sanctuary.unlockedUntil.replace("{time}", formatTime(new Date(until).toISOString(), locale))} />
              ) : (
                <LockedTile key={id} id={id} busy={busy} unlock={unlock} />
              ),
            )}
          </View>
        </View>
      )}
      <View style={[styles.footer, { borderTopColor: c.border }]}>
        {/* Only what is playing gets a slider, so the page stays calm. */}
        {playingNow.length > 0 && (
          <Text accessibilityRole="header" style={[styles.label, { color: c.mutedForeground }]}>
            {t.sanctuary.volumes}
          </Text>
        )}
        {playingNow.map((id) => (
          <TrackRow key={id} id={id} />
        ))}
        <View style={styles.row}>
          <Text style={[styles.label, { color: c.mutedForeground }]}>{t.sanctuary.master}</Text>
          <Slider
            style={styles.slider}
            value={state.master}
            minimumValue={0}
            maximumValue={1}
            step={0.01}
            onValueChange={(v) => audio.setMasterVolume(v, false)}
            onSlidingComplete={(v) => audio.setMasterVolume(v)}
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
  row: { flexDirection: "row", alignItems: "center", gap: space.lg, minHeight: 48 },
  name: { fontFamily: fonts.sans, fontSize: 15, width: 92 },
  note: { fontFamily: fonts.sans, fontSize: 13, marginLeft: 44 + space.lg },
  label: { fontFamily: fonts.sans, fontSize: 15, flex: 0, minWidth: 92 },
  slider: { flex: 1, height: 44 },
  group: { gap: space.sm, marginTop: space.md },
  locked: { gap: space.sm },
  lockIcon: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  allButton: { flexDirection: "row", alignItems: "center", gap: space.sm, borderWidth: 1, borderRadius: radius.full, paddingHorizontal: space.lg, minHeight: 44 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: space.sm },
  tile: { width: "48.5%", flexDirection: "row", alignItems: "center", gap: space.md, borderWidth: 1, borderRadius: radius.lg, padding: space.sm, minHeight: 56 },
  tileIcon: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  tileName: { fontFamily: fonts.sansMedium, fontSize: 14 },
  tileNote: { fontFamily: fonts.sans, fontSize: 11 },
  footer: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: space.md, marginTop: space.sm, gap: space.xs },
});
