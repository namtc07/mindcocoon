import { MOOD_METER } from "@mindcocoon/core/feelings";
import { MOODS } from "@mindcocoon/core/moods";
import type { MoodType } from "@mindcocoon/core/types";
import { Pressable, StyleSheet, Text, View } from "react-native";
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
  /** "row": five dots in a line (compact). "orbs": glowing orbs on a soft arc, with a caption. */
  variant?: "row" | "orbs";
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
/** Heavier on the left, lighter on the right (by pleasantness, then energy). */
const ARC_ORDER = [...MOODS].sort((x, y) => MOOD_METER[x.id].pleasant - MOOD_METER[y.id].pleasant || MOOD_METER[x.id].energy - MOOD_METER[y.id].energy);
/** How far each orb dips, so the five lie on a soft smile-shaped curve. */
const DIP = [0, 14, 22, 14, 0];

function MoodOrbs({ value, onChange, label }: Props) {
  const { t } = useI18n();
  const { c } = useTheme();
  const radio = useMoodRadio(value, onChange);
  return (
    <View testID="feeling-orbs" style={styles.orbs}>
      <View accessibilityRole="radiogroup" accessibilityLabel={label} style={styles.arc}>
        {ARC_ORDER.map((m, i) => {
          const checked = m.id === value;
          return (
            <Pressable key={m.id} {...radio(m.id)} style={[styles.cell, { marginTop: DIP[i] }]}>
              <View style={[styles.halo, checked && { backgroundColor: c.mood[m.id] + "33", transform: [{ scale: 1.15 }] }]}>
                <View style={{ opacity: value && !checked ? 0.6 : 1 }}>
                  <Orb color={c.mood[m.id]} size={ORB} />
                </View>
              </View>
              <Text numberOfLines={1} style={[styles.orbLabel, { color: checked ? c.foreground : c.mutedForeground }]}>
                {t.mood.states[m.id].label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Text accessibilityLiveRegion="polite" style={[styles.caption, { color: value ? c.foreground : c.mutedForeground }]}>
        {value ? t.mood.states[value].description : t.feelings.tapOne}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "space-between", gap: 4 },
  item: { flex: 1, alignItems: "center", gap: 8, minHeight: 44, paddingVertical: 4 },
  label: { fontFamily: fonts.sans, fontSize: 12, textAlign: "center", lineHeight: 15 },
  orbs: { gap: space.md, paddingTop: space.xs },
  arc: { flexDirection: "row", justifyContent: "space-between" },
  cell: { flex: 1, alignItems: "center", gap: 6, minHeight: 44 },
  halo: { borderRadius: ORB, padding: 6 },
  orbLabel: { fontFamily: fonts.sansMedium, fontSize: 12 },
  caption: { fontFamily: fonts.serif, fontSize: 17, lineHeight: 23, textAlign: "center" },
});
