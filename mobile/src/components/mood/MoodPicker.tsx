import { MOODS } from "@mindcocoon/core/moods";
import type { MoodType } from "@mindcocoon/core/types";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Pressable, type ScrollViewInstance, StyleSheet, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import Animated, {
  cancelAnimation,
  Easing,
  FadeIn,
  FadeOut,
  runOnJS,
  scrollTo,
  type SharedValue,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle, Defs, RadialGradient, Stop } from "react-native-svg";
import { useSvgId } from "@/components/art/activity";
import { useI18n } from "@/i18n/i18n";
import { fonts } from "@/theme/fonts";
import { space } from "@/theme/tokens";
import { useTheme } from "@/theme/theme";

type Props = {
  value: MoodType | null;
  onChange: (mood: MoodType) => void;
  label: string;
  size?: "md" | "lg";
  /** "row": five dots in a line (compact). "orbs": a swipeable arc of glowing orbs (tap to choose), with a caption. */
  variant?: "row" | "orbs";
  /** How far the arc reaches past its parent's padding to the screen edges (orbs only). */
  bleed?: number;
};

/** Five coloured states as a radio group: a compact row, or glowing orbs on an arc. */
export function MoodPicker(props: Props) {
  return props.variant === "orbs" ? <MoodOrbs {...props} /> : <MoodRow {...props} />;
}

function useMoodRadio(value: MoodType | null, onChange: (m: MoodType) => void) {
  const { t } = useI18n();
  return (id: MoodType) => {
    const copy = t.mood.states[id];
    return {
      accessibilityRole: "radio" as const,
      accessibilityLabel: copy.label,
      accessibilityHint: copy.description,
      accessibilityState: { checked: id === value },
      onPress: () => onChange(id),
    };
  };
}

