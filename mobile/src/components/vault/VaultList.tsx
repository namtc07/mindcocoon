import { formatDay } from "@mindcocoon/core/dates";
import type { DecryptedJournalEntry } from "@mindcocoon/core/types";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/i18n/i18n";
import { fonts } from "@/theme/fonts";
import { space } from "@/theme/tokens";
import { useTheme } from "@/theme/theme";

const firstLine = (body: string) => body.split("\n").find((l) => l.trim())?.trim() ?? "";

export function VaultList({ entries, onOpen }: { entries: DecryptedJournalEntry[]; onOpen: (id: string) => void }) {
  const { t, locale } = useI18n();
  const { c } = useTheme();
  if (entries.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={{ fontFamily: fonts.serif, fontSize: 20, lineHeight: 28, color: c.mutedForeground }}>{t.vault.empty}</Text>
        <Button variant="outline" onPress={() => router.navigate("/vent")}>
          {t.vault.writeFirst}
        </Button>
      </View>
    );
  }
  return (
    <View>
      {entries.map((e, i) => {
        const title = e.title || firstLine(e.body) || t.vault.untitled;
        return (
          <Pressable
            key={e.id}
            accessibilityRole="button"
            accessibilityLabel={title}
            onPress={() => onOpen(e.id)}
            style={[styles.item, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border }]}
          >
            <Text numberOfLines={1} style={{ fontFamily: fonts.serif, fontSize: 20, color: c.foreground }}>
              {title}
            </Text>
            <Text style={{ fontFamily: fonts.sans, fontSize: 13, color: c.mutedForeground }}>{formatDay(new Date(e.createdAt), locale)}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { gap: space.lg, paddingTop: space.lg, alignItems: "flex-start" },
  item: { paddingVertical: space.lg, gap: 4, minHeight: 44 },
});
