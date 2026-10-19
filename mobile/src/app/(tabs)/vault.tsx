import { lockVault } from "@mindcocoon/core/vault/session";
import { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Screen } from "@/components/Screen";
import { Button } from "@/components/ui/Button";
import { EntryReader } from "@/components/vault/EntryReader";
import { RecoveryCodeCard } from "@/components/vault/RecoveryCodeCard";
import { UnlockPanel } from "@/components/vault/UnlockPanel";
import { VaultList } from "@/components/vault/VaultList";
import { VaultSettings } from "@/components/vault/VaultSettings";
import { useVault } from "@/hooks/use-vault";
import { useI18n } from "@/i18n/i18n";
import { fonts } from "@/theme/fonts";
import { space } from "@/theme/tokens";
import { useTheme } from "@/theme/theme";
import { ScreenActive } from "@/components/art/activity";

export default function VaultScreen() {
  const { t } = useI18n();
  const { c } = useTheme();
  const vault = useVault();
  const [openId, setOpenId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState<string | null>(null);
  // Shown once the settings sheet has fully gone: iOS won't present a modal mid-dismissal.
  const [pendingCode, setPendingCode] = useState<string | null>(null);
  const open = vault.entries.find((e) => e.id === openId);

  let content;
  if (vault.status === "unavailable") {
    content = (
      <View style={styles.section}>
        <Text style={[styles.p, { color: c.foreground }]}>{t.vault.unavailable}</Text>
        <Button onPress={vault.retry}>{t.vault.retry}</Button>
      </View>
    );
  } else if (vault.status === "unsupported") {
    content = <Text style={[styles.p, { color: c.foreground }]}>{t.vault.unsupportedDevice}</Text>;
  } else if (vault.status === "locked") {
    content = <UnlockPanel resetReadyAt={vault.resetReadyAt} />;
  } else if (vault.status !== "unlocked") {
    content = <ActivityIndicator accessibilityLabel={t.common.loading} color={c.mutedForeground} />;
  } else if (open) {
    content = <EntryReader key={open.id} entry={open} onBack={() => setOpenId(null)} />;
  } else {
    content = (
      <View style={styles.section}>
        <View style={styles.row}>
          <Button variant="outline" onPress={() => setSettingsOpen(true)}>
            {t.vault.settings}
          </Button>
          {vault.hasPasscode && (
            <Button variant="ghost" onPress={lockVault}>
              {t.vault.lockNow}
            </Button>
          )}
        </View>
        <VaultList entries={vault.entries} onOpen={setOpenId} />
      </View>
    );
  }

  return (
    <ScreenActive>
    <Screen title={t.vault.title}>
      <Text style={[styles.p, { color: c.mutedForeground }]}>{t.vault.intro}</Text>
      <View style={styles.body}>{content}</View>
      <VaultSettings
        visible={settingsOpen}
        vault={vault}
        onClose={() => setSettingsOpen(false)}
        onRecoveryCode={setPendingCode}
        onDismissed={() => {
          if (!pendingCode) return;
          setRecoveryCode(pendingCode);
          setPendingCode(null);
        }}
      />
      <RecoveryCodeCard code={recoveryCode} onClose={() => setRecoveryCode(null)} />
    </Screen>
    </ScreenActive>
  );
}

const styles = StyleSheet.create({
  body: { marginTop: space.xl },
  section: { gap: space.lg },
  row: { flexDirection: "row", gap: space.md, flexWrap: "wrap" },
  p: { fontFamily: fonts.sans, fontSize: 15, lineHeight: 21 },
});