function MoodRow({ value, onChange, label, size = "lg" }: Props) {
  const { t } = useI18n();
  const { c } = useTheme();
  const radio = useMoodRadio(value, onChange);
  const dot = size === "lg" ? 46 : 36;
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} style={styles.row}>
      {MOODS.map((m) => {
        const checked = m.id === value;
        return (
          <Pressable key={m.id} {...radio(m.id)} style={styles.item}>
            <View
              style={[
                { width: dot, height: dot, borderRadius: dot / 2, backgroundColor: c.mood[m.id] },
                checked && { borderWidth: 3, borderColor: c.foreground, transform: [{ scale: 1.08 }] },
              ]}
            />
            <Text numberOfLines={2} style={[styles.label, { color: checked ? c.foreground : c.mutedForeground }]}>
              {t.mood.states[m.id].label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Mix a hex colour toward white (0–1). */
function lighten(hex: string, amount: number) {
  const n = parseInt(hex.slice(1), 16);
  const ch = (shift: number) => Math.round(((n >> shift) & 255) + (255 - ((n >> shift) & 255)) * amount);
  return `rgb(${ch(16)}, ${ch(8)}, ${ch(0)})`;
}

function Orb({ color, size }: { color: string; size: number }) {
  const id = useSvgId();
  return (
    <Svg width={size} height={size}>
      <Defs>
        <RadialGradient id={`${id}-orb`} cx="38%" cy="34%" r="70%">
          <Stop offset="0" stopColor={lighten(color, 0.45)} />
          <Stop offset="1" stopColor={color} />
        </RadialGradient>
      </Defs>
      <Circle cx={size / 2} cy={size / 2} r={size / 2} fill={`url(#${id}-orb)`} />
    </Svg>
  );
}

const ORB = 52;
/** Width of one orb's slot on the arc (the scroll snaps to it). */
export const ARC_ITEM = 76;
/** The ten moods repeat this many times so the arc never runs out; the middle copy is the "real" one. */
const ARC_COPIES = 7;
export const ARC_MIDDLE = Math.floor(ARC_COPIES / 2);
const N = MOODS.length;
const SLOTS = Array.from({ length: N * ARC_COPIES }, (_, i) => ({ slot: i, mood: MOODS[i % N], copy: Math.floor(i / N) }));
/** Index of a mood's slot in the middle copy. */
const middleSlot = (moodIndex: number) => ARC_MIDDLE * N + moodIndex;
/** Room above for the rising neighbours, and below so the middle label is never cut off. */
const RISE = 40;
const BELOW = 18;

function ArcOrb({ index, scrollX, children }: { index: number; scrollX: SharedValue<number>; children: ReactNode }) {
  // The middle orb is lowest; neighbours rise and fade — a soft smile-shaped arc.
  const style = useAnimatedStyle(() => {
    const d = Math.min(Math.abs(index * ARC_ITEM - scrollX.get()) / ARC_ITEM, 2.5);
    return { opacity: 1 - d * 0.26, transform: [{ translateY: -d * d * 6 }] };
  });
  return <Animated.View style={[styles.slot, style]}>{children}</Animated.View>;
}

/** Only the orb grows near the middle (the label keeps its size, so it always fits). */
function ArcScale({ index, scrollX, children }: { index: number; scrollX: SharedValue<number>; children: ReactNode }) {
  const style = useAnimatedStyle(() => {
    const d = Math.min(Math.abs(index * ARC_ITEM - scrollX.get()) / ARC_ITEM, 2.5);
    return { transform: [{ scale: 1.18 - d * 0.16 }] };
  });
  return <Animated.View style={style}>{children}</Animated.View>;
}

/** A small "pop" when an orb is chosen: a quick swell that settles back with a spring. */
function Pop({ on, children }: { on: boolean; children: ReactNode }) {
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);
  useEffect(() => {
    if (on && !reduceMotion) scale.set(withSequence(withTiming(1.14, { duration: 140 }), withSpring(1, { damping: 9, stiffness: 180 })));
  }, [on, reduceMotion, scale]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));
  return <Animated.View style={style}>{children}</Animated.View>;
}

const GLIDE_MS = 480;

function MoodOrbs({ value, onChange, label, bleed = space.xl }: Props) {
  const { t } = useI18n();
  const { c } = useTheme();
  const radio = useMoodRadio(value, onChange);
  const reduceMotion = useReducedMotion();
  // The animated ref drives the eased glide on the UI thread; the plain one settles exactly (and serves tests).
  const animatedRef = useAnimatedRef<Animated.ScrollView>();
  const jsRef = useRef<ScrollViewInstance | null>(null);
  const [width, setWidth] = useState(0);
  const startSlot = middleSlot(value ? MOODS.findIndex((m) => m.id === value) : Math.floor(N / 2));
  const scrollX = useSharedValue(startSlot * ARC_ITEM);
  const glideX = useSharedValue(0);
  const gliding = useSharedValue(false);
  const lastSlot = useSharedValue(startSlot);

  const tick = () => void Haptics.selectionAsync().catch(() => {});
  const jump = (slot: number) => jsRef.current?.scrollTo({ x: slot * ARC_ITEM, animated: false });

  const onScroll = useAnimatedScrollHandler((e) => {
    scrollX.set(e.contentOffset.x);
    // A soft tick each time a new orb passes the middle while swiping (like a picker wheel).
    const slot = Math.round(e.contentOffset.x / ARC_ITEM);
    if (slot !== lastSlot.get()) {
      lastSlot.set(slot);
      if (!gliding.get()) runOnJS(tick)();
    }
  });
  // While gliding, follow the eased value frame by frame.
  useAnimatedReaction(
    () => glideX.get(),
    (x) => {
      if (gliding.get()) scrollTo(animatedRef, x, 0, false);
    },
  );

  /** Ease the orb at `slot` into the middle (or jump there under Reduce Motion). */
  function glideTo(slot: number) {
    if (reduceMotion) return jump(slot);
    cancelAnimation(glideX);
    glideX.set(scrollX.get());
    gliding.set(true);
    glideX.set(
      withTiming(slot * ARC_ITEM, { duration: GLIDE_MS, easing: Easing.out(Easing.cubic) }, (finished) => {
        gliding.set(false);
        if (finished) runOnJS(jump)(slot);
      }),
    );
  }

  // A choice made elsewhere (or on first layout) starts in the middle.
  useEffect(() => {
    if (width > 0) jump(startSlot);
  }, [width, startSlot]);
  /** After a swipe settles, jump (invisibly) to the same mood in the middle copy, so there is always more. */
  function recentre(x: number) {
    const slot = Math.round(x / ARC_ITEM);
    const same = middleSlot(((slot % N) + N) % N);
    if (slot !== same) jump(same);
  }
  const side = Math.max(0, (width - ARC_ITEM) / 2);
  return (
    <View testID="feeling-orbs" style={[styles.orbs, { marginHorizontal: -bleed }]} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      <Animated.ScrollView
        testID="feeling-arc"
        ref={(node: ScrollViewInstance | null) => {
          jsRef.current = node;
          if (typeof animatedRef === "function") (animatedRef as (n: unknown) => void)(node);
        }}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={ARC_ITEM}
        decelerationRate="fast"
        onScroll={onScroll}
        scrollEventThrottle={16}
        onScrollBeginDrag={() => {
          // A finger takes over from any glide in progress.
          cancelAnimation(glideX);
          gliding.set(false);
        }}
        onMomentumScrollEnd={(e) => recentre(e.nativeEvent.contentOffset.x)}
        contentContainerStyle={{ paddingHorizontal: side, paddingTop: RISE, paddingBottom: BELOW }}
      >
        <View accessibilityRole="radiogroup" accessibilityLabel={label} style={styles.arc}>
          {SLOTS.map(({ slot, mood: m, copy }) => {
            const checked = m.id === value;
            const { onPress, ...a11y } = radio(m.id);
            // Screen readers get each mood once (the middle copy); the repeats are for swiping.
            const repeat = copy !== ARC_MIDDLE;
            return (
              <ArcOrb key={slot} index={slot} scrollX={scrollX}>
                <Pressable
                  {...a11y}
                  accessibilityElementsHidden={repeat}
                  importantForAccessibility={repeat ? "no-hide-descendants" : "auto"}
                  onPress={() => {
                    tick();
                    onPress();
                    glideTo(slot);
                  }}
                  style={styles.cell}
                >
                  <ArcScale index={slot} scrollX={scrollX}>
                    <Pop on={checked}>
                      <View style={styles.halo}>
                        {checked && (
                          <Animated.View
                            entering={FadeIn.duration(260)}
                            exiting={FadeOut.duration(200)}
                            style={[StyleSheet.absoluteFill, styles.glow, { backgroundColor: c.mood[m.id] + "40" }]}
                          />
                        )}
                        <Orb color={c.mood[m.id]} size={ORB} />
                      </View>
                    </Pop>
                  </ArcScale>
                  <Text numberOfLines={1} style={[styles.orbLabel, { color: checked ? c.foreground : c.mutedForeground }]}>
                    {t.mood.states[m.id].label}
                  </Text>
                </Pressable>
              </ArcOrb>
            );
          })}
        </View>
      </Animated.ScrollView>
      <Animated.Text
        key={value ?? "none"}
        entering={FadeIn.duration(260)}
        accessibilityLiveRegion="polite"
        style={[styles.caption, { color: value ? c.foreground : c.mutedForeground }]}
      >
        {value ? t.mood.states[value].description : t.feelings.tapOne}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "space-between", gap: 4 },
  item: { flex: 1, alignItems: "center", gap: 8, minHeight: 44, paddingVertical: 4 },
  label: { fontFamily: fonts.sans, fontSize: 12, textAlign: "center", lineHeight: 15 },
  orbs: { gap: space.sm },
  arc: { flexDirection: "row" },
  slot: { width: ARC_ITEM, alignItems: "center" },
  cell: { alignItems: "center", gap: 10, minHeight: 44, width: ARC_ITEM },
  halo: { borderRadius: ORB, padding: 6 },
  glow: { borderRadius: ORB },
  orbLabel: { fontFamily: fonts.sansMedium, fontSize: 12 },
  caption: { fontFamily: fonts.serif, fontSize: 17, lineHeight: 23, textAlign: "center" },
});
