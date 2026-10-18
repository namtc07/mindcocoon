import type { Practice } from "@mindcocoon/core/practices";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { checkText } from "@mindcocoon/core/safety/detect";
import { AccessibilityInfo, Platform, StyleSheet, Text, View } from "react-native";
import { claimGentleCard, GentleCard } from "@/components/safety/GentleCard";
import { HelpLink } from "@/components/safety/HelpLink";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { SaveSheet } from "@/components/vent/SaveSheet";
import { useAppState } from "@/hooks/use-app-state";
import { useI18n } from "@/i18n/i18n";
import { fonts } from "@/theme/fonts";
import { radius, space } from "@/theme/tokens";
import { useTheme } from "@/theme/theme";

const KEEP_AWAKE_TAG = "practice";

/**
 * A quiet countdown for timed steps; it never moves on by itself. The screen stays on only while
 * it counts — people often fall asleep mid-practice, and a lit phone must not stay on all night.
 */
function StepTimer({ seconds }: { seconds: number }) {
  const { t } = useI18n();
  const { c } = useTheme();
  const [left, setLeft] = useState(seconds);
  const counting = left > 0;
  useEffect(() => {
    if (!counting) return;
    const id = setInterval(() => setLeft((n) => Math.max(0, n - 1)), 1000);
    activateKeepAwakeAsync(KEEP_AWAKE_TAG).catch(() => {});
    return () => {
      clearInterval(id);
      deactivateKeepAwake(KEEP_AWAKE_TAG).catch(() => {});
    };
  }, [counting]);
  return (
    <Text accessibilityElementsHidden importantForAccessibility="no" style={[styles.timer, { color: c.mutedForeground }]}>
      {t.practices.timeLeft.replace("{n}", String(left))}
    </Text>
  );
}

/**
 * One step at a time, with quiet dots instead of numbers. What's typed lives only in this screen:
 * leaving clears it, and it's saved only if the person chooses "Keep in my vault" (encrypted).
 */
export function PracticeRunner({ practice }: { practice: Practice }) {
  const { t } = useI18n();
  const { c } = useTheme();
  const appState = useAppState();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [choosing, setChoosing] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [gentle, setGentle] = useState(false);

  const reset = useCallback(() => {
    setStep(0);
    setAnswers({});
    setChoosing(false);
    setSaveOpen(false);
    setGentle(false);
  }, [setStep, setAnswers, setChoosing, setSaveOpen, setGentle]);
  useFocusEffect(useCallback(() => reset, [reset]));

  const current = practice.steps[step];
  const last = step === practice.steps.length - 1;
  const written = practice.steps
    .map((s, i) => (s.input && answers[i]?.trim() ? `${s.text}\n${answers[i].trim()}` : null))
    .filter((x): x is string => x !== null);

  // iOS has no live regions: announce each new step for VoiceOver.
  useEffect(() => {
    if (!choosing && Platform.OS === "ios") AccessibilityInfo.announceForAccessibility(current.text);
  }, [current.text, choosing]);

  function finish() {
    if (!written.length) return router.back();
    // Same safety check as Vent: heavy words get the gentle card (once per session) before anything else.
    if (checkText(written.join("\n")).flagged && claimGentleCard()) setGentle(true);
    else setChoosing(true);
  }

  function letGo() {
    reset();
    router.back();
  }

  return (
    <View style={styles.wrap}>
      {choosing ? (
        <View style={styles.body}>
          <Text accessibilityRole="header" style={[styles.text, { color: c.foreground }]}>
            {t.practices.keepTitle}
          </Text>
          <Text style={[styles.hint, { color: c.mutedForeground }]}>{t.practices.keepHint}</Text>
          <Button onPress={() => setSaveOpen(true)}>{t.practices.keep}</Button>
          <Button variant="ghost" onPress={letGo}>
            {t.practices.letGo}
          </Button>
          <HelpLink />
        </View>
      ) : (
        <View style={styles.body}>
          <Text accessibilityLiveRegion="polite" style={[styles.text, { color: c.foreground }]}>
            {current.text}
          </Text>
          {current.seconds !== undefined && <StepTimer key={step} seconds={current.seconds} />}
          {current.input && (
            <TextField
              label={t.practices.answerLabel}
              value={answers[step] ?? ""}
              onChangeText={(v) => setAnswers((a) => ({ ...a, [step]: v }))}
              multiline={current.input === "letter"}
              autoCorrect={false}
              spellCheck={false}
              autoComplete="off"
            />
          )}
          <View style={styles.dots} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            {practice.steps.map((_, i) => (
              <View key={i} style={[styles.dot, { backgroundColor: i === step ? c.primary : c.border }]} />
            ))}
          </View>
          <View style={styles.actions}>
            {step > 0 && (
              <Button variant="ghost" onPress={() => setStep(step - 1)}>
                {t.practices.back}
              </Button>
            )}
            <Button onPress={() => (last ? finish() : setStep(step + 1))}>{last ? t.practices.finish : t.practices.next}</Button>
          </View>
          {practice.steps.some((s) => s.input) && <HelpLink />}
        </View>
      )}

      {appState !== "active" && (
        <View style={[StyleSheet.absoluteFill, styles.cover, { backgroundColor: c.background }]}>
          <Text style={{ fontFamily: fonts.serif, fontSize: 28, color: c.foreground }}>MindCocoon</Text>
        </View>
      )}

      <GentleCard
        visible={gentle}
        continueLabel={t.safety.continuePractice}
        onContinue={() => {
          setGentle(false);
          setChoosing(true);
        }}
        onClose={() => setGentle(false)}
        onDismissed={() => {}}
      />
      <SaveSheet
        visible={saveOpen}
        body={written.join("\n\n")}
        defaultTitle={practice.title}
        onClose={() => setSaveOpen(false)}
        onSaved={() => {
          reset();
          router.back();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  body: { gap: space.xl, paddingTop: space.lg },
  text: { fontFamily: fonts.serif, fontSize: 26, lineHeight: 36 },
  hint: { fontFamily: fonts.sans, fontSize: 15, lineHeight: 22 },
  timer: { fontFamily: fonts.sans, fontSize: 15, fontVariant: ["tabular-nums"] },
  dots: { flexDirection: "row", gap: space.sm, justifyContent: "center" },
  dot: { width: 8, height: 8, borderRadius: radius.full },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: space.md, justifyContent: "flex-end" },
  cover: { alignItems: "center", justifyContent: "center" },
});
