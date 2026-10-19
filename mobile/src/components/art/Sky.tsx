import { useEffect } from "react";
import { View } from "react-native";
import Animated, { useAnimatedProps, useReducedMotion, useSharedValue, withDelay, withRepeat, withTiming } from "react-native-reanimated";
import Svg, { Circle, Defs, LinearGradient, Mask, Path, Rect, Stop } from "react-native-svg";
import { decorative, seeded } from "./seeded";

export type PartOfDay = "morning" | "afternoon" | "evening" | "night";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const W = 360;
const H = 120;

const SKIES: Record<PartOfDay, { top: string; bottom: string; back: string; front: string; light: string }> = {
  morning: { top: "#4d6f94", bottom: "#e7b88c", back: "#5d6f8c", front: "#33435f", light: "#f6d29b" },
  afternoon: { top: "#4f86a8", bottom: "#b9d6dd", back: "#6f9c91", front: "#3f7a6c", light: "#fbf3df" },
  evening: { top: "#1e2a4f", bottom: "#c98a5c", back: "#3a3f62", front: "#1d2340", light: "#e9a66b" },
  night: { top: "#0b1224", bottom: "#22345a", back: "#1b2847", front: "#111a30", light: "#f1f5f9" },
};

const STARS = (() => {
  const rnd = seeded(42);
  return Array.from({ length: 22 }, () => ({ x: rnd() * W, y: rnd() * 70, r: 0.6 + rnd() * 1.1 }));
})();
const TWINKLING = 6;

function TwinkleStar({ x, y, r, delay, still }: { x: number; y: number; r: number; delay: number; still: boolean }) {
  const opacity = useSharedValue(0.9);
  useEffect(() => {
    if (still) return;
    opacity.set(withDelay(delay, withRepeat(withTiming(0.25, { duration: 1600 }), -1, true)));
  }, [delay, opacity, still]);
  const animatedProps = useAnimatedProps(() => ({ opacity: opacity.get() }));
  return <AnimatedCircle testID="star" cx={x} cy={y} r={r} fill="#f1f5f9" animatedProps={animatedProps} />;
}

/** A small landscape for the time of day: gradient sky, sun or moon, hills; stars (a few twinkling) at night. */
export function Sky({ part, height = H }: { part: PartOfDay; height?: number }) {
  const still = useReducedMotion();
  const s = SKIES[part];
  const sunX = part === "morning" ? 70 : part === "afternoon" ? 250 : 300;
  const sunY = part === "afternoon" ? 30 : part === "evening" ? 78 : 58;
  return (
    <View testID={`sky-${part}`} {...decorative} style={{ height, borderRadius: 22, overflow: "hidden" }}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice">
        <Defs>
          <LinearGradient id={`sky-${part}`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={s.top} />
            <Stop offset="1" stopColor={s.bottom} />
          </LinearGradient>
          <Mask id="moon">
            <Rect width={W} height={H} fill="white" />
            <Circle cx={308} cy={24} r={13} fill="black" />
          </Mask>
        </Defs>
        <Rect width={W} height={H} fill={`url(#sky-${part})`} />
        {part === "night" &&
          STARS.map((star, i) =>
            i < TWINKLING ? (
              <TwinkleStar key={i} {...star} delay={i * 450} still={still} />
            ) : (
              <Circle testID="star" key={i} cx={star.x} cy={star.y} r={star.r} fill="#f1f5f9" opacity={0.6} />
            ),
          )}
        {part === "night" ? (
          <Circle cx={300} cy={30} r={15} fill={s.light} mask="url(#moon)" />
        ) : (
          <>
            <Circle cx={sunX} cy={sunY} r={26} fill={s.light} opacity={0.25} />
            <Circle cx={sunX} cy={sunY} r={15} fill={s.light} />
          </>
        )}
        <Path d={`M0 92 C60 70 120 74 180 88 C240 102 300 76 ${W} 84 L${W} ${H} L0 ${H} Z`} fill={s.back} />
        <Path d={`M0 104 C70 92 140 112 210 102 C270 94 320 100 ${W} 96 L${W} ${H} L0 ${H} Z`} fill={s.front} />
      </Svg>
    </View>
  );
}
