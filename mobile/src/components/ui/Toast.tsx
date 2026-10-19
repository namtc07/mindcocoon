import { useSyncExternalStore } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fonts } from "@/theme/fonts";
import { radius, space } from "@/theme/tokens";
import { useTheme } from "@/theme/theme";

const DURATION_MS = 2_500;
const WITH_ACTION_MS = 5_000;
type ToastAction = { label: string; onPress: () => void };
let message: string | null = null;
let action: ToastAction | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

/** Quiet confirmation ("Saved to your vault"), shown near the top, read by screen readers. */
export const toast = {
  /** An optional action (e.g. Undo) keeps the toast up a little longer. */
  show(text: string, act?: ToastAction) {
    message = text;
    action = act ?? null;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      message = null;
      action = null;
      timer = null;
      emit();
    }, act ? WITH_ACTION_MS : DURATION_MS);
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
  const act = action;
  return (
    <View pointerEvents={act ? "box-none" : "none"} style={[styles.wrap, { top: insets.top + space.md }]}>
      <View accessibilityLiveRegion="polite" accessibilityRole="alert" style={[styles.toast, { backgroundColor: c.card, borderColor: c.border }]}>
        <Text style={{ fontFamily: fonts.sansMedium, color: c.foreground, fontSize: 15 }}>{current}</Text>
        {act && (
          <Pressable
            accessibilityRole="button"
            hitSlop={10}
            onPress={() => {
              act.onPress();
              message = null;
              action = null;
              emit();
            }}
            style={styles.action}
          >
            <Text style={{ fontFamily: fonts.sansSemibold, color: c.primary, fontSize: 15 }}>{act.label}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "absolute", left: 0, right: 0, alignItems: "center" },
  toast: { flexDirection: "row", alignItems: "center", gap: space.lg, borderRadius: radius.full, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: space.xl, paddingVertical: space.md },
  action: { minHeight: 32, justifyContent: "center" },
});
