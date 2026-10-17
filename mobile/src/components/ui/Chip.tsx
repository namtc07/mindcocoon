import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { fonts } from "@/theme/fonts";
import { radius, space } from "@/theme/tokens";
import { useTheme } from "@/theme/theme";

/** Toggleable pill (tags, options). */
export function Chip({ children, selected, onPress }: { children: ReactNode; selected: boolean; onPress: () => void }) {
  const { c } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      hitSlop={6}
      style={[
        styles.chip,
        { borderColor: selected ? c.primary : c.border, backgroundColor: selected ? c.surface : "transparent" },
      ]}
    >
      <Text style={{ fontFamily: fonts.sans, fontSize: 15, color: selected ? c.foreground : c.mutedForeground }}>
        {children}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: { minHeight: 36, justifyContent: "center", borderWidth: 1, borderRadius: radius.full, paddingHorizontal: space.lg },
});
