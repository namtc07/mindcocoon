import { useEffect } from "react";
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import Svg, { Circle, Defs, Ellipse, G, Line, LinearGradient, Path, Rect, Stop, Text as SvgText } from "react-native-svg";
import { useAnimationsActive, useSvgId } from "./activity";
import { decorative } from "./seeded";

export type KenMood = "calm" | "sleepy" | "glad";
/**
 * Seasonal touches (Tết / Mid-autumn: a lantern; Christmas: a scarf) and quiet growth
 * ornaments (a sprout, later a star) that reflect how many evenings the person has
 * shown up — see @mindcocoon/core/companion. Growth only ever grows; nothing here is
 * earned, bought or collected, and it is never shown as a number.
 */
export type KenAccessory = "lantern" | "scarf" | "sprout" | "star";

/** Same tapered cocoon as the app icon, in a 100 × 120 box. */
const BODY = "M50 14 C68 14 88 40 88 70 C88 100 70 116 50 116 C30 116 12 100 12 70 C12 40 32 14 50 14 Z";
const INK = "#1f2a44";

function Face({ mood }: { mood: KenMood }) {
  if (mood === "sleepy") {
    return (
      <G stroke={INK} strokeWidth={2.4} strokeLinecap="round" fill="none">
        <Path d="M33 64 Q38 69 43 64" />
        <Path d="M57 64 Q62 69 67 64" />
        <Circle cx={50} cy={78} r={2.2} fill={INK} stroke="none" />
      </G>
    );
  }
  if (mood === "glad") {
    return (
      <G stroke={INK} strokeWidth={2.4} strokeLinecap="round" fill="none">
        <Path d="M33 66 Q38 60 43 66" />
        <Path d="M57 66 Q62 60 67 66" />
        <Path d="M42 76 Q50 84 58 76" />
      </G>
    );
  }
  return (
    <G>
      <Ellipse cx={38} cy={64} rx={3} ry={3.6} fill={INK} />
      <Ellipse cx={62} cy={64} rx={3} ry={3.6} fill={INK} />
      <Path d="M44 76 Q50 80 56 76" stroke={INK} strokeWidth={2.2} strokeLinecap="round" fill="none" />
    </G>
  );
}

/**
 * Kén, a small cocoon who keeps you company. No needs, nothing to feed, nothing to lose —
 * over many evenings it may quietly sprout, and much later carry a star.
 * Floats gently unless Reduce Motion is on.
 */
export function Ken({ mood = "calm", size = 72, accessory = null }: { mood?: KenMood; size?: number; accessory?: KenAccessory | null }) {
  const reduceMotion = useReducedMotion();
  const active = useAnimationsActive();
  const still = reduceMotion || !active;
  const id = useSvgId();
  const y = useSharedValue(0);
  useEffect(() => {
    if (still) return;
    y.set(withRepeat(withTiming(-3, { duration: 1800, easing: Easing.inOut(Easing.sin) }), -1, true));
    return () => {
      cancelAnimation(y);
      y.set(0);
    };
  }, [still, y]);
  const float = useAnimatedStyle(() => ({ transform: [{ translateY: y.get() }] }));
  return (
    <Animated.View testID={`ken-${mood}`} {...decorative} style={[{ width: size, height: size * 1.2 }, float]}>
      <Svg width="100%" height="100%" viewBox="0 0 106 120">
        <Defs>
          <LinearGradient id={`${id}-body`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#b6dcd2" />
            <Stop offset="0.6" stopColor="#8cc0b3" />
            <Stop offset="1" stopColor="#e2b77f" />
          </LinearGradient>
        </Defs>
        <Path d="M50 0 L50 14" stroke="#7fb5a8" strokeWidth={2} strokeLinecap="round" />
        <Path d={BODY} fill={`url(#${id}-body)`} />
        <Path d="M16 48 C36 40 64 54 86 46" stroke="#f1f5f9" strokeOpacity={0.4} strokeWidth={3} strokeLinecap="round" fill="none" />
        <Path d="M14 96 C36 88 64 104 86 94" stroke="#f1f5f9" strokeOpacity={0.35} strokeWidth={3} strokeLinecap="round" fill="none" />
        <Ellipse cx={30} cy={74} rx={6} ry={3.5} fill="#e08a7e" opacity={0.35} />
        <Ellipse cx={70} cy={74} rx={6} ry={3.5} fill="#e08a7e" opacity={0.35} />
        <Face mood={mood} />
        {accessory === "scarf" && (
          <G testID="ken-scarf">
            <Path d="M18 86 C36 94 64 94 82 86 L82 92 C64 100 36 100 18 92 Z" fill="#c0392b" />
            <Rect x={62} y={90} width={8} height={18} rx={3} fill="#a93226" />
          </G>
        )}
        {accessory === "sprout" && (
          <G testID="ken-sprout">
            <Path d="M50 14 C50 9 50 6 50 3" stroke="#5d8f83" strokeWidth={2.2} strokeLinecap="round" fill="none" />
            <Path d="M50 7 C45 7 42 4 41 0 C46 0 49 3 50 7 Z" fill="#7fb5a8" />
            <Path d="M50 7 C55 7 58 4 59 0 C54 0 51 3 50 7 Z" fill="#8cc0b3" />
          </G>
        )}
        {accessory === "star" && (
          <G testID="ken-star">
            <Path d="M90 18 L92.3 23.7 L98 26 L92.3 28.3 L90 34 L87.7 28.3 L82 26 L87.7 23.7 Z" fill="#d9a86c" />
          </G>
        )}
        {accessory === "lantern" && (
          <G testID="ken-lantern">
            <Line x1={92} y1={72} x2={92} y2={82} stroke="#d9a86c" strokeWidth={1.5} />
            <Rect x={85} y={82} width={14} height={18} rx={6} fill="#c0392b" />
            <Rect x={88} y={100} width={8} height={3} fill="#d9a86c" />
          </G>
        )}
        {mood === "sleepy" && (
          <SvgText x={80} y={22} fontSize={14} fill="#f1f5f9" opacity={0.75}>
            z
          </SvgText>
        )}
      </Svg>
    </Animated.View>
  );
}
