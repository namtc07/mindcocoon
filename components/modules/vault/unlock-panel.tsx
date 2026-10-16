"use client";

import { LockKeyhole } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useI18n } from "@/components/providers/i18n-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { unlockWithPasscode } from "@/lib/vault/session";
import { ForgotPasscode } from "./forgot-passcode";

export function UnlockPanel({ resetReadyAt }: { resetReadyAt: number | null }) {
  const { t } = useI18n();
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [forgot, setForgot] = useState(resetReadyAt !== null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    const ok = await unlockWithPasscode(passcode);
    setBusy(false);
    if (!ok) setError(t.vault.wrongPasscode);
    else setPasscode("");
  }

  if (forgot) return <ForgotPasscode resetReadyAt={resetReadyAt} onBack={() => setForgot(false)} />;

  return (
    <section className="max-w-sm space-y-6">
      <LockKeyhole className="size-7 text-muted-foreground" aria-hidden />
      <h1 className="font-serif text-3xl">{t.vault.lockedTitle}</h1>
      <form onSubmit={submit} className="space-y-3">
        <Input
          type="password"
          autoComplete="current-password"
          aria-label={t.vault.passcodeLabel}
          placeholder={t.vault.passcodeLabel}
          value={passcode}
          onChange={(e) => {
            setPasscode(e.target.value);
            setError(null);
          }}
          autoFocus
        />
        <p role="alert" className="min-h-5 text-sm text-destructive">
          {error}
        </p>
        <div className="flex items-center gap-4">
          <Button type="submit" disabled={busy || !passcode}>
            {t.vault.unlock}
          </Button>
          <button type="button" onClick={() => setForgot(true)} className="text-sm text-muted-foreground hover:text-foreground">
            {t.vault.forgot}
          </button>
        </div>
      </form>
    </section>
  );
}
