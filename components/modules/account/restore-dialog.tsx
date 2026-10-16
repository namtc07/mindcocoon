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
import { Textarea } from "@/components/ui/textarea";
import type { BackupEngine } from "@/lib/backup/engine";

export function RestoreDialog({ engine, open, onOpenChange }: { engine: BackupEngine | null; open: boolean; onOpenChange: (open: boolean) => void }) {
  const { t } = useI18n();
  const [mode, setMode] = useState<"recovery" | "passcode">("recovery");
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!engine) return;
    setBusy(true);
    setError(null);
    const ok = await engine
      .restore(mode === "recovery" ? { recoveryCode: value } : { passcode: value })
      .catch(() => false);
    setBusy(false);
    if (!ok) return setError(t.backup.wrongSecret);
    toast.success(t.backup.restored);
    setValue("");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl font-normal">{t.backup.restoreTitle}</DialogTitle>
            <DialogDescription>{mode === "recovery" ? t.backup.restoreBody : t.backup.restoreBodyPasscode}</DialogDescription>
          </DialogHeader>
          {mode === "recovery" ? (
            <Textarea
              aria-label={t.vault.recoveryInputLabel}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              rows={3}
              className="font-mono"
              autoComplete="off"
              spellCheck={false}
            />
          ) : (
            <Input type="password" aria-label={t.vault.passcodeLabel} value={value} onChange={(e) => setValue(e.target.value)} />
          )}
          <button
            type="button"
            className="text-sm text-muted-foreground hover:text-foreground"
            onClick={() => {
              setMode(mode === "recovery" ? "passcode" : "recovery");
              setValue("");
            }}
          >
            {mode === "recovery" ? t.backup.usePasscode : t.backup.useRecovery}
          </button>
          <p role="alert" className="min-h-5 text-sm text-destructive">
            {error}
          </p>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              {t.backup.later}
            </Button>
            <Button type="submit" disabled={busy || !value.trim()}>
              {t.backup.restore}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
