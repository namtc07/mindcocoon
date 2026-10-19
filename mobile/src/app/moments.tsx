import { formatDay } from "@mindcocoon/core/dates";
import { VaultLockedError } from "@mindcocoon/core/vault/session";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ken } from "@/components/art/Ken";
import { Muted, Screen } from "@/components/Screen";
import { StackHeader } from "@/components/StackHeader";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { toast } from "@/components/ui/Toast";
import { UnlockPanel } from "@/components/vault/UnlockPanel";
import { useVault } from "@/hooks/use-vault";
import { useI18n } from "@/i18n/i18n";
import { moments } from "@/lib/moments";
import { fonts } from "@/theme/fonts";
import { radius, space } from "@/theme/tokens";
import { useTheme } from "@/theme/theme";

/**
 * The jar of light moments: add a small good thing; read what's inside (decrypted on this screen
 * only). `?show=<id>` opens with that one moment first (Kén bringing it back on a heavy day).
 */
export default function MomentsScreen() {
  const { t, locale } = useI18n();
  const { c } = useTheme();
  const vault = useVault();
  const items = moments.use();
  const { show } = useLocalSearchParams<{ show?: string }>();
  const [draft, setDraft] = useState("");
  const [texts, setTexts] = useState<Record<string, string>>({});

  const locked = vault.status === "locked";
  useEffect(() => {
    if (locked) return;
    let live = true;
    Promise.all(items.map(async (m) => [m.id, await moments.read(m.id).catch(() => "")] as const)).then((pairs) => {
      if (live) setTexts(Object.fromEntries(pairs));
    });
    return () => {
      live = false;
    };
  }, [items, locked]);

  async function add() {
    if (!draft.trim()) return;
    try {
      await moments.add(draft);
      setDraft("");
      toast.show(t.moments.kept);
    } catch (e) {
      toast.show(e instanceof VaultLockedError ? t.today.noteLocked : t.vault.unavailable);
    }
  }

  // The one Kén brought back comes first; then newest first.
  const ordered = [...items].reverse().sort((a, b) => Number(b.id === show) - Number(a.id === show));
  return (
    <>
      <StackHeader />
      <Screen title={t.moments.title}>
        <Muted>{t.moments.intro}</Muted>
        {locked ? (
          <UnlockPanel resetReadyAt={null} />
        ) : (
          <>
            <TextField label={t.moments.label} placeholder={t.moments.label} value={draft} onChangeText={setDraft} multiline maxLength={280} />
            <Button disabled={!draft.trim()} onPress={() => void add()}>
              {t.moments.add}
            </Button>
            {ordered.length === 0 ? (
              <View style={styles.empty}>
                <Ken size={56} />
                <Muted>{t.moments.empty}</Muted>
              </View>
            ) : (
              <View style={styles.list}>
                {ordered.map((m) => (
                  <View key={m.id} style={[styles.card, { backgroundColor: c.surface, borderColor: m.id === show ? c.ember : "transparent" }]}>
                    <Text style={[styles.date, { color: c.mutedForeground }]}>{formatDay(new Date(m.createdAt), locale)}</Text>
                    <Text style={[styles.text, { color: c.foreground }]}>{texts[m.id] ?? ""}</Text>
                    <Button variant="ghost" onPress={() => void moments.remove(m.id)}>
                      {t.moments.remove}
                    </Button>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  empty: { flexDirection: "row", alignItems: "center", gap: space.lg, marginTop: space.lg },
  list: { gap: space.md, marginTop: space.lg },
  card: { borderRadius: radius.lg, padding: space.lg, gap: space.xs, borderWidth: 1.5 },
  date: { fontFamily: fonts.sans, fontSize: 13 },
  text: { fontFamily: fonts.serif, fontSize: 19, lineHeight: 27 },
});
