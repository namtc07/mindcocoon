"use client";

import { useState, useSyncExternalStore, type FormEvent } from "react";
import { SignInDialog } from "@/components/modules/account/sign-in-dialog";
import { toast } from "sonner";
import { useI18n } from "@/components/providers/i18n-provider";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { useNow } from "@/hooks/use-now";
import { getAgeAnswer, subscribeAge } from "@/lib/auth/age";
import { fetchServerSecret } from "@/lib/backup/active";
import { formatTime } from "@/lib/dates";
import {
  completePasscodeReset,
  replacePasscode,
  requestPasscodeReset,
  unlockWithRecoveryCode,
  unlockWithServerSecret,
} from "@/lib/vault/session";
import { PasscodeForm } from "./passcode-form";

/**
 * Ways back in: recovery code (instant), the account's server half (instant, only
 * on a device that was signed in while unlocked), or a reset here after one hour.
 */
export function ForgotPasscode({ resetReadyAt, onBack }: { resetReadyAt: number | null; onBack: () => void }) {
  const { t, locale } = useI18n();
  const now = useNow();
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);
  const [chooseNew, setChooseNew] = useState(false);
  const auth = useAuth();
  const age = useSyncExternalStore(subscribeAge, getAgeAnswer, () => null);
  const [signInOpen, setSignInOpen] = useState(false);
  const [accountError, setAccountError] = useState<string | null>(null);
  const accountAvailable = (auth.status === "signed-in" || auth.status === "signed-out") && age !== "no";

  async function resetWithAccount() {
    if (auth.status !== "signed-in" || !auth.user) return setSignInOpen(true);
    setAccountError(null);
    const secret = await fetchServerSecret(auth.user.id).catch(() => null);
    if (secret && (await unlockWithServerSecret(secret))) setChooseNew(true);
    else setAccountError(t.backup.resetUnavailable);
  }

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

      {accountAvailable && (
        <div className="space-y-3 border-t border-border pt-8">
          <h3 className="font-medium">{t.backup.resetWithAccount}</h3>
          <p className="text-sm text-muted-foreground">{t.backup.resetWithAccountHint}</p>
          <Button variant="outline" onClick={() => void resetWithAccount()}>
            {auth.status === "signed-in" ? t.backup.resetWithAccount : t.account.signInToBackup}
          </Button>
          <p role="alert" className="min-h-5 text-sm text-destructive">
            {accountError}
          </p>
          <SignInDialog open={signInOpen} onOpenChange={setSignInOpen} />
        </div>
      )}

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
