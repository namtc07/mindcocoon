import { VaultLockedError, saveVaultEntry, unlockWithPasscode } from "@mindcocoon/core/vault/session";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { TextField } from "@/components/ui/TextField";
import { toast } from "@/components/ui/Toast";
import { openVault, useVault } from "@/hooks/use-vault";
import { useI18n } from "@/i18n/i18n";
import { fonts } from "@/theme/fonts";
import { space } from "@/theme/tokens";
import { useTheme } from "@/theme/theme";

export function SaveSheet({
  visible,
  body,
  onClose,
  onSaved,
  defaultTitle = "",
}: {
  visible: boolean;
  body: string;
  onClose: () => void;
  onSaved: () => void;
  /** Used when the title field is left empty. */
  defaultTitle?: string;
}) {
  const { t } = useI18n();
  const { c } = useTheme();
  const vault = useVault();
  const locked = vault.status === "locked";
  const [title, setTitle] = useState("");
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    setError(null);
    try {
      await openVault();
      if (locked && !(await unlockWithPasscode(passcode))) {
        setError(t.vent.wrongPasscode);
        return;
      }
      await saveVaultEntry({ title: title.trim() || defaultTitle, body });
      toast.show(t.vent.saved);
      setTitle("");
      setPasscode("");
      onSaved();
    } catch (e) {
      // The words stay in the editor; nothing is lost.
      setError(e instanceof VaultLockedError ? t.vent.lockedHint : t.vault.unavailable);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet visible={visible} onClose={onClose} title={t.vent.saveTitle}>
      <Text style={{ fontFamily: fonts.sans, fontSize: 15, color: c.mutedForeground }}>{t.vent.saveDescription}</Text>
      <TextField label={t.vent.titleLabel} showLabel value={title} onChangeText={setTitle} maxLength={120} />
      {locked && <TextField label={t.vent.passcodeLabel} placeholder={t.vent.lockedHint} value={passcode} onChangeText={setPasscode} secureTextEntry />}
      {error && <Text accessibilityRole="alert" style={{ color: c.destructive, fontFamily: fonts.sans }}>{error}</Text>}
      <View style={styles.row}>
        <Button onPress={() => void save()} disabled={busy || (locked && !passcode)}>
          {t.common.save}
        </Button>
        <Button variant="ghost" onPress={onClose}>
          {t.common.cancel}
        </Button>
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({ row: { flexDirection: "row", gap: space.md } });
