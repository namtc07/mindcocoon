import { formatTime } from "@mindcocoon/core/dates";
import {
  checkRecoveryCode,
  completePasscodeReset,
  requestPasscodeReset,
  resetPasscodeWithRecoveryCode,
} from "@mindcocoon/core/vault/session";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { toast } from "@/components/ui/Toast";
import { useNow } from "@/hooks/use-now";
import { useI18n } from "@/i18n/i18n";
import { disableBiometric } from "@/lib/biometric";
import { fonts } from "@/theme/fonts";
import { space } from "@/theme/tokens";
import { useTheme } from "@/theme/theme";
import { PasscodeForm } from "./PasscodeForm";

/** Recovery code (instant) or a reset on this device after one hour. Account reset comes in M5. */
export function ForgotPasscode({ resetReadyAt, onBack }: { resetReadyAt: number | null; onBack: () => void }) {
  const { t, locale } = useI18n();
  const { c } = useTheme();
  const now = useNow();
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);
  const [verifiedCode, setVerifiedCode] = useState<string | null>(null);
  const resetReady = resetReadyAt !== null && now.getTime() >= resetReadyAt;

  if (verifiedCode) {
    return (
      <View style={styles.section}>
        <Text style={[styles.h, { color: c.foreground }]}>{t.vault.chooseNew}</Text>
        <PasscodeForm
          submitLabel={t.vault.savePasscode}
          onSubmit={async (passcode) => {
            if (await resetPasscodeWithRecoveryCode(verifiedCode, passcode)) {
              await disableBiometric();
              toast.show(t.vault.resetDone);
            }
          }}
        />
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <Text accessibilityRole="header" style={[styles.title, { color: c.foreground }]}>
        {t.vault.forgotTitle}
      </Text>
      <View style={styles.section}>
        <Text style={[styles.h, { color: c.foreground }]}>{t.vault.useRecovery}</Text>
        <TextField label={t.vault.recoveryInputLabel} value={code} onChangeText={setCode} multiline autoCapitalize="none" autoCorrect={false} autoComplete="off" />
        {codeError && <Text style={{ color: c.destructive, fontFamily: fonts.sans }}>{codeError}</Text>}
        <Button
          disabled={!code.trim()}
          onPress={async () => {
            if (await checkRecoveryCode(code)) {
              setCodeError(null);
              setVerifiedCode(code);
            } else setCodeError(t.vault.wrongRecovery);
          }}
        >
          {t.vault.continue}
        </Button>
      </View>
      <View style={[styles.section, { borderTopColor: c.border, borderTopWidth: StyleSheet.hairlineWidth, paddingTop: space.xl }]}>
        <Text style={[styles.h, { color: c.foreground }]}>{t.vault.resetOnDevice}</Text>
        <Text style={[styles.p, { color: c.mutedForeground }]}>{t.vault.resetExplain}</Text>
        {resetReadyAt === null ? (
          <Button variant="outline" onPress={() => void requestPasscodeReset()}>
            {t.vault.resetOnDevice}
          </Button>
        ) : resetReady ? (
          <PasscodeForm
            submitLabel={t.vault.resetNow}
            onSubmit={async (passcode) => {
              if (await completePasscodeReset(passcode)) {
                await disableBiometric();
                toast.show(t.vault.resetDone);
              }
            }}
          />
        ) : (
          <Text style={[styles.p, { color: c.foreground }]}>
            {t.vault.resetReady.replace("{time}", formatTime(new Date(resetReadyAt).toISOString(), locale))}
          </Text>
        )}
      </View>
      <Button variant="ghost" onPress={onBack}>
        {t.common.back}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.xl },
  title: { fontFamily: fonts.serif, fontSize: 30 },
  section: { gap: space.md },
  h: { fontFamily: fonts.sansMedium, fontSize: 16 },
  p: { fontFamily: fonts.sans, fontSize: 15, lineHeight: 21 },
});
