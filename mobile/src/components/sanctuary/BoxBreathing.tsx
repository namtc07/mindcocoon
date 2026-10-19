import { breathAtPattern, BREATH_PATTERNS, cyclesFor, totalMsFor, type BreathPatternId, type BreathPhase } from "@mindcocoon/core/breathing";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { AccessibilityInfo, AppState, Platform, StyleSheet, Text, View } from "react-native";
import Animated, { cancelAnimation, Easing, useAnimatedProps, useReducedMotion, useSharedValue, withTiming } from "react-native-reanimated";
import Svg, { Circle, Rect } from "react-native-svg";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { useI18n } from "@/i18n/i18n";
import { breathAtPatternWorklet, breathScale, dotPosition, INNER_SIDE, PAD, SIZE } from "@/lib/breath-geometry";
import { playBreathCue, stopBreathCues } from "@/lib/breath-cues";
import { getPref, setPref, subscribePrefs } from "@/lib/prefs";
import { fonts } from "@/theme/fonts";
import { radius, space } from "@/theme/tokens";
import { useTheme } from "@/theme/theme";

const AnimatedRect = Animated.createAnimatedComponent(Rect);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const KEEP_AWAKE_TAG = "breathing";
const LABEL_TICK_MS = 250;
const PATTERN_IDS: BreathPatternId[] = ["box", "relax", "calm"];
const LENGTHS = [1, 3, 5] as const;
export type Choice = { pattern: BreathPatternId; minutes: (typeof LENGTHS)[number] };
const DEFAULT_CHOICE: Choice = { pattern: "box", minutes: 1 };
const readChoice = () => getPref("breathing") ?? DEFAULT_CHOICE;
const readCues = () => getPref("breathCues") !== false;

/**
 * Paced breathing — box, 4-7-8 or slow exhale, for 1, 3 or 5 minutes (remembered). The shape draws
 * on the UI thread; labels follow core `breathAtPattern`.
 */
