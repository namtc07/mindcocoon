import { mixMatches, PRESET_MIXES, type PresetMixId } from "@mindcocoon/core/audio/mixes";
import { dayKey, dayKeyFromISO } from "@mindcocoon/core/dates";
import { suggestionFor } from "@mindcocoon/core/feelings";
import { addMood, changeMood, getMoodState, updateMoodDetails } from "@mindcocoon/core/mood/store";
import type { MoodType } from "@mindcocoon/core/types";
import { router } from "expo-router";
import { useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { Ken } from "@/components/art/Ken";
import { FeelingChips } from "@/components/mood/FeelingChips";
import { MoodPicker } from "@/components/mood/MoodPicker";
import { BoxBreathing } from "@/components/sanctuary/BoxBreathing";
import { MiniPlayer } from "@/components/sanctuary/MiniPlayer";
import { MixCard, SCENE_OF } from "@/components/sanctuary/MixCard";
import { Scene } from "@/components/art/Scene";
import { Muted, Screen } from "@/components/Screen";
import { StackHeader } from "@/components/StackHeader";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { toast } from "@/components/ui/Toast";
import { useMoodLogs } from "@/hooks/use-mood-logs";
import { useNow } from "@/hooks/use-now";
import { useI18n } from "@/i18n/i18n";
import { audio, useAudio } from "@/lib/audio";
import { markSleepNight } from "@/lib/sleep-log";
import type { SleepMinutes } from "@/lib/audio/engine";
import { fonts } from "@/theme/fonts";
import { radius, space } from "@/theme/tokens";
import { useTheme } from "@/theme/theme";

const TIMERS: SleepMinutes[] = [20, 30, 60];
type Step = "checkin" | "breathe" | "sounds" | "night";

/**
 * Bedtime in one flow: check in → one minute of breathing that fits the feeling → a mix and a sleep
 * timer. Nothing plays until "Goodnight"; leaving early leaves no sound behind. Ad-free.
 */
export default function WindDownScreen() {
  const { t } = useI18n();
  const { c } = useTheme();
  const now = useNow();
  const { logs } = useMoodLogs();
  const todayLog = logs.find((l) => dayKeyFromISO(l.createdAt) === dayKey(now)) ?? null;
  const [step, setStep] = useState<Step>("checkin");
  const [mood, setMood] = useState<MoodType | null>(null);
  const [mixChoice, setMixChoice] = useState<PresetMixId | "keep" | null>(null);
  const { playing, held, volumes } = useAudio();
  const [minutes, setMinutes] = useState<SleepMinutes>(30);
  const [starting, setStarting] = useState(false);
  const [feelings, setFeelings] = useState<string[] | null>(null);
  // Saves go one after another on today's check-in as it is by then (never duplicated).
  const queue = useRef<Promise<unknown>>(Promise.resolve());

  // Cancel clears even today's saved mood from the picker (it stays saved), so Skip is offered.
  const [cleared, setCleared] = useState(false);
  const currentMood = mood ?? (cleared ? null : (todayLog?.mood ?? null));
  const suggestion = currentMood ? suggestionFor(currentMood) : null;
  // If something is already playing, the default is to keep it (Goodnight then only sets the timer).
  // The goodnight picture shows the ready-made mix that is actually on (paused counts), if any.
  const sounding = playing.length > 0 ? playing : held;
  const nightPreset = PRESET_MIXES.find((p) => mixMatches(p.mix, sounding, volumes))?.id;
  const mix = mixChoice ?? (playing.length > 0 ? "keep" : (suggestion?.mix ?? "rainy-night"));

  // Words for the mood being chosen: today's own words while it is today's mood, else the new picks.
  const currentFeelings = feelings ?? (currentMood && currentMood === todayLog?.mood ? (todayLog.feelings ?? []) : []);

  /** Choosing only changes the draft; "Save and continue" keeps it. */
  function pickMood(next: MoodType) {
    // Back to today's saved mood: its saved words come back too.
    if (next !== currentMood) setFeelings(next === todayLog?.mood ? (todayLog.feelings ?? []) : []);
    setMood(next);
    setCleared(false);
  }

  /** Lets the choice go (nothing is saved or removed). */
  function cancelMood() {
    setMood(null);
    setFeelings(null);
    setCleared(true);
  }

  function saveAndContinue() {
    const next = currentMood;
    const words = currentFeelings;
    if (next) {
      queue.current = queue.current
        .then(async () => {
          const current = getMoodState().logs.find((l) => dayKeyFromISO(l.createdAt) === dayKey(new Date()));
          if (!current) return void (await addMood({ mood: next, tags: [], feelings: words }));
          const unchanged = current.mood === next && (current.feelings ?? []).join() === words.join();
          if (unchanged) return;
          // Same mood keeps the check-in (id, time); a new mood is a fresh moment.
          const base = current.mood === next ? current : await changeMood(current, next);
          await updateMoodDetails(base, { tags: base.tags, feelings: words });
        })
        .catch(() => toast.show(t.vault.unavailable));
    }
    setStep("breathe");
  }

  async function goodnight() {
    if (starting) return;
    setStarting(true);
    const preset = PRESET_MIXES.find((p) => p.id === mix);
    try {
      if (preset && (await audio.applyMix(preset.mix, () => true)) === 0) {
        toast.show(t.sanctuary.mixError);
        return;
      }
      audio.setSleepTimer(minutes);
      void markSleepNight(new Date(), true);
      // Pin the choice: once sounds play, the default would otherwise become "keep".
      setMixChoice(mix);
      setStep("night");
    } catch {
      toast.show(t.sanctuary.playError);
    } finally {
      setStarting(false);
    }
  }

  return (
    <>
      <StackHeader />
      <Screen title={step === "night" ? t.windDown.sleepWell : t.windDown.title}>
        {step === "checkin" && (
          <View style={styles.step}>
            <Muted>{t.windDown.intro}</Muted>
            <Text style={[styles.h, { color: c.foreground }]}>{t.windDown.howTonight}</Text>
            <MoodPicker variant="orbs" value={currentMood} onChange={pickMood} label={t.windDown.howTonight} />
            {currentMood && <FeelingChips mood={currentMood} value={currentFeelings} onChange={setFeelings} />}
            {currentMood ? (
              <Animated.View entering={FadeIn.duration(240)} style={styles.actions}>
                <Button variant="ghost" onPress={cancelMood}>
                  {t.common.cancel}
                </Button>
                <Button onPress={saveAndContinue}>{t.windDown.saveContinue}</Button>
              </Animated.View>
            ) : (
              <View style={styles.actions}>
                <Button variant="ghost" onPress={() => setStep("breathe")}>
                  {t.windDown.skip}
                </Button>
              </View>
            )}
          </View>
        )}

        {step === "breathe" && (
          <View style={styles.step}>
            <BoxBreathing fixed={{ pattern: suggestion?.breath.pattern ?? "box", minutes: 1 }} />
            <View style={styles.actions}>
              <Button variant="ghost" onPress={() => setStep("checkin")}>
                {t.practices.back}
              </Button>
              <Button onPress={() => setStep("sounds")}>{t.practices.next}</Button>
            </View>
          </View>
        )}

        {step === "sounds" && (
          <View style={styles.step}>
            <Text style={[styles.h, { color: c.foreground }]}>{t.windDown.soundsTitle}</Text>
            {playing.length > 0 && (
              <View style={styles.chips}>
                <Chip selected={mix === "keep"} onPress={() => setMixChoice("keep")}>
                  {t.windDown.keepPlaying}
                </Chip>
              </View>
            )}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cards}>
              {PRESET_MIXES.map((p) => (
                <MixCard key={p.id} id={p.id} selected={mix === p.id} onPress={() => setMixChoice(p.id)} />
              ))}
            </ScrollView>
            <Text style={[styles.label, { color: c.mutedForeground }]}>{t.windDown.timerLabel}</Text>
            <View style={styles.chips}>
              {TIMERS.map((n) => (
                <Chip key={n} selected={minutes === n} onPress={() => setMinutes(n)}>
                  {t.sanctuary.minutes.replace("{n}", String(n))}
                </Chip>
              ))}
            </View>
            <View style={styles.actions}>
              <Button variant="ghost" onPress={() => setStep("breathe")}>
                {t.practices.back}
              </Button>
              <Button disabled={starting} onPress={() => void goodnight()}>
                {t.windDown.goodnight}
              </Button>
            </View>
          </View>
        )}

        {step === "night" && (
          <View style={[styles.step, styles.night]}>
            {nightPreset && (
              <View style={styles.scene}>
                <Scene kind={SCENE_OF[nightPreset]} fill />
              </View>
            )}
            <Ken mood="sleepy" size={72} />
            <Muted>{t.windDown.sleepWellBody}</Muted>
            {/* What's playing, the timer, pause and stop — right where the phone gets put down. */}
            <View style={styles.player}>
              <MiniPlayer />
            </View>
            <Button variant="ghost" onPress={() => router.navigate("/")}>
              {t.windDown.backToday}
            </Button>
          </View>
        )}
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  step: { gap: space.lg },
  h: { fontFamily: fonts.serif, fontSize: 22, lineHeight: 28 },
  label: { fontFamily: fonts.sans, fontSize: 15 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: space.sm },
  scene: { alignSelf: "stretch", borderRadius: radius.xl, overflow: "hidden" },
  cards: { gap: space.sm, paddingRight: space.lg },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: space.md, justifyContent: "flex-end" },
  night: { alignItems: "flex-start", paddingTop: space.xl },
  player: { alignSelf: "stretch", marginHorizontal: -space.md },
});
