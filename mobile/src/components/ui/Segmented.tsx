import { Pressable, StyleSheet, Text, View } from "react-native";
import { fonts } from "@/theme/fonts";
import { radius } from "@/theme/tokens";
import { useTheme } from "@/theme/theme";

/** A small tab bar inside a screen (a few parts of one place), with the selected part filled. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
  label: string;
}) {
  const { c } = useTheme();
  return (
    <View accessibilityRole="tablist" accessibilityLabel={label} style={[styles.bar, { backgroundColor: c.surface }]}>
      {options.map((o) => {
        const selected = o.id === value;
        return (
          <Pressable
            key={o.id}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(o.id)}
            style={[styles.tab, selected && { backgroundColor: c.card, borderColor: c.border }]}
          >
            <Text style={[styles.text, { color: selected ? c.foreground : c.mutedForeground }]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: "row", borderRadius: radius.full, padding: 4, gap: 4 },
  tab: { flex: 1, minHeight: 40, borderRadius: radius.full, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "transparent" },
  text: { fontFamily: fonts.sansMedium, fontSize: 14 },
});
