"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { useI18n } from "@/components/providers/i18n-provider";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useNow } from "@/hooks/use-now";
import { formatTime } from "@/lib/dates";
import {
  completePasscodeReset,
  replacePasscode,
  requestPasscodeReset,
  unlockWithRecoveryCode,
} from "@/lib/vault/session";
import { PasscodeForm } from "./passcode-form";

/**
 * Ways back in, fastest first: recovery code (instant), then a reset on this
 * device that waits an hour. Signing in to reset arrives with accounts (Task 17).
 */
export function ForgotPasscode({ resetReadyAt, onBack }: { resetReadyAt: number | null; onBack: () => void }) {
  const { t, locale } = useI18n();
  const now = useNow();
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);
  const [chooseNew, setChooseNew] = useState(false);
  const resetReady = resetReadyAt !== null && now !== null && now.getTime() >= resetReadyAt;

  async function submitCode(event: FormEvent) {
    event.preventDefault();
    if (await unlockWithRecoveryCode(code)) {
      setCodeError(null);
      setChooseNew(true);
    } else {
      setCodeError(t.vault.wrongRecovery);
    }
  }

  if (chooseNew) {
    return (
      <section className="space-y-4">
        <h2 className="font-serif text-2xl">{t.vault.chooseNew}</h2>
        <PasscodeForm
          submitLabel={t.vault.savePasscode}
          onSubmit={async (passcode) => {
            await replacePasscode(passcode);
            toast.success(t.vault.resetDone);
          }}
        />
      </section>
    );
  }

  return (
    <section className="space-y-10">
      <h2 className="font-serif text-3xl">{t.vault.forgotTitle}</h2>

      <form onSubmit={submitCode} className="space-y-3">
        <label className="block space-y-2 text-sm">
          <span className="font-medium text-foreground">{t.vault.useRecovery}</span>
          <Textarea
            aria-label={t.vault.recoveryInputLabel}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            rows={3}
            autoComplete="off"
            spellCheck={false}
            className="font-mono"
          />
        </label>
        <p role="alert" className="min-h-5 text-sm text-destructive">
          {codeError}
        </p>
        <Button type="submit" disabled={!code.trim()}>
          {t.vault.continue}
        </Button>
      </form>

      <div className="space-y-3 border-t border-border pt-8">
        <h3 className="font-medium">{t.vault.resetOnDevice}</h3>
        <p className="text-sm text-muted-foreground">{t.vault.resetExplain}</p>
        {resetReadyAt === null ? (
          <Button variant="outline" onClick={() => void requestPasscodeReset()}>
            {t.vault.resetOnDevice}
          </Button>
        ) : resetReady ? (
          <PasscodeForm
            submitLabel={t.vault.resetNow}
            onSubmit={async (passcode) => {
              if (await completePasscodeReset(passcode)) toast.success(t.vault.resetDone);
            }}
          />
        ) : (
          <p className="text-sm text-foreground">
            {t.vault.resetReady.replace("{time}", formatTime(new Date(resetReadyAt).toISOString(), locale))}
          </p>
        )}
      </div>

      <button type="button" onClick={onBack} className="text-sm text-muted-foreground hover:text-foreground">
        {t.common.back}
      </button>
    </section>
  );
}
