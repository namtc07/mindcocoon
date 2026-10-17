import { useState } from "react";
import { Text, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { useI18n } from "@/i18n/i18n";
import { fonts } from "@/theme/fonts";
import { space } from "@/theme/tokens";
import { useTheme } from "@/theme/theme";

export const isValidPasscode = (v: string) => v.length >= 4 && v.length <= 12;

/** New passcode entered twice; calls onSubmit only with a valid, matching value. */
export function PasscodeForm({ submitLabel, onSubmit }: { submitLabel: string; onSubmit: (passcode: string) => Promise<void> | void }) {
  const { t } = useI18n();
  const { c } = useTheme();
  const [first, setFirst] = useState("");
  const [second, setSecond] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!isValidPasscode(first)) return setError(t.vault.passcodeTooShort);
    if (first !== second) return setError(t.vault.passcodeMismatch);
    setError(null);
    setBusy(true);
    try {
      await onSubmit(first);
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ gap: space.md }}>
      <TextField label={t.vault.newPasscode} showLabel value={first} onChangeText={setFirst} secureTextEntry maxLength={12} autoComplete="off" />
      <TextField label={t.vault.confirmPasscode} showLabel value={second} onChangeText={setSecond} secureTextEntry maxLength={12} autoComplete="off" />
      <Text style={{ fontFamily: fonts.sans, fontSize: 13, color: c.mutedForeground }}>{t.vault.passcodeHint}</Text>
      {error && (
        <Text accessibilityRole="alert" style={{ fontFamily: fonts.sans, color: c.destructive }}>
          {error}
        </Text>
      )}
      <Button onPress={() => void submit()} disabled={busy}>
        {submitLabel}
      </Button>
    </View>
  );
}
