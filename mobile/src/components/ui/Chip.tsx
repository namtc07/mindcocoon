import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { fonts } from "@/theme/fonts";
import { radius, space } from "@/theme/tokens";
import { useTheme } from "@/theme/theme";

/** Toggleable pill (tags, options). */
export function Chip({ children, selected, onPress, disabled }: { children: ReactNode; selected: boolean; onPress: () => void; disabled?: boolean }) {
  const { c } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected, disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={6}
      style={[
        styles.chip,
        { borderColor: selected ? c.primary : c.border, backgroundColor: selected ? c.surface : "transparent", opacity: disabled ? 0.5 : 1 },
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
