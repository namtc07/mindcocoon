import { MOODS } from "@mindcocoon/core/moods";
import type { MoodType } from "@mindcocoon/core/types";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useI18n } from "@/i18n/i18n";
import { fonts } from "@/theme/fonts";
import { useTheme } from "@/theme/theme";

/** Five coloured states as a radio group, one row on any phone width. */
export function MoodPicker({
  value,
  onChange,
  label,
  size = "lg",
}: {
  value: MoodType | null;
  onChange: (mood: MoodType) => void;
  label: string;
  size?: "md" | "lg";
}) {
  const { t } = useI18n();
  const { c } = useTheme();
  const dot = size === "lg" ? 46 : 36;
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} style={styles.row}>
      {MOODS.map((m) => {
        const checked = m.id === value;
        const copy = t.mood.states[m.id];
        return (
          <Pressable
            key={m.id}
            accessibilityRole="radio"
            accessibilityLabel={copy.label}
            accessibilityHint={copy.description}
            accessibilityState={{ checked }}
            onPress={() => onChange(m.id)}
            style={styles.item}
          >
            <View
              style={[
                styles.dot,
                { width: dot, height: dot, borderRadius: dot / 2, backgroundColor: c.mood[m.id] },
                checked && { borderWidth: 3, borderColor: c.foreground, transform: [{ scale: 1.08 }] },
              ]}
            />
            <Text numberOfLines={2} style={[styles.label, { color: checked ? c.foreground : c.mutedForeground }]}>
              {copy.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "space-between", gap: 4 },
  item: { flex: 1, alignItems: "center", gap: 8, minHeight: 44, paddingVertical: 4 },
  dot: {},
  label: { fontFamily: fonts.sans, fontSize: 12, textAlign: "center", lineHeight: 15 },
});
