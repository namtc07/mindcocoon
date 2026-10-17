"use client";

import { useState, useSyncExternalStore, type FormEvent } from "react";
import { toast } from "sonner";
import { useI18n } from "@/components/providers/i18n-provider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { getAgeAnswer, setAgeAnswer, subscribeAge } from "@/lib/auth/age";
import { signInWithEmail, signInWithGoogle, verifyEmailOtp } from "@/lib/auth/store";

/** Age question first, then email code (or Google). Under-16s never see a sign-in form. */
export function SignInDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { t, locale } = useI18n();
  const age = useSyncExternalStore(subscribeAge, getAgeAnswer, () => null);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function run(action: () => Promise<void>, failure: string) {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch {
      setError(failure);
    } finally {
      setBusy(false);
    }
  }

  function sendCode(event: FormEvent) {
    event.preventDefault();
    void run(async () => {
      await signInWithEmail(email.trim(), locale);
      setStep("code");
    }, t.account.error);
  }

  function verify(event: FormEvent) {
    event.preventDefault();
    void run(async () => {
      await verifyEmailOtp(email.trim(), code.trim());
      toast.success(t.account.signedIn);
      onOpenChange(false);
    }, t.account.wrongCode);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl font-normal">{t.account.signInToBackup}</DialogTitle>
          <DialogDescription>{age === "yes" ? t.account.backupPitch : t.account.ageQuestion}</DialogDescription>
        </DialogHeader>

        {age !== "yes" ? (
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => setAgeAnswer("yes")}>{t.account.ageYes}</Button>
            <Button
              variant="ghost"
              onClick={() => {
                setAgeAnswer("no");
                onOpenChange(false);
              }}
            >
              {t.account.ageNo}
            </Button>
          </div>
        ) : step === "email" ? (
          <div className="space-y-5">
            <form onSubmit={sendCode} className="space-y-3">
              <Input
                type="email"
                inputMode="email"
                autoComplete="email"
                aria-label={t.account.emailLabel}
                placeholder={t.account.emailLabel}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
              />
              <Button type="submit" disabled={busy || !email.includes("@")}>
                {t.account.sendCode}
              </Button>
            </form>
            <Button variant="outline" onClick={() => void run(() => signInWithGoogle(locale), t.account.error)} disabled={busy}>
              {t.account.google}
            </Button>
          </div>
        ) : (
          <form onSubmit={verify} className="space-y-3">
            <p className="text-sm text-muted-foreground">{t.account.codeSent.replace("{email}", email)}</p>
            <Input
              inputMode="numeric"
              autoComplete="one-time-code"
              aria-label={t.account.codeLabel}
              placeholder="123456"
              maxLength={10}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              autoFocus
            />
            <Button type="submit" disabled={busy || code.length < 6}>
              {t.account.verify}
            </Button>
          </form>
        )}

        <p role="alert" className="min-h-5 text-sm text-destructive">
          {error}
        </p>
      </DialogContent>
    </Dialog>
  );
}
