import { useState } from "react";
import { StyleSheet, Switch, Text, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { useBiometricMethod } from "@/hooks/use-biometric-method";
import { useI18n } from "@/i18n/i18n";
import { disableBiometric, enableBiometric, useBiometricEnabled } from "@/lib/biometric";
import { fonts } from "@/theme/fonts";
import { space } from "@/theme/tokens";
import { useTheme } from "@/theme/theme";

/** "Unlock with Face ID": turning it on asks for the passcode once. Only shown when biometrics are enrolled. */
export function BiometricToggle() {
  const { t } = useI18n();
  const { c } = useTheme();
  const method = useBiometricMethod();
  const enabled = useBiometricEnabled();
  const [asking, setAsking] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState(false);
  if (!method) return null;
  const label = t.vault.biometricToggle.replace("{method}", method === "face" ? t.vault.methodFace : t.vault.methodFingerprint);

  async function confirm() {
    if (await enableBiometric(passcode, label)) {
      setAsking(false);
      setPasscode("");
    } else setError(true);
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Text style={[styles.label, { color: c.foreground }]}>{label}</Text>
        <Switch
          accessibilityLabel={label}
          value={enabled || asking}
          onValueChange={(on) => {
            setError(false);
            if (on) setAsking(true);
            else {
              setAsking(false);
              void disableBiometric();
            }
          }}
          trackColor={{ true: c.primary, false: c.muted }}
        />
      </View>
      {asking && !enabled && (
        <>
          <TextField
            label={t.vault.biometricConfirm}
            showLabel
            value={passcode}
            onChangeText={(v) => {
              setPasscode(v);
              setError(false);
            }}
            secureTextEntry
            autoComplete="off"
          />
          {error && (
            <Text accessibilityRole="alert" style={{ color: c.destructive, fontFamily: fonts.sans }}>
              {t.vault.wrongPasscode}
            </Text>
          )}
          <Button disabled={!passcode} onPress={() => void confirm()}>
            {t.vault.biometricEnable}
          </Button>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.md },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 44, gap: space.md },
  label: { fontFamily: fonts.sansMedium, fontSize: 15, flex: 1 },
});
