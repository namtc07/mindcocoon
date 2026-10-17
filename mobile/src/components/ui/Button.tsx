import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, type ViewStyle } from "react-native";
import { fonts } from "@/theme/fonts";
import { radius, space } from "@/theme/tokens";
import { useTheme } from "@/theme/theme";

export type ButtonVariant = "primary" | "ghost" | "ember" | "outline" | "destructive";

interface ButtonProps {
  children: ReactNode;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  accessibilityLabel?: string;
  style?: ViewStyle;
}

/** Rounded pill button; at least 44 pt tall. */
export function Button({ children, onPress, variant = "primary", disabled, accessibilityLabel, style }: ButtonProps) {
  const { c } = useTheme();
  const palette: Record<ButtonVariant, { bg: string; fg: string; border: string }> = {
    primary: { bg: c.primary, fg: c.primaryForeground, border: c.primary },
    ember: { bg: c.ember, fg: c.primaryForeground, border: c.ember },
    ghost: { bg: "transparent", fg: c.mutedForeground, border: "transparent" },
    outline: { bg: "transparent", fg: c.foreground, border: c.border },
    destructive: { bg: "transparent", fg: c.destructive, border: c.destructive },
  };
  const p = palette[variant];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? (typeof children === "string" ? children : undefined)}
      accessibilityState={{ disabled: Boolean(disabled) }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: p.bg, borderColor: p.border, opacity: disabled ? 0.45 : pressed ? 0.8 : 1 },
        style,
      ]}
    >
      <Text style={[styles.label, { color: p.fg }]}>{children}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 44,
    paddingHorizontal: space.xl,
    borderRadius: radius.full,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
  },
  label: { fontFamily: fonts.sansMedium, fontSize: 16 },
});
