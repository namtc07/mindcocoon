import type { ReactNode, Ref } from "react";
import { ScrollView, StyleSheet, Text, View, type ScrollViewInstance } from "react-native";
import { fonts } from "@/theme/fonts";
import { space } from "@/theme/tokens";
import { useTheme } from "@/theme/theme";

/** Scrollable page with a serif title, left-aligned like the web; `hero` (an illustration) sits above the title. */
export function Screen({
  title,
  children,
  scrollRef,
  hero,
  footer,
}: {
  title: string;
  children?: ReactNode;
  scrollRef?: Ref<ScrollViewInstance>;
  hero?: ReactNode;
  /** Pinned under the scrolling page (above the tab bar), e.g. the one banner. */
  footer?: ReactNode;
}) {
  const { c } = useTheme();
  const page = (
    <ScrollView
      testID="screen-scroll"
      ref={scrollRef}
      // The focused field stays above the keyboard (Today's note, Mood's form), and taps still land.
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
      style={{ backgroundColor: c.background }} contentContainerStyle={styles.content}>
      {hero}
      <Text accessibilityRole="header" style={[styles.title, { color: c.foreground }]}>
        {title}
      </Text>
      {children}
    </ScrollView>
  );
  if (!footer) return page;
  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      {page}
      {footer}
    </View>
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
