import { PRESET_MIXES, type PresetMixId } from "@mindcocoon/core/audio/mixes";
import { dayKey, dayKeyFromISO } from "@mindcocoon/core/dates";
import { suggestionFor } from "@mindcocoon/core/feelings";
import { addMood, changeMood, getMoodState } from "@mindcocoon/core/mood/store";
import type { MoodType } from "@mindcocoon/core/types";
import { router } from "expo-router";
import { useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ken } from "@/components/art/Ken";
import { MoodPicker } from "@/components/mood/MoodPicker";
import { BoxBreathing } from "@/components/sanctuary/BoxBreathing";
import { MiniPlayer } from "@/components/sanctuary/MiniPlayer";
import { Muted, Screen } from "@/components/Screen";
import { StackHeader } from "@/components/StackHeader";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { toast } from "@/components/ui/Toast";
import { useMoodLogs } from "@/hooks/use-mood-logs";
import { useNow } from "@/hooks/use-now";
import { useI18n } from "@/i18n/i18n";
import { audio, useAudio } from "@/lib/audio";
import type { SleepMinutes } from "@/lib/audio/engine";
import { fonts } from "@/theme/fonts";
import { space } from "@/theme/tokens";
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
  const { playing } = useAudio();
  const [minutes, setMinutes] = useState<SleepMinutes>(30);
  const [starting, setStarting] = useState(false);
  // Mood taps are saved one after another on today's check-in as it is by then (never duplicated).
  const queue = useRef<Promise<unknown>>(Promise.resolve());

  const currentMood = mood ?? todayLog?.mood ?? null;
  const suggestion = currentMood ? suggestionFor(currentMood) : null;
  // If something is already playing, the default is to keep it (Goodnight then only sets the timer).
  const mix = mixChoice ?? (playing.length > 0 ? "keep" : (suggestion?.mix ?? "rainy-night"));

  function pickMood(next: MoodType) {
    setMood(next);
    queue.current = queue.current
      .then(async () => {
        const current = getMoodState().logs.find((l) => dayKeyFromISO(l.createdAt) === dayKey(new Date()));
        await (current ? changeMood(current, next) : addMood({ mood: next, tags: [] }));
      })
      .catch(() => toast.show(t.vault.unavailable));
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
            <MoodPicker variant="meter" value={currentMood} onChange={pickMood} label={t.windDown.howTonight} />
            <View style={styles.actions}>
              <Button variant="ghost" onPress={() => setStep("breathe")}>
                {t.windDown.skip}
              </Button>
              <Button disabled={!currentMood} onPress={() => setStep("breathe")}>
                {t.practices.next}
              </Button>
            </View>
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
            <View style={styles.chips}>
              {playing.length > 0 && (
                <Chip selected={mix === "keep"} onPress={() => setMixChoice("keep")}>
                  {t.windDown.keepPlaying}
                </Chip>
              )}
              {PRESET_MIXES.map((p) => (
                <Chip key={p.id} selected={mix === p.id} onPress={() => setMixChoice(p.id)}>
                  {t.sanctuary.presets[p.id]}
                </Chip>
              ))}
            </View>
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
  actions: { flexDirection: "row", flexWrap: "wrap", gap: space.md, justifyContent: "flex-end" },
  night: { alignItems: "flex-start", paddingTop: space.xl },
  player: { alignSelf: "stretch", marginHorizontal: -space.md },
});
