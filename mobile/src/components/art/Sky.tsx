import { useEffect, useState } from "react";
import { View } from "react-native";
import Animated, { cancelAnimation, useAnimatedProps, useReducedMotion, useSharedValue, withDelay, withRepeat, withTiming } from "react-native-reanimated";
import Svg, { Circle, Defs, G, Line, LinearGradient, Mask, Path, Rect, Stop } from "react-native-svg";
import type { Occasion } from "@mindcocoon/core/occasions";
import { useAnimationsActive, useSvgId } from "./activity";
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
  // x is a fraction of the drawing width, which follows the space the sky gets.
  return Array.from({ length: 22 }, () => ({ x: rnd(), y: rnd() * 70, r: 0.6 + rnd() * 1.1 }));
})();
const TWINKLING = 6;

function TwinkleStar({ x, y, r, delay, still }: { x: number; y: number; r: number; delay: number; still: boolean }) {
  const opacity = useSharedValue(0.9);
  useEffect(() => {
    if (still) return;
    opacity.set(withDelay(delay, withRepeat(withTiming(0.25, { duration: 1600 }), -1, true)));
    return () => {
      cancelAnimation(opacity);
      opacity.set(0.9);
    };
  }, [delay, opacity, still]);
  const animatedProps = useAnimatedProps(() => ({ opacity: opacity.get() }));
  return <AnimatedCircle testID="star" cx={x} cy={y} r={r} fill="#f1f5f9" animatedProps={animatedProps} />;
}

/** Seasonal touches drawn over the sky (decorative; the sky stays the same otherwise). */
function Decor({ occasion, vw, part }: { occasion: Occasion; vw: number; part: PartOfDay }) {
  if (occasion === "tet") {
    // A peach-blossom branch from the top left, and a red lantern.
    return (
      <G testID="sky-tet">
        <Path d="M0 8 C30 14 52 26 74 44" stroke="#5a3d27" strokeWidth={2.2} fill="none" strokeLinecap="round" />
        <Path d="M30 15 C36 24 38 30 40 36" stroke="#5a3d27" strokeWidth={1.4} fill="none" strokeLinecap="round" />
        {[[18, 12], [34, 18], [48, 28], [62, 36], [40, 34], [74, 44], [26, 10]].map(([x, y], i) => (
          <G key={i}>
            <Circle cx={x} cy={y} r={4} fill="#f4a7b9" />
            <Circle cx={x} cy={y} r={1.4} fill="#d9a86c" />
          </G>
        ))}
        <Line x1={vw * 0.55} y1={0} x2={vw * 0.55} y2={14} stroke="#d9a86c" strokeWidth={1} />
        <Rect x={vw * 0.55 - 7} y={14} width={14} height={18} rx={6} fill="#c0392b" />
        <Rect x={vw * 0.55 - 4} y={32} width={8} height={2} fill="#d9a86c" />
      </G>
    );
  }
  if (occasion === "mid-autumn") {
    // A star lantern hanging from the top.
    const x = vw * 0.3;
    return (
      <G testID="sky-mid-autumn">
        <Line x1={x} y1={0} x2={x} y2={16} stroke="#d9a86c" strokeWidth={1} />
        <Path d={`M${x} 16 L${x + 4} 26 L${x + 14} 27 L${x + 6} 34 L${x + 9} 44 L${x} 38 L${x - 9} 44 L${x - 6} 34 L${x - 14} 27 L${x - 4} 26 Z`} fill="#e74c3c" />
        <Circle cx={x} cy={30} r={3} fill="#f6d29b" />
      </G>
    );
  }
  if (occasion === "christmas") {
    const flakes = seeded(25);
    return (
      <G testID="sky-christmas">
        {Array.from({ length: 26 }, (_, i) => (
          <Circle key={i} cx={flakes() * vw} cy={flakes() * 90} r={0.8 + flakes() * 1.2} fill="#f1f5f9" opacity={0.75} />
        ))}
        <Path d={`M${vw * 0.2} 14 l3 7 7 1 -5 5 1 7 -6 -4 -6 4 1 -7 -5 -5 7 -1 Z`} fill="#f6d29b" />
      </G>
    );
  }
  if (occasion === "new-year") {
    const bursts = [[vw * 0.25, 28, "#f6d29b"], [vw * 0.6, 20, "#7fb5a8"], [vw * 0.8, 40, "#f4a7b9"]] as const;
    return (
      <G testID="sky-new-year">
        {bursts.map(([cx, cy, color], b) => (
          <G key={b}>
            {Array.from({ length: 10 }, (_, i) => {
              const a = (i / 10) * Math.PI * 2;
              return <Line key={i} x1={cx + Math.cos(a) * 4} y1={cy + Math.sin(a) * 4} x2={cx + Math.cos(a) * 11} y2={cy + Math.sin(a) * 11} stroke={color} strokeWidth={1.4} strokeLinecap="round" />;
            })}
          </G>
        ))}
      </G>
    );
  }
  // Full moon: drawn as the moon itself at night; a faint daytime moon otherwise.
  return <G testID="sky-full-moon">{part !== "night" && <Circle cx={vw * 0.85} cy={22} r={9} fill="#f1f5f9" opacity={0.35} />}</G>;
}

