import { formatDay } from "@mindcocoon/core/dates";
import { saveVaultEntry } from "@mindcocoon/core/vault/session";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Muted, Screen } from "@/components/Screen";
import { StackHeader } from "@/components/StackHeader";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toast";
import { UnlockPanel } from "@/components/vault/UnlockPanel";
import { useNow } from "@/hooks/use-now";
import { useVault } from "@/hooks/use-vault";
import { useI18n } from "@/i18n/i18n";
import { isReady, keepAnotherDay, readWorry, removeWorry, useWorries } from "@/lib/worries";
import { fonts } from "@/theme/fonts";
import { radius, space } from "@/theme/tokens";
import { useTheme } from "@/theme/theme";

/** Morning-after view of the worry box. Ad-free; the text is decrypted only when "Read" is tapped. */
export default function WorriesScreen() {
  const { t, locale } = useI18n();
  const { c } = useTheme();
  const now = useNow();
  const vault = useVault();
  const worries = useWorries();
  const [open, setOpen] = useState<{ id: string; text: string } | null>(null);
  const ready = worries.filter((w) => isReady(w, now));
  const waiting = worries.length > ready.length;

  async function read(id: string) {
    try {
      setOpen({ id, text: await readWorry(id) });
    } catch {
      toast.show(t.vault.unavailable);
    }
  }

  async function act(kind: "letGo" | "keep" | "later") {
    if (!open) return;
    try {
      if (kind === "keep") await saveVaultEntry({ title: t.worries.vaultTitle, body: open.text });
      if (kind === "later") await keepAnotherDay(open.id);
      else await removeWorry(open.id);
      if (kind === "letGo") toast.show(t.worries.letGoDone);
      if (kind === "keep") toast.show(t.vent.saved);
      setOpen(null);
    } catch {
      toast.show(t.vault.unavailable);
    }
  }

  return (
    <>
      <StackHeader />
      <Screen title={t.worries.title}>
        <Muted>{t.worries.intro}</Muted>
        {vault.status === "locked" && ready.length > 0 ? (
          <UnlockPanel resetReadyAt={null} />
        ) : open ? (
          <View style={[styles.card, { backgroundColor: c.surface }]}>
            <Text style={[styles.text, { color: c.foreground }]}>{open.text}</Text>
            <Text style={[styles.question, { color: c.mutedForeground }]}>{t.worries.stillHeavy}</Text>
            <View style={styles.actions}>
              <Button onPress={() => void act("letGo")}>{t.worries.letGo}</Button>
              <Button variant="outline" onPress={() => void act("keep")}>
                {t.worries.keep}
              </Button>
              <Button variant="ghost" onPress={() => void act("later")}>
                {t.worries.anotherDay}
              </Button>
            </View>
          </View>
        ) : (
          <View style={styles.list}>
            {ready.map((w) => (
              <View key={w.id} style={[styles.row, { backgroundColor: c.surface }]}>
                <Text style={[styles.when, { color: c.mutedForeground }]}>
                  {formatDay(new Date(w.createdAt), locale)}
                </Text>
                <Button variant="outline" onPress={() => void read(w.id)}>
                  {t.worries.read}
                </Button>
              </View>
            ))}
            {waiting && <Muted>{t.worries.waiting}</Muted>}
            {worries.length === 0 && <Muted>{t.worries.empty}</Muted>}
          </View>
        )}
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, padding: space.xl, gap: space.lg },
  text: { fontFamily: fonts.serif, fontSize: 22, lineHeight: 30 },
  question: { fontFamily: fonts.sans, fontSize: 15 },
  actions: { gap: space.sm },
  list: { gap: space.md },
  row: { borderRadius: radius.lg, padding: space.lg, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: space.md },
  when: { fontFamily: fonts.sans, fontSize: 15, flex: 1 },
});
