"use client";

import { useState, type FormEvent } from "react";
import { useI18n } from "@/components/providers/i18n-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function isValidPasscode(value: string) {
  return value.length >= 4 && value.length <= 12;
}

/** New passcode entered twice. Calls onSubmit only with a valid, matching value. */
export function PasscodeForm({
  submitLabel,
  onSubmit,
}: {
  submitLabel: string;
  onSubmit: (passcode: string) => Promise<void> | void;
}) {
  const { t } = useI18n();
  const [first, setFirst] = useState("");
  const [second, setSecond] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
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
    <form onSubmit={submit} className="space-y-4">
      <label className="block space-y-2 text-sm">
        <span className="text-muted-foreground">{t.vault.newPasscode}</span>
        <Input
          type="password"
          autoComplete="new-password"
          maxLength={12}
          aria-label={t.vault.newPasscode}
          value={first}
          onChange={(e) => setFirst(e.target.value)}
        />
      </label>
      <label className="block space-y-2 text-sm">
        <span className="text-muted-foreground">{t.vault.confirmPasscode}</span>
        <Input
          type="password"
          autoComplete="new-password"
          maxLength={12}
          aria-label={t.vault.confirmPasscode}
          value={second}
          onChange={(e) => setSecond(e.target.value)}
        />
      </label>
      <p className="text-xs text-muted-foreground">{t.vault.passcodeHint}</p>
      <p role="alert" className="min-h-5 text-sm text-destructive">
        {error}
      </p>
      <Button type="submit" disabled={busy}>
        {submitLabel}
      </Button>
    </form>
  );
}
