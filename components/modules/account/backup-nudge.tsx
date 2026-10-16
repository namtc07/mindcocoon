"use client";

import { CloudUpload, X } from "lucide-react";
import { useState, useSyncExternalStore } from "react";
import { useI18n } from "@/components/providers/i18n-provider";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { getAgeAnswer, subscribeAge } from "@/lib/auth/age";
import { SignInDialog } from "./sign-in-dialog";

/** Gentle invitation to back up. Never shown to under-16s, signed-in users, or without Supabase. */
export function BackupNudge({ onDismiss }: { onDismiss: () => void }) {
  const { t } = useI18n();
  const auth = useAuth();
  const age = useSyncExternalStore(subscribeAge, getAgeAnswer, () => null);
  const [signInOpen, setSignInOpen] = useState(false);
  if (auth.status !== "signed-out" || age === "no") return null;

  return (
    <div className="flex items-start gap-3 rounded-xl bg-surface p-4">
      <CloudUpload className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
      <div className="flex-1 space-y-2 text-sm">
        <p className="font-medium text-foreground">{t.backup.nudgeTitle}</p>
        <p className="text-muted-foreground">{t.backup.nudgeBody}</p>
        <Button size="sm" onClick={() => setSignInOpen(true)}>
          {t.account.signInToBackup}
        </Button>
      </div>
      <button type="button" aria-label={t.safety.dismiss} onClick={onDismiss} className="text-muted-foreground hover:text-foreground">
        <X className="size-4" aria-hidden />
      </button>
      <SignInDialog open={signInOpen} onOpenChange={setSignInOpen} />
    </div>
  );
}
