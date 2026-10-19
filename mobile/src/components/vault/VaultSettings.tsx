import { lockVault, regenerateRecoveryCode, removeVaultPasscode, setVaultAutoLock, setVaultPasscode } from "@mindcocoon/core/vault/session";
import { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Sheet } from "@/components/ui/Sheet";
import { toast } from "@/components/ui/Toast";
import type { MobileVaultState } from "@/hooks/use-vault";
import { useI18n } from "@/i18n/i18n";
import { fonts } from "@/theme/fonts";
import { space } from "@/theme/tokens";
import { useTheme } from "@/theme/theme";
import { disableBiometric } from "@/lib/biometric";
import { BiometricToggle } from "./BiometricToggle";
import { PasscodeForm } from "./PasscodeForm";

const AUTO_LOCK_CHOICES = [1, 5, 15, 30];

export function VaultSettings({
  visible,
  vault,
  onClose,
  onRecoveryCode,
  onDismissed,
}: {
  visible: boolean;
  vault: MobileVaultState;
  onClose: () => void;
  onRecoveryCode: (code: string) => void;
  onDismissed: () => void;
}) {
  const { t } = useI18n();
  const { c } = useTheme();
  const [form, setForm] = useState(false);

  return (
    <Sheet
      visible={visible}
      onClose={() => {
        setForm(false);
        onClose();
      }}
      title={t.vault.settings}
      onDismissed={onDismissed}
    >
      <Text style={{ fontFamily: fonts.sans, fontSize: 15, color: c.mutedForeground }}>{vault.hasPasscode ? t.vault.passcodeOn : t.vault.passcodeOff}</Text>
      {form ? (
        <PasscodeForm
          submitLabel={t.vault.savePasscode}
          onSubmit={async (passcode) => {
            const { recoveryCode } = await setVaultPasscode(passcode);
            await disableBiometric(); // the stored passcode is now wrong
            toast.show(t.vault.passcodeSet);
            setForm(false);
            onClose();
            if (recoveryCode) onRecoveryCode(recoveryCode);
          }}
        />
      ) : (
        <View style={styles.list}>
          <Button variant="outline" onPress={() => setForm(true)}>
            {vault.hasPasscode ? t.vault.changePasscode : t.vault.setPasscode}
          </Button>
          {vault.hasPasscode && (
            <>
              <Button
                variant="outline"
                onPress={() => {
                  onClose();
                  lockVault();
                }}
              >
                {t.vault.lockNow}
              </Button>
              <Button
                variant="outline"
                onPress={async () => {
                  const code = await regenerateRecoveryCode();
                  onClose();
                  onRecoveryCode(code);
                }}
              >
                {t.vault.regenerateCode}
              </Button>
              <BiometricToggle />
              <Text style={{ fontFamily: fonts.sansMedium, fontSize: 15, color: c.foreground }}>{t.vault.autoLock}</Text>
              <View style={styles.chips}>
                {AUTO_LOCK_CHOICES.map((n) => (
                  <Chip key={n} selected={vault.autoLockMinutes === n} onPress={() => void setVaultAutoLock(n)}>
                    {t.vault.minutes.replace("{n}", String(n))}
                  </Chip>
                ))}
              </View>
              <Button
                variant="ghost"
                onPress={() =>
                  // Removing protection is easy to do by accident: ask first.
                  Alert.alert(t.vault.removePasscode, t.vault.removePasscodeConfirm, [
                    { text: t.common.cancel, style: "cancel" },
                    {
                      text: t.vault.removePasscode,
                      style: "destructive",
                      onPress: async () => {
                        await removeVaultPasscode();
                        await disableBiometric();
                        toast.show(t.vault.passcodeRemoved);
                      },
                    },
                  ])
                }
              >
                {t.vault.removePasscode}
              </Button>
            </>
          )}
        </View>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  list: { gap: space.md },
  chips: { flexDirection: "row", gap: space.sm, flexWrap: "wrap" },
});
