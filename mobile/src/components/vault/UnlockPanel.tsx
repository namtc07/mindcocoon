import { unlockWithPasscode } from "@mindcocoon/core/vault/session";
import { LockKeyhole } from "lucide-react-native";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { useBiometricMethod } from "@/hooks/use-biometric-method";
import { useI18n } from "@/i18n/i18n";
import { unlockWithBiometric, useBiometricEnabled } from "@/lib/biometric";
import { fonts } from "@/theme/fonts";
import { space } from "@/theme/tokens";
import { useTheme } from "@/theme/theme";
import { ForgotPasscode } from "./ForgotPasscode";

export function UnlockPanel({ resetReadyAt }: { resetReadyAt: number | null }) {
  const { t } = useI18n();
  const { c } = useTheme();
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [forgot, setForgot] = useState(resetReadyAt !== null);
  const method = useBiometricMethod();
  const biometric = useBiometricEnabled() && method !== null;
  const methodName = method === "face" ? t.vault.methodFace : method === "biometric" ? t.vault.methodBiometric : t.vault.methodFingerprint;

  if (forgot) return <ForgotPasscode resetReadyAt={resetReadyAt} onBack={() => setForgot(false)} />;

  return (
    <View style={styles.wrap}>
      <LockKeyhole size={28} color={c.mutedForeground} />
      <Text accessibilityRole="header" style={[styles.title, { color: c.foreground }]}>
        {t.vault.lockedTitle}
      </Text>
      <TextField
        label={t.vault.passcodeLabel}
        placeholder={t.vault.passcodeLabel}
        value={passcode}
        onChangeText={(v) => {
          setPasscode(v);
          setError(null);
        }}
        secureTextEntry
        autoComplete="off"
        autoFocus
      />
      {error && (
        <Text accessibilityRole="alert" style={{ color: c.destructive, fontFamily: fonts.sans }}>
          {error}
        </Text>
      )}
      <View style={styles.row}>
        <Button
          disabled={!passcode}
          onPress={async () => {
            if (await unlockWithPasscode(passcode)) setPasscode("");
            else setError(t.vault.wrongPasscode);
          }}
        >
          {t.vault.unlock}
        </Button>
        {biometric && (
          <Button
            variant="outline"
            onPress={async () => {
              const label = t.vault.biometricToggle.replace("{method}", methodName);
              if ((await unlockWithBiometric(label)) === "failed") setError(t.vault.biometricFailed.replace("{method}", methodName));
            }}
          >
            {t.vault.biometricToggle.replace("{method}", methodName)}
          </Button>
        )}
        <Button variant="ghost" onPress={() => setForgot(true)}>
          {t.vault.forgot}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.lg, paddingTop: space.xl },
  title: { fontFamily: fonts.serif, fontSize: 30 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: space.md },
});
