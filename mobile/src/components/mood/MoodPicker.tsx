import { MOOD_METER } from "@mindcocoon/core/feelings";
import { MOODS } from "@mindcocoon/core/moods";
import type { MoodType } from "@mindcocoon/core/types";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Defs, RadialGradient, Rect, Stop } from "react-native-svg";
import { useSvgId } from "@/components/art/activity";
import { useI18n } from "@/i18n/i18n";
import { fonts } from "@/theme/fonts";
import { radius, space } from "@/theme/tokens";
import { useTheme } from "@/theme/theme";

type Props = {
  value: MoodType | null;
  onChange: (mood: MoodType) => void;
  label: string;
  size?: "md" | "lg";
  /** "row": five dots in a line (compact). "meter": energy × pleasantness map with large orbs. */
  variant?: "row" | "meter";
};

/** Five coloured states as a radio group: a compact row, or a two-axis meter. */
export function MoodPicker(props: Props) {
  return props.variant === "meter" ? <MoodMeter {...props} /> : <MoodRow {...props} />;
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

const ORB = 60;
/** Side labels sit between the radios; screen readers get the same idea from each mood's hint. */
const SIDE_LABEL = { accessibilityElementsHidden: true, importantForAccessibility: "no-hide-descendants" } as const;

function MoodMeter({ value, onChange, label }: Props) {
  const { t } = useI18n();
  const { c } = useTheme();
  const radio = useMoodRadio(value, onChange);
  const gid = useSvgId();
  const at = (energy: number, pleasant: number) => MOODS.find((m) => MOOD_METER[m.id].energy === energy && MOOD_METER[m.id].pleasant === pleasant)!.id;
  const cell = (id: MoodType) => {
    const checked = id === value;
    return (
      <Pressable key={id} {...radio(id)} style={styles.cell}>
        <View style={[styles.orb, checked && { borderColor: c.foreground, transform: [{ scale: 1.1 }] }]}>
          <Orb color={c.mood[id]} size={ORB} />
        </View>
        <Text numberOfLines={1} style={[styles.orbLabel, { color: checked ? c.foreground : c.mutedForeground }]}>
          {t.mood.states[id].label}
        </Text>
      </Pressable>
    );
  };
  const axis = [styles.axis, { color: c.mutedForeground }];
  const AXIS_SCALE = 1.3;
  return (
    <View testID="feelings-meter" style={[styles.meter, { borderColor: c.border }]}>
      {/* Soft corner glows in each corner mood's colour (decorative). */}
      <View style={StyleSheet.absoluteFill} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
          <Defs>
            {(["anxious", "hopeful", "heavy", "peaceful"] as const).map((id) => (
              <RadialGradient key={id} id={`${gid}-${id}`} cx="50%" cy="50%" r="50%">
                <Stop offset="0" stopColor={c.mood[id]} stopOpacity={0.28} />
                <Stop offset="1" stopColor={c.mood[id]} stopOpacity={0} />
              </RadialGradient>
            ))}
          </Defs>
          <Rect x={-30} y={-30} width={90} height={90} fill={`url(#${gid}-anxious)`} />
          <Rect x={40} y={-30} width={90} height={90} fill={`url(#${gid}-hopeful)`} />
          <Rect x={-30} y={40} width={90} height={90} fill={`url(#${gid}-heavy)`} />
          <Rect x={40} y={40} width={90} height={90} fill={`url(#${gid}-peaceful)`} />
        </Svg>
      </View>
      <Text maxFontSizeMultiplier={AXIS_SCALE} style={[axis, styles.center]}>{t.feelings.meter.moreEnergy}</Text>
      <View accessibilityRole="radiogroup" accessibilityLabel={label} style={styles.grid}>
        <View style={styles.line}>
          {cell(at(1, -1))}
          {cell(at(1, 1))}
        </View>
        <View style={styles.line}>
          <Text {...SIDE_LABEL} maxFontSizeMultiplier={AXIS_SCALE} style={[axis, styles.side]}>{t.feelings.meter.unpleasant}</Text>
          {cell(at(0, 0))}
          <Text {...SIDE_LABEL} maxFontSizeMultiplier={AXIS_SCALE} style={[axis, styles.side, { textAlign: "right" }]}>{t.feelings.meter.pleasant}</Text>
        </View>
        <View style={styles.line}>
          {cell(at(-1, -1))}
          {cell(at(-1, 1))}
        </View>
      </View>
      <Text maxFontSizeMultiplier={AXIS_SCALE} style={[axis, styles.center]}>{t.feelings.meter.lessEnergy}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "space-between", gap: 4 },
  item: { flex: 1, alignItems: "center", gap: 8, minHeight: 44, paddingVertical: 4 },
  label: { fontFamily: fonts.sans, fontSize: 12, textAlign: "center", lineHeight: 15 },
  meter: { borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.xl, overflow: "hidden", paddingVertical: space.md, paddingHorizontal: space.lg, gap: space.xs },
  grid: { gap: space.xs },
  line: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  // The orb cell keeps its size; side labels give way (and wrap) at large text sizes.
  cell: { alignItems: "center", gap: 6, minWidth: 88, maxWidth: 104, minHeight: 44, flexShrink: 0 },
  orb: { borderRadius: ORB, borderWidth: 3, borderColor: "transparent" },
  orbLabel: { fontFamily: fonts.sansMedium, fontSize: 13 },
  axis: { fontFamily: fonts.sans, fontSize: 11, opacity: 0.85 },
  center: { textAlign: "center" },
  side: { flex: 1, flexShrink: 1 },
});
