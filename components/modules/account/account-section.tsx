"use client";

import { useState, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { useI18n } from "@/components/providers/i18n-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { getAgeAnswer, subscribeAge } from "@/lib/auth/age";
import { deleteAccount, signOut } from "@/lib/auth/store";
import { SignInDialog } from "./sign-in-dialog";

export function AccountSection() {
  const { t } = useI18n();
  const auth = useAuth();
  const age = useSyncExternalStore(subscribeAge, getAgeAnswer, () => null);
  const [signInOpen, setSignInOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  if (auth.status === "disabled" || auth.status === "loading") return null;

  if (auth.status === "signed-out") {
    if (age === "no") return <p className="max-w-prose text-sm text-muted-foreground">{t.account.ageNoExplain}</p>;
    return (
      <div className="space-y-3">
        <p className="max-w-prose text-sm text-muted-foreground">{t.account.backupPitch}</p>
        <Button onClick={() => setSignInOpen(true)}>{t.account.signInToBackup}</Button>
        <SignInDialog open={signInOpen} onOpenChange={setSignInOpen} />
      </div>
    );
  }

  const confirmed = confirmText.trim().normalize("NFC").toLowerCase() === t.account.deleteConfirmWord;

  return (
    <div className="space-y-4">
      <p className="text-sm text-foreground">{t.account.signedInAs.replace("{email}", auth.user?.email ?? "")}</p>
      <div className="flex flex-wrap gap-3">
        <Button variant="outline" onClick={() => void signOut()}>
          {t.account.signOut}
        </Button>
        {!deleting && (
          <Button variant="ghost" onClick={() => setDeleting(true)}>
            {t.account.deleteAccount}
          </Button>
        )}
      </div>
      {deleting && (
        <div className="max-w-sm space-y-3">
          <p className="text-sm text-muted-foreground">{t.account.deleteHint}</p>
          <Input
            aria-label={t.account.deleteConfirmLabel}
            placeholder={t.account.deleteConfirmLabel}
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
          />
          <div className="flex gap-3">
            <Button
              variant="destructive"
              disabled={!confirmed}
              onClick={async () => {
                try {
                  await deleteAccount();
                  toast.success(t.account.deleted);
                } catch {
                  toast.error(t.account.error);
                }
              }}
            >
              {t.account.deleteNow}
            </Button>
            <Button variant="ghost" onClick={() => setDeleting(false)}>
              {t.common.cancel}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
