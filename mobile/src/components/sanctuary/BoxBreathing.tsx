import { breathAt, TOTAL_MS, type BreathPhase } from "@mindcocoon/core/breathing";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { AccessibilityInfo, AppState, Platform, StyleSheet, Text, View } from "react-native";
import Animated, { cancelAnimation, Easing, useAnimatedProps, useReducedMotion, useSharedValue, withTiming } from "react-native-reanimated";
import Svg, { Circle, Rect } from "react-native-svg";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/i18n/i18n";
import { breathAtWorklet, dotPosition, INNER_SIDE, innerScale, PAD, phaseOf, SIZE } from "@/lib/breath-geometry";
import { fonts } from "@/theme/fonts";
import { radius, space } from "@/theme/tokens";
import { useTheme } from "@/theme/theme";

const AnimatedRect = Animated.createAnimatedComponent(Rect);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const KEEP_AWAKE_TAG = "breathing";
const LABEL_TICK_MS = 250;

/** Box breathing, about a minute: the square draws on the UI thread; labels follow core `breathAt`. */
export function BoxBreathing() {
  const { t } = useI18n();
  const { c } = useTheme();
  const reduceMotion = useReducedMotion();
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const clock = useSharedValue(0);

  const running = startedAt !== null;
  const state = breathAt(elapsed);
  const finished = running && state.done;
  const active = running && !finished;

  const stop = useCallback(() => {
    cancelAnimation(clock);
    clock.set(0);
    setStartedAt(null);
    setElapsed(0);
  }, [clock]);

  function begin() {
    setElapsed(0);
    setStartedAt(Date.now());
    clock.set(0);
    clock.set(withTiming(TOTAL_MS, { duration: TOTAL_MS, easing: Easing.linear }));
  }

  // Labels: a light JS tick (the drawing itself never waits on JS).
  useEffect(() => {
    if (startedAt === null) return;
    const id = setInterval(() => setElapsed(Date.now() - startedAt), LABEL_TICK_MS);
    return () => clearInterval(id);
  }, [startedAt]);

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
      if (s !== "active") stop();
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
    const on = clock.value > 0 && clock.value < TOTAL_MS;
    const b = breathAtWorklet(clock.value);
    const scale = on && !reduceMotion ? innerScale(phaseOf(b.phaseIndex), b.progress) : 0.6;
    const side = INNER_SIDE * scale;
    return { x: SIZE / 2 - side / 2, y: SIZE / 2 - side / 2, width: side, height: side, opacity: on ? 0.28 + 0.2 * scale : 0.18 };
  });

  const dotProps = useAnimatedProps(() => {
    const on = clock.value > 0 && clock.value < TOTAL_MS;
    const b = breathAtWorklet(clock.value);
    const p = dotPosition(phaseOf(b.phaseIndex), b.progress);
    return { cx: p.x, cy: p.y, opacity: on ? 1 : 0 };
  });


  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <Text accessibilityRole="header" style={[styles.title, { color: c.foreground }]}>
          {t.sanctuary.breatheTitle}
        </Text>
        <Text style={[styles.intro, { color: c.mutedForeground }]}>{t.sanctuary.breatheIntro}</Text>
      </View>
      <View style={[styles.card, { backgroundColor: c.surface }]}>
        <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} accessible={false} importantForAccessibility="no-hide-descendants">
          <Rect x={PAD} y={PAD} width={SIZE - PAD * 2} height={SIZE - PAD * 2} rx={18} fill="none" stroke={c.border} strokeWidth={2} />
          <AnimatedRect animatedProps={innerProps} rx={14} fill={c.primary} />
          {!reduceMotion && <AnimatedCircle animatedProps={dotProps} r={7} fill={c.primary} />}
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
  title: { fontFamily: fonts.serif, fontSize: 24, lineHeight: 30 },
  intro: { fontFamily: fonts.sans, fontSize: 15 },
  card: { borderRadius: radius.lg, padding: space.xl, alignItems: "center", gap: space.lg },
  status: { alignItems: "center", minHeight: 84, justifyContent: "center", gap: space.xs },
  phase: { fontFamily: fonts.serif, fontSize: 30, lineHeight: 36 },
  seconds: { fontFamily: fonts.sans, fontSize: 32, fontVariant: ["tabular-nums"] },
  done: { fontFamily: fonts.serif, fontSize: 20, lineHeight: 26, textAlign: "center" },
});