export function BoxBreathing({ fixed }: { fixed?: Choice } = {}) {
  const { t } = useI18n();
  const { c } = useTheme();
  const reduceMotion = useReducedMotion();
  const stored = useSyncExternalStore(subscribePrefs, readChoice, readChoice);
  const cues = useSyncExternalStore(subscribePrefs, readCues, readCues);
  // Wind-down passes its own rhythm; the chooser is hidden then.
  const choice = fixed ?? stored;
  const pattern = BREATH_PATTERNS[choice.pattern];
  const cycles = cyclesFor(pattern, choice.minutes);
  const totalMs = totalMsFor(pattern, cycles);
  const phases = pattern.phases;
  const showDot = pattern.id === "box" && !reduceMotion;
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const clock = useSharedValue(0);

  const running = startedAt !== null;
  const state = breathAtPattern(pattern, cycles, elapsed);
  const finished = running && state.done;
  const active = running && !finished;

  const stop = useCallback(() => {
    stopBreathCues();
    cancelAnimation(clock);
    clock.set(0);
    setStartedAt(null);
    setElapsed(0);
  }, [clock, setStartedAt, setElapsed]);

  /** A new rhythm or length after finishing starts from the beginning, not mid-session. */
  function choose(next: Choice) {
    if (running) stop();
    void setPref("breathing", next);
  }

  function begin() {
    setElapsed(0);
    setStartedAt(Date.now());
    clock.set(0);
    clock.set(withTiming(totalMs, { duration: totalMs, easing: Easing.linear }));
  }

  // Labels: a light JS tick (the drawing itself never waits on JS); it stops once the session is done.
  useEffect(() => {
    if (startedAt === null || finished) return;
    const id = setInterval(() => setElapsed(Date.now() - startedAt), LABEL_TICK_MS);
    return () => clearInterval(id);
  }, [startedAt, finished]);

  // A tone and a light touch at each new phase, so the rhythm can be followed with eyes closed.
  const phaseKey = active ? `${state.cycle}:${state.phase}` : null;
  const lastCue = useRef<string | null>(null);
  useEffect(() => {
    if (!phaseKey) {
      lastCue.current = null;
      return;
    }
    // Exactly one cue per new phase.
    if (!cues || lastCue.current === phaseKey) return;
    lastCue.current = phaseKey;
    playBreathCue(state.phase);
  }, [phaseKey, cues, state.phase]);

  // A minute is longer than many auto-lock settings: keep the screen on while breathing.
  useEffect(() => {
    if (!active) return;
    activateKeepAwakeAsync(KEEP_AWAKE_TAG).catch(() => {});
    return () => {
      deactivateKeepAwake(KEEP_AWAKE_TAG).catch(() => {});
    };
  }, [active]);

  // Leaving the tab or the app ends the exercise rather than resuming mid-breath.
  useFocusEffect(useCallback(() => stop, [stop]));
  useEffect(() => {
    const sub = AppState.addEventListener("change", (s) => {
      // Control Center, the notification shade or a call banner make the app "inactive" — keep going.
      if (s === "background") stop();
    });
    return () => sub.remove();
  }, [stop]);

  const phaseLabel: Record<BreathPhase, string> = {
    inhale: t.sanctuary.inhale,
    "hold-in": t.sanctuary.holdIn,
    exhale: t.sanctuary.exhale,
    "hold-out": t.sanctuary.holdOut,
  };

  // iOS has no live regions: announce each phase (and the end) for VoiceOver.
  const spoken = finished ? t.sanctuary.done : running ? phaseLabel[state.phase] : null;
  useEffect(() => {
    if (spoken && Platform.OS === "ios") AccessibilityInfo.announceForAccessibility(spoken);
  }, [spoken]);

  const innerProps = useAnimatedProps(() => {
    const on = clock.value > 0 && clock.value < totalMs;
    const b = breathAtPatternWorklet(phases, clock.value);
    const scale = on && !reduceMotion ? breathScale(phases[b.phaseIndex].phase, b.progress) : 0.6;
    const side = INNER_SIDE * scale;
    return { x: SIZE / 2 - side / 2, y: SIZE / 2 - side / 2, width: side, height: side, opacity: on ? 0.28 + 0.2 * scale : 0.18 };
  });

  const dotProps = useAnimatedProps(() => {
    const on = clock.value > 0 && clock.value < totalMs;
    const b = breathAtPatternWorklet(phases, clock.value);
    const p = dotPosition(phases[b.phaseIndex].phase, b.progress);
    return { cx: p.x, cy: p.y, opacity: on ? 1 : 0 };
  });


  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <Text accessibilityRole="header" style={[styles.title, { color: c.foreground }]}>
          {t.sanctuary.breathingTitle}
        </Text>
        <Text style={[styles.intro, { color: c.mutedForeground }]}>{t.sanctuary.breathingIntro}</Text>
      </View>
      {!fixed && (
        <>
      <View style={styles.chips}>
        {PATTERN_IDS.map((id) => (
          <Chip key={id} selected={choice.pattern === id} disabled={running && !finished} onPress={() => choose({ ...choice, pattern: id })}>
            {t.sanctuary.patterns[id]}
          </Chip>
        ))}
      </View>
      <View style={styles.chips}>
        <Text style={[styles.intro, { color: c.mutedForeground }]}>{t.sanctuary.lengthLabel}</Text>
        {LENGTHS.map((n) => (
          <Chip key={n} selected={choice.minutes === n} disabled={running && !finished} onPress={() => choose({ ...choice, minutes: n })}>
            {t.sanctuary.minutes.replace("{n}", String(n))}
          </Chip>
        ))}
      </View>
        </>
      )}
      <View style={styles.chips}>
        <Chip
          selected={cues}
          onPress={() => {
            if (cues) stopBreathCues();
            void setPref("breathCues", !cues);
          }}
        >
          {t.sanctuary.breathCues}
        </Chip>
      </View>
      <Text style={[styles.intro, { color: c.mutedForeground }]}>{t.sanctuary.patternHints[choice.pattern]}</Text>
      <View style={[styles.card, { backgroundColor: c.surface }]}>
        <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} accessible={false} importantForAccessibility="no-hide-descendants">
          <Rect x={PAD} y={PAD} width={SIZE - PAD * 2} height={SIZE - PAD * 2} rx={18} fill="none" stroke={c.border} strokeWidth={2} />
          <AnimatedRect animatedProps={innerProps} rx={14} fill={c.primary} />
          {showDot && <AnimatedCircle animatedProps={dotProps} r={7} fill={c.primary} />}
        </Svg>
        <View accessibilityLiveRegion="polite" style={styles.status}>
          {finished ? (
            <Text style={[styles.done, { color: c.foreground }]}>{t.sanctuary.done}</Text>
          ) : running ? (
            <>
              <Text style={[styles.phase, { color: c.foreground }]}>{phaseLabel[state.phase]}</Text>
              <Text importantForAccessibility="no" accessibilityElementsHidden style={[styles.seconds, { color: c.mutedForeground }]}>
                {state.secondsLeft}
              </Text>
            </>
          ) : null}
        </View>
        <Button variant={active ? "ghost" : "primary"} onPress={active ? stop : begin}>
          {active ? t.sanctuary.stop : finished ? t.sanctuary.again : t.sanctuary.start}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.lg },
  head: { gap: space.xs },
  chips: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: space.sm },
  title: { fontFamily: fonts.serif, fontSize: 24, lineHeight: 30 },
  intro: { fontFamily: fonts.sans, fontSize: 15 },
  card: { borderRadius: radius.lg, padding: space.xl, alignItems: "center", gap: space.lg },
  status: { alignItems: "center", minHeight: 84, justifyContent: "center", gap: space.xs },
  phase: { fontFamily: fonts.serif, fontSize: 30, lineHeight: 36 },
  seconds: { fontFamily: fonts.sans, fontSize: 32, fontVariant: ["tabular-nums"] },
  done: { fontFamily: fonts.serif, fontSize: 20, lineHeight: 26, textAlign: "center" },
});
