import type { ReactNode } from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { fonts } from "@/theme/fonts";
import { radius, space } from "@/theme/tokens";
import { useTheme } from "@/theme/theme";

/** Bottom sheet on a dimmed backdrop (tap outside to close). */
export function Sheet({
  visible,
  onClose,
  title,
  children,
  dismissable = true,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  dismissable?: boolean;
}) {
  const { c } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={() => {
        if (dismissable) onClose();
      }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.fill}>
        <Pressable accessibilityLabel={title} style={styles.backdrop} onPress={() => {
            if (dismissable) onClose();
          }} />
        <View style={[styles.sheet, { backgroundColor: c.card, borderColor: c.border }]} accessibilityViewIsModal>
          <Text accessibilityRole="header" style={[styles.title, { color: c.foreground }]}>
            {title}
          </Text>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.body}>
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(0,0,0,0.45)" },
  sheet: { maxHeight: "88%", borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, borderWidth: StyleSheet.hairlineWidth, padding: space.xl, paddingBottom: space.xxl },
  title: { fontFamily: fonts.serif, fontSize: 26, marginBottom: space.md },
  body: { gap: space.lg, paddingBottom: space.lg },
});
