import type { ReactNode, Ref } from "react";
import { ScrollView, StyleSheet, Text, type ScrollViewInstance } from "react-native";
import { fonts } from "@/theme/fonts";
import { space } from "@/theme/tokens";
import { useTheme } from "@/theme/theme";

/** Scrollable page with a serif title, left-aligned like the web. */
export function Screen({ title, children, scrollRef }: { title: string; children?: ReactNode; scrollRef?: Ref<ScrollViewInstance> }) {
  const { c } = useTheme();
  return (
    <ScrollView ref={scrollRef} style={{ backgroundColor: c.background }} contentContainerStyle={styles.content}>
      <Text accessibilityRole="header" style={[styles.title, { color: c.foreground }]}>
        {title}
      </Text>
      {children}
    </ScrollView>
  );
}

export function Muted({ children }: { children: ReactNode }) {
  const { c } = useTheme();
  return <Text style={[styles.muted, { color: c.mutedForeground }]}>{children}</Text>;
}

const styles = StyleSheet.create({
  content: { padding: space.xl, paddingBottom: space.xxl * 2, gap: space.md },
  title: { fontFamily: fonts.serif, fontSize: 34, lineHeight: 40 },
  muted: { fontFamily: fonts.sans, fontSize: 15, lineHeight: 22 },
});
