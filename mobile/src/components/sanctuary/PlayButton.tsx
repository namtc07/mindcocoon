import { Pause, Play } from "lucide-react-native";
import { Pressable, StyleSheet } from "react-native";
import { useI18n } from "@/i18n/i18n";
import { radius } from "@/theme/tokens";
import { useTheme } from "@/theme/theme";

/** Round play/pause toggle for one sound ("Play: Rain" / "Pause: Rain"). */
export function PlayButton({ name, playing, onPress, size = 44, filled }: { name: string; playing: boolean; onPress: () => void; size?: number; filled?: boolean }) {
  const { t } = useI18n();
  const { c } = useTheme();
  const fg = filled ? c.primaryForeground : playing ? c.primary : c.mutedForeground;
  const Icon = playing ? Pause : Play;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${playing ? t.sanctuary.pause : t.sanctuary.play}: ${name}`}
      accessibilityState={{ selected: playing }}
      onPress={onPress}
      style={[
        styles.button,
        { width: size, height: size },
        filled
          ? { backgroundColor: c.primary, borderColor: c.primary }
          : { borderColor: playing ? c.primary : c.border, backgroundColor: playing ? c.surface : "transparent" },
      ]}
    >
      <Icon size={size > 44 ? 20 : 16} color={fg} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { borderRadius: radius.full, borderWidth: 1, alignItems: "center", justifyContent: "center" },
});
