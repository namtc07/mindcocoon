import { MAX_SAVED_MIXES, mixMatches, PRESET_MIXES, type Mix, type SavedMix } from "@mindcocoon/core/audio/mixes";
import { SOUND_TRACKS } from "@mindcocoon/core/sounds";
import { X } from "lucide-react-native";
import { useSyncExternalStore } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Chip } from "@/components/ui/Chip";
import { toast } from "@/components/ui/Toast";
import { useNow } from "@/hooks/use-now";
import { useI18n } from "@/i18n/i18n";
import { audio, useAudio } from "@/lib/audio";
import { getPref, setPref, subscribePrefs } from "@/lib/prefs";
import { isUnlockedIn } from "@/lib/unlocks-core";
import { useUnlocks } from "@/lib/unlocks";
import { fonts } from "@/theme/fonts";
import { space } from "@/theme/tokens";
import { useTheme } from "@/theme/theme";

const PREMIUM = new Set(SOUND_TRACKS.filter((t) => t.isPremium).map((t) => t.id));
const NONE: SavedMix[] = [];
const readMixes = () => getPref("mixes") ?? NONE;

/** One-tap mixes: ready-made ones, the person's own (up to 5), and "Save this mix". */
export function MixChips() {
  const { t } = useI18n();
  const { c } = useTheme();
  const state = useAudio();
  const now = useNow();
  const unlocks = useUnlocks();
  const saved = useSyncExternalStore(subscribePrefs, readMixes, readMixes);
  const playable = (id: string) => !PREMIUM.has(id) || isUnlockedIn(unlocks, id, now.getTime());
  const matches = (mix: Mix) => mixMatches(mix, state.playing, state.volumes);
  const nameOf = (m: SavedMix) => t.sanctuary.myMix.replace("{n}", String(m.n));
  const full = saved.length >= MAX_SAVED_MIXES;

  function play(mix: Mix) {
    audio
      .applyMix(mix, playable)
      .then((started) => {
        if (started === 0) toast.show(t.sanctuary.mixError);
      })
      .catch(() => toast.show(t.sanctuary.mixError));
  }

  /** Removing is one tap, so it can be undone for a few seconds. */
  function remove(m: SavedMix) {
    void setPref("mixes", saved.filter((x) => x.id !== m.id));
    toast.show(t.sanctuary.mixRemoved.replace("{name}", nameOf(m)), {
      label: t.sanctuary.undo,
      onPress: () => {
        const current = getPref("mixes") ?? [];
        if (!current.some((x) => x.id === m.id)) void setPref("mixes", [...current, m].sort((a, b) => a.n - b.n));
      },
    });
  }

  async function save() {
    const used = new Set(saved.map((m) => m.n));
    let n = 1;
    while (used.has(n)) n++;
    const volumes = Object.fromEntries(state.playing.map((id) => [id, state.volumes[id] ?? 0.6]));
    const mix: SavedMix = { id: `${Date.now()}-${n}`, n, mix: { volumes }, createdAt: new Date().toISOString() };
    await setPref("mixes", [...saved, mix]);
  }

  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { color: c.mutedForeground }]}>{t.sanctuary.mixesLabel}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {PRESET_MIXES.map((p) => (
          <Chip key={p.id} selected={matches(p.mix)} onPress={() => play(p.mix)}>
            {t.sanctuary.presets[p.id]}
          </Chip>
        ))}
        {saved.map((m) => (
          <View key={m.id} style={styles.saved}>
            <Chip selected={matches(m.mix)} onPress={() => play(m.mix)}>
              {nameOf(m)}
            </Chip>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t.sanctuary.removeMix.replace("{name}", nameOf(m))}
              hitSlop={8}
              onPress={() => remove(m)}
              style={styles.remove}
            >
              <X size={14} color={c.mutedForeground} />
            </Pressable>
          </View>
        ))}
        {state.playing.length > 0 && (
          <Chip selected={false} disabled={full} onPress={() => void save()}>
            {t.sanctuary.saveMix}
          </Chip>
        )}
      </ScrollView>
      {full && state.playing.length > 0 && <Text style={[styles.hint, { color: c.mutedForeground }]}>{t.sanctuary.mixesFull}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.sm, marginBottom: space.sm },
  label: { fontFamily: fonts.sans, fontSize: 15 },
  row: { gap: space.sm, alignItems: "center", paddingRight: space.lg },
  saved: { flexDirection: "row", alignItems: "center" },
  remove: { width: 32, height: 44, alignItems: "center", justifyContent: "center" },
  hint: { fontFamily: fonts.sans, fontSize: 13 },
});