/**
 * A small landscape for the time of day: gradient sky, sun or moon, hills; stars (a few twinkling)
 * at night. The drawing is always H tall and as wide as the space's shape, so nothing is cropped.
 */
export function Sky({ part, height = H, occasion = null }: { part: PartOfDay; height?: number; occasion?: Occasion | null }) {
  const reduceMotion = useReducedMotion();
  const active = useAnimationsActive();
  const still = reduceMotion || !active;
  const id = useSvgId();
  const [vw, setVw] = useState(W);
  const s = SKIES[part];
  const sunX = vw * (part === "morning" ? 0.2 : part === "afternoon" ? 0.7 : 0.83);
  const moonX = vw - 60;
  const sunY = part === "afternoon" ? 30 : part === "evening" ? 78 : 58;
  return (
    <View
      testID={`sky-${part}`}
      {...decorative}
      onLayout={(e) => {
        const { width, height: h } = e.nativeEvent.layout;
        if (width > 0 && h > 0) setVw((H * width) / h);
      }}
      style={{ height, borderRadius: 22, overflow: "hidden" }}
    >
      <Svg testID="sky-svg" width="100%" height="100%" viewBox={`0 0 ${vw} ${H}`} preserveAspectRatio="xMidYMid slice">
        <Defs>
          <LinearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={s.top} />
            <Stop offset="1" stopColor={s.bottom} />
          </LinearGradient>
          <Mask id={`${id}-moon`}>
            <Rect width={vw} height={H} fill="white" />
            <Circle cx={moonX + 8} cy={24} r={13} fill="black" />
          </Mask>
        </Defs>
        <Rect width={vw} height={H} fill={`url(#${id}-sky)`} />
        {part === "night" &&
          STARS.map((star, i) =>
            i < TWINKLING ? (
              <TwinkleStar key={i} {...star} x={star.x * vw} delay={i * 450} still={still} />
            ) : (
              <Circle testID="star" key={i} cx={star.x * vw} cy={star.y} r={star.r} fill="#f1f5f9" opacity={0.6} />
            ),
          )}
        {part === "night" && (occasion === "full-moon" || occasion === "mid-autumn") ? (
          <G>
            <Circle cx={moonX} cy={30} r={24} fill={s.light} opacity={0.12} />
            <Circle cx={moonX} cy={30} r={16} fill={occasion === "mid-autumn" ? "#f6d29b" : s.light} />
          </G>
        ) : part === "night" ? (
          <Circle cx={moonX} cy={30} r={15} fill={s.light} mask={`url(#${id}-moon)`} />
        ) : (
          <>
            <Circle cx={sunX} cy={sunY} r={26} fill={s.light} opacity={0.25} />
            <Circle cx={sunX} cy={sunY} r={15} fill={s.light} />
          </>
        )}
        <G transform={`scale(${vw / W} 1)`}>
        <Path d={`M0 92 C60 70 120 74 180 88 C240 102 300 76 ${W} 84 L${W} ${H} L0 ${H} Z`} fill={s.back} />
        <Path d={`M0 104 C70 92 140 112 210 102 C270 94 320 100 ${W} 96 L${W} ${H} L0 ${H} Z`} fill={s.front} />
        </G>
        {occasion && <Decor occasion={occasion} vw={vw} part={part} />}
      </Svg>
    </View>
  );
}
