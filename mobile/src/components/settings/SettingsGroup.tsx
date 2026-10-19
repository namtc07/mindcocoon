import { ChevronRight, type LucideIcon } from "lucide-react-native";
import { Children, Fragment, isValidElement, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { fonts } from "@/theme/fonts";
import { radius, space } from "@/theme/tokens";
import { useTheme } from "@/theme/theme";

/** A titled card of rows, separated by hairlines — like a phone's own settings. */
export function SettingsGroup({ title, testID, footer, children }: { title: string; testID?: string; footer?: string; children: ReactNode }) {
  const { c } = useTheme();
  const rows = Children.toArray(children).filter(isValidElement);
  return (
    <View testID={testID} style={styles.group}>
      <Text accessibilityRole="header" style={[styles.title, { color: c.mutedForeground }]}>
        {title}
      </Text>
      {rows.length > 0 && (
        <View style={[styles.card, { backgroundColor: c.surface }]}>
          {rows.map((row, i) => (
            <Fragment key={i}>
              {i > 0 && <View style={[styles.divider, { backgroundColor: c.border }]} />}
              <View style={styles.cell}>{row}</View>
            </Fragment>
          ))}
        </View>
      )}
      {footer ? <Text style={[styles.footer, { color: c.mutedForeground }]}>{footer}</Text> : null}
    </View>
  );
}

/** A row that goes somewhere (link) or does something (button), with an icon and a chevron. */
export function SettingsRow({
  icon: Icon,
  label,
  onPress,
  role = "link",
  destructive,
  disabled,
}: {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
  role?: "link" | "button";
  destructive?: boolean;
  disabled?: boolean;
}) {
  const { c } = useTheme();
  const color = destructive ? c.destructive : c.foreground;
  return (
    <Pressable
      accessibilityRole={role}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.row, { opacity: disabled ? 0.5 : pressed ? 0.6 : 1 }]}
    >
      <Icon size={18} color={destructive ? c.destructive : c.mutedForeground} />
      <Text style={[styles.label, { color }]}>{label}</Text>
      {role === "link" && <ChevronRight size={18} color={c.mutedForeground} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  group: { gap: space.sm },
  title: { fontFamily: fonts.sansMedium, fontSize: 14, paddingHorizontal: space.xs },
  card: { borderRadius: radius.lg, paddingHorizontal: space.lg },
  cell: { paddingVertical: space.sm },
  divider: { height: StyleSheet.hairlineWidth },
  footer: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 18, paddingHorizontal: space.xs },
  row: { flexDirection: "row", alignItems: "center", gap: space.md, minHeight: 44 },
  label: { flex: 1, fontFamily: fonts.sans, fontSize: 16 },
});
