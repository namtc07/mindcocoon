import { useSyncExternalStore } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fonts } from "@/theme/fonts";
import { radius, space } from "@/theme/tokens";
import { useTheme } from "@/theme/theme";

const DURATION_MS = 2_500;
let message: string | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

/** Quiet confirmation ("Saved to your vault"), shown near the top, read by screen readers. */
export const toast = {
  show(text: string) {
    message = text;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      message = null;
      timer = null;
      emit();
    }, DURATION_MS);
    emit();
  },
};

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function ToastHost() {
  const current = useSyncExternalStore(subscribe, () => message, () => null);
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  if (!current) return null;
  return (
    <View pointerEvents="none" style={[styles.wrap, { top: insets.top + space.md }]}>
      <View accessibilityLiveRegion="polite" accessibilityRole="alert" style={[styles.toast, { backgroundColor: c.card, borderColor: c.border }]}>
        <Text style={{ fontFamily: fonts.sansMedium, color: c.foreground, fontSize: 15 }}>{current}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "absolute", left: 0, right: 0, alignItems: "center" },
  toast: { borderRadius: radius.full, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: space.xl, paddingVertical: space.md },
});
