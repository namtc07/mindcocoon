import { formatDay } from "@mindcocoon/core/dates";
import type { DecryptedJournalEntry } from "@mindcocoon/core/types";
import { deleteVaultEntry, updateVaultEntry } from "@mindcocoon/core/vault/session";
import { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { toast } from "@/components/ui/Toast";
import { useI18n } from "@/i18n/i18n";
import { fonts } from "@/theme/fonts";
import { space } from "@/theme/tokens";
import { useTheme } from "@/theme/theme";

export function EntryReader({ entry, onBack }: { entry: DecryptedJournalEntry; onBack: () => void }) {
  const { t, locale } = useI18n();
  const { c } = useTheme();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(entry.title ?? "");
  const [body, setBody] = useState(entry.body);

  function confirmDelete() {
    Alert.alert(t.vault.deleteConfirm, undefined, [
      { text: t.common.cancel, style: "cancel" },
      {
        text: t.common.delete,
        style: "destructive",
        onPress: async () => {
          await deleteVaultEntry(entry.id);
          toast.show(t.vault.deleted);
          onBack();
        },
      },
    ]);
  }

  return (
    <View style={styles.wrap}>
      <Button variant="ghost" onPress={onBack}>
        {t.vault.backToList}
      </Button>
      {editing ? (
        <View style={styles.wrap}>
          <TextField label={t.vault.titleLabel} showLabel value={title} onChangeText={setTitle} maxLength={120} />
          <TextField label={t.vault.bodyLabel} showLabel value={body} onChangeText={setBody} multiline autoCorrect={false} />
          <View style={styles.row}>
            <Button
              disabled={!body.trim()}
              onPress={async () => {
                await updateVaultEntry(entry.id, { title, body });
                toast.show(t.vault.updated);
                setEditing(false);
              }}
            >
              {t.common.save}
            </Button>
            <Button variant="ghost" onPress={() => setEditing(false)}>
              {t.common.cancel}
            </Button>
          </View>
        </View>
      ) : (
        <>
          <Text style={{ fontFamily: fonts.sans, fontSize: 13, color: c.mutedForeground }}>{formatDay(new Date(entry.createdAt), locale)}</Text>
          <Text accessibilityRole="header" style={[styles.title, { color: c.foreground }]}>
            {entry.title || t.vault.untitled}
          </Text>
          <Text selectable style={[styles.body, { color: c.foreground }]}>
            {entry.body}
          </Text>
          <View style={styles.row}>
            <Button variant="outline" onPress={() => setEditing(true)}>
              {t.vault.edit}
            </Button>
            <Button variant="destructive" onPress={confirmDelete}>
              {t.common.delete}
            </Button>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.lg },
  title: { fontFamily: fonts.serif, fontSize: 30, lineHeight: 36 },
  body: { fontFamily: fonts.serif, fontSize: 19, lineHeight: 30 },
  row: { flexDirection: "row", gap: space.md, flexWrap: "wrap" },
});
