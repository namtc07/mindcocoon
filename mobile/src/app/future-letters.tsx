import { formatDay } from "@mindcocoon/core/dates";
import { saveVaultEntry, VaultLockedError } from "@mindcocoon/core/vault/session";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Muted, Screen } from "@/components/Screen";
import { StackHeader } from "@/components/StackHeader";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { toast } from "@/components/ui/Toast";
import { UnlockPanel } from "@/components/vault/UnlockPanel";
import { useMoodLogs } from "@/hooks/use-mood-logs";
import { useNow } from "@/hooks/use-now";
import { useVault } from "@/hooks/use-vault";
import { useI18n } from "@/i18n/i18n";
import { futureLetters, isOpenable, type LetterWhen } from "@/lib/future-letters";
import { fonts } from "@/theme/fonts";
import { radius, space } from "@/theme/tokens";
import { useTheme } from "@/theme/theme";

/** Write a letter to your later self, sealed until a week, a month, or a hard week. Ad-free. */
export default function FutureLettersScreen() {
  const { t, locale } = useI18n();
  const { c } = useTheme();
  const now = useNow();
  const vault = useVault();
  const { logs } = useMoodLogs();
  const letters = futureLetters.use();
  const [draft, setDraft] = useState("");
  const [when, setWhen] = useState<LetterWhen>("month");
  const [open, setOpen] = useState<{ id: string; text: string } | null>(null);

  async function seal() {
    try {
      await futureLetters.add({ text: draft, when });
      setDraft("");
      toast.show(t.futureLetters.sealed);
    } catch (e) {
      toast.show(e instanceof VaultLockedError ? t.today.noteLocked : t.vault.unavailable);
    }
  }

  async function read(id: string) {
    setOpen({ id, text: await futureLetters.read(id).catch(() => "") });
  }

  async function settle(keep: boolean) {
    if (!open) return;
    try {
      if (keep && open.text) await saveVaultEntry({ title: t.futureLetters.title, body: open.text });
      await futureLetters.remove(open.id);
      setOpen(null);
    } catch {
      toast.show(t.vault.unavailable);
    }
  }

  const choices: { id: LetterWhen; label: string }[] = [
    { id: "week", label: t.futureLetters.week },
    { id: "month", label: t.futureLetters.month },
    { id: "hard-week", label: t.futureLetters.hardWeek },
  ];
  const ready = letters.filter((l) => isOpenable(l, now, logs));
  const sealed = letters.filter((l) => !isOpenable(l, now, logs));
  const locked = vault.status === "locked";

  return (
    <>
      <StackHeader />
      <Screen title={t.futureLetters.title}>
        <Muted>{t.futureLetters.intro}</Muted>
        {locked ? (
          <UnlockPanel resetReadyAt={null} />
        ) : open ? (
          <View style={[styles.paper, { backgroundColor: c.surface }]}>
            <Text style={[styles.letter, { color: c.foreground }]}>{open.text}</Text>
            <Button onPress={() => void settle(true)}>{t.futureLetters.keep}</Button>
            <Button variant="ghost" onPress={() => void settle(false)}>
              {t.futureLetters.letGo}
            </Button>
          </View>
        ) : (
          <>
            {ready.map((l) => (
              <View key={l.id} style={[styles.paper, { backgroundColor: c.surface }]}>
                <Text style={[styles.meta, { color: c.mutedForeground }]}>{t.futureLetters.written.replace("{date}", formatDay(new Date(l.createdAt), locale))}</Text>
                <Button onPress={() => void read(l.id)}>{t.futureLetters.open}</Button>
              </View>
            ))}
            <TextField label={t.futureLetters.label} placeholder={t.futureLetters.label} value={draft} onChangeText={setDraft} multiline maxLength={4000} />
            <Text style={[styles.meta, { color: c.mutedForeground }]}>{t.futureLetters.whenLabel}</Text>
            <View accessibilityRole="radiogroup" accessibilityLabel={t.futureLetters.whenLabel} style={styles.choices}>
              {choices.map((o) => (
                <Pressable
                  key={o.id}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: when === o.id }}
                  onPress={() => setWhen(o.id)}
                  style={[styles.choice, { borderColor: when === o.id ? c.primary : c.border, backgroundColor: when === o.id ? c.surface : "transparent" }]}
                >
                  <Text style={{ fontFamily: fonts.sans, fontSize: 15, color: when === o.id ? c.foreground : c.mutedForeground }}>{o.label}</Text>
                </Pressable>
              ))}
            </View>
            <Button disabled={!draft.trim()} onPress={() => void seal()}>
              {t.futureLetters.seal}
            </Button>
            {sealed.map((l) => (
              <Text key={l.id} style={[styles.meta, { color: c.mutedForeground }]}>
                {l.openAt ? t.futureLetters.sealedUntil.replace("{date}", formatDay(new Date(l.openAt), locale)) : t.futureLetters.sealedHard}
              </Text>
            ))}
          </>
        )}
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  paper: { borderRadius: radius.lg, padding: space.lg, gap: space.md },
  letter: { fontFamily: fonts.serif, fontSize: 19, lineHeight: 29 },
  meta: { fontFamily: fonts.sans, fontSize: 14 },
  choices: { flexDirection: "row", flexWrap: "wrap", gap: space.sm },
  choice: { borderWidth: 1, borderRadius: radius.full, paddingHorizontal: space.lg, minHeight: 40, justifyContent: "center" },
});
