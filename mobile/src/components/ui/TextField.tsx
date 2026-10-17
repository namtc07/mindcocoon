import { StyleSheet, Text, TextInput, View, type TextInputProps } from "react-native";
import { appAutoLock } from "@/lib/app-auto-lock";
import { fonts } from "@/theme/fonts";
import { radius, space } from "@/theme/tokens";
import { useTheme } from "@/theme/theme";

interface TextFieldProps extends Omit<TextInputProps, "style"> {
  label: string;
  /** Show the label above the field (it is always the accessibility label). */
  showLabel?: boolean;
}

export function TextField({ label, showLabel = false, ...props }: TextFieldProps) {
  const { c, name } = useTheme();
  return (
    <View style={styles.wrap}>
      {showLabel && <Text style={[styles.label, { color: c.mutedForeground }]}>{label}</Text>}
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={c.mutedForeground}
        keyboardAppearance={name === "dusk" ? "dark" : "light"}
        {...props}
        // Keyboard taps never reach the root view's touch handler, so typing marks activity here.
        onChangeText={(text) => {
          appAutoLock.markActivity();
          props.onChangeText?.(text);
        }}
        style={[
          styles.input,
          props.multiline && styles.multiline,
          { color: c.foreground, borderColor: c.border, backgroundColor: c.surface },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.xs },
  label: { fontFamily: fonts.sans, fontSize: 14 },
  input: { minHeight: 44, borderWidth: 1, borderRadius: radius.md, paddingHorizontal: space.md, fontFamily: fonts.sans, fontSize: 16 },
  multiline: { minHeight: 88, paddingTop: space.md, textAlignVertical: "top" },
});
