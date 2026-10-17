"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { useI18n } from "@/components/providers/i18n-provider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useVault } from "@/hooks/use-vault";
import { saveVaultEntry, unlockWithPasscode } from "@mindcocoon/core/vault/session";

interface SaveDialogProps {
  open: boolean;
  body: string;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export function SaveDialog({ open, body, onOpenChange, onSaved }: SaveDialogProps) {
  const { t } = useI18n();
  const vault = useVault();
  const [title, setTitle] = useState("");
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const locked = vault.status === "locked";

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (locked && !(await unlockWithPasscode(passcode))) {
        setError(t.vent.wrongPasscode);
        return;
      }
      await saveVaultEntry({ title, body });
      toast.success(t.vent.saved);
      setTitle("");
      setPasscode("");
      onSaved();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={submit} className="space-y-5">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl font-normal">{t.vent.saveTitle}</DialogTitle>
            <DialogDescription>{t.vent.saveDescription}</DialogDescription>
          </DialogHeader>

          <label className="block space-y-2 text-sm">
            <span className="text-muted-foreground">{t.vent.titleLabel}</span>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} autoFocus={!locked} />
          </label>

          {locked && (
            <label className="block space-y-2 text-sm">
              <span className="text-muted-foreground">{t.vent.lockedHint}</span>
              <Input
                type="password"
                inputMode="numeric"
                autoComplete="off"
                aria-label={t.vent.passcodeLabel}
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                autoFocus
              />
            </label>
          )}

          <p role="alert" className="min-h-5 text-sm text-destructive">
            {error}
          </p>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              {t.common.cancel}
            </Button>
            <Button type="submit" disabled={busy || (locked && !passcode)}>
              {t.common.save}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
