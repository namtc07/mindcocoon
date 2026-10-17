import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withTiming } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { fonts } from "@/theme/fonts";
import { useTheme } from "@/theme/theme";

/** One drifting word. Offsets are generated in the release handler, never during render. */
export interface DissolveToken {
  text: string;
  dx: number;
  dy: number;
  rotate: number;
  delay: number;
}

export interface DissolveEmber {
  left: number;
  top: number;
  size: number;
  dx: number;
  dy: number;
  delay: number;
}

export interface DissolvePlan {
  tokens: DissolveToken[];
  /** Words beyond the animated budget fade out together (keeps old phones smooth). */
  rest: string;
  embers: DissolveEmber[];
}

const ANIMATED_WORDS = 120;
const DRIFT_MS = 1100;
const STAGGER_MS = 1300;
const REDUCED_MS = 600;
export const DISSOLVE_TOTAL_MS = STAGGER_MS + 250 + DRIFT_MS + 200;

export function planDissolve(text: string, random: () => number = Math.random): DissolvePlan {
  const words = text.normalize("NFC").split(/(\s+)/).filter((w) => w.length > 0);
  const animated = words.slice(0, ANIMATED_WORDS * 2);
  const n = Math.max(animated.length, 1);
  return {
    tokens: animated.map((w, i) => ({
      text: w,
      dx: (random() - 0.5) * 60,
      dy: -(40 + random() * 110),
      rotate: (random() - 0.5) * 30,
      delay: ((n - 1 - i) / n) * STAGGER_MS + random() * 250,
    })),
    rest: words.slice(ANIMATED_WORDS * 2).join(""),
    embers: Array.from({ length: Math.min(36, 10 + Math.floor(text.length / 25)) }, () => ({
      left: random() * 100,
      top: 30 + random() * 60,
      size: 2 + random() * 3,
      dx: (random() - 0.5) * 80,
      dy: -(120 + random() * 200),
      delay: random() * STAGGER_MS,
    })),
  };
}

function Word({ token, color, ember }: { token: DissolveToken; color: string; ember: string }) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withDelay(token.delay, withTiming(1, { duration: DRIFT_MS, easing: Easing.inOut(Easing.quad) }));
  }, [p, token.delay]);
  const style = useAnimatedStyle(() => ({
    opacity: 1 - p.value,
    color: p.value > 0.35 ? ember : color,
    transform: [{ translateX: token.dx * p.value }, { translateY: token.dy * p.value }, { rotate: `${token.rotate * p.value}deg` }],
  }));
  return <Animated.Text style={[styles.type, style]}>{token.text}</Animated.Text>;
}

function Ember({ e, color }: { e: DissolveEmber; color: string }) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withDelay(e.delay, withTiming(1, { duration: 1600, easing: Easing.out(Easing.quad) }));
  }, [p, e.delay]);
  const style = useAnimatedStyle(() => ({
    opacity: p.value < 0.3 ? p.value * 3 : 1 - p.value,
    transform: [{ translateX: e.dx * p.value }, { translateY: e.dy * p.value }],
  }));
  return (
    <Animated.View
      style={[{ position: "absolute", left: `${e.left}%`, top: `${e.top}%`, width: e.size, height: e.size, borderRadius: e.size, backgroundColor: color }, style]}
    />
  );
}

/** Words drift up and burn to ember; Reduce Motion gets a short fade. A soft haptic marks the end. */
export function Dissolve({ plan, onDone }: { plan: DissolvePlan; onDone: () => void }) {
  const { c } = useTheme();
  const reduceMotion = useReducedMotion();
  const total = reduceMotion ? REDUCED_MS : DISSOLVE_TOTAL_MS;
  const fade = useSharedValue(1);

  useEffect(() => {
    fade.value = withTiming(0, { duration: reduceMotion ? REDUCED_MS : DISSOLVE_TOTAL_MS });
    const id = setTimeout(() => {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      onDone();
    }, total);
    return () => clearTimeout(id);
  }, [fade, onDone, reduceMotion, total]);

  const restStyle = useAnimatedStyle(() => ({ opacity: fade.value }));

  if (reduceMotion) {
    return (
      <Animated.Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[styles.type, { color: c.foreground }, restStyle]}>
        {plan.tokens.map((t) => t.text).join("") + plan.rest}
      </Animated.Text>
    );
  }

  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" pointerEvents="none">
      {/* Nested Text can't be transformed in React Native, so each word is its own view in a wrapping row. */}
      <View style={styles.flow}>
        {plan.tokens.map((t, i) =>
          /^\s+$/.test(t.text) ? (
            t.text.includes("\n") ? <View key={i} style={styles.lineBreak} /> : <View key={i} style={styles.space} />
          ) : (
            <Word key={i} token={t} color={c.foreground} ember={c.ember} />
          ),
        )}
      </View>
      {plan.rest ? <Animated.Text style={[styles.type, { color: c.foreground }, restStyle]}>{plan.rest}</Animated.Text> : null}
      {plan.embers.map((e, i) => (
        <Ember key={`e${i}`} e={e} color={c.ember} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  type: { fontFamily: fonts.serif, fontSize: 21, lineHeight: 34 },
  flow: { flexDirection: "row", flexWrap: "wrap", alignItems: "flex-end" },
  space: { width: 6, height: 34 },
  lineBreak: { width: "100%", height: 0 },
});
