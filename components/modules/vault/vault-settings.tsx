"use client";

import { useState } from "react";
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
import type { VaultState } from "@mindcocoon/core/vault/session";
import {
  regenerateRecoveryCode,
  removeVaultPasscode,
  setVaultAutoLock,
  setVaultPasscode,
} from "@mindcocoon/core/vault/session";
import { PasscodeForm } from "./passcode-form";

const AUTO_LOCK_OPTIONS = [1, 5, 15, 30];

interface VaultSettingsProps {
  open: boolean;
  vault: VaultState;
  onOpenChange: (open: boolean) => void;
  onRecoveryCode: (code: string) => void;
  onPasscodeSet?: () => void;
}

export function VaultSettings({ open, vault, onOpenChange, onRecoveryCode, onPasscodeSet }: VaultSettingsProps) {
  const { t } = useI18n();
  const [editing, setEditing] = useState(false);

  async function savePasscode(passcode: string) {
    const { recoveryCode } = await setVaultPasscode(passcode);
    toast.success(t.vault.passcodeSet);
    setEditing(false);
    onOpenChange(false);
    if (recoveryCode) onRecoveryCode(recoveryCode);
    onPasscodeSet?.();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setEditing(false);
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl font-normal">{t.vault.settings}</DialogTitle>
          <DialogDescription>{vault.hasPasscode ? t.vault.passcodeOn : t.vault.passcodeOff}</DialogDescription>
        </DialogHeader>

        {editing ? (
          <PasscodeForm submitLabel={t.vault.savePasscode} onSubmit={savePasscode} />
        ) : (
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => setEditing(true)}>
              {vault.hasPasscode ? t.vault.changePasscode : t.vault.setPasscode}
            </Button>
            {vault.hasPasscode && (
              <Button
                variant="ghost"
                onClick={async () => {
                  await removeVaultPasscode();
                  toast.success(t.vault.passcodeRemoved);
                }}
              >
                {t.vault.removePasscode}
              </Button>
            )}
          </div>
        )}

        {vault.hasPasscode && !editing && (
          <div className="space-y-5 border-t border-border pt-5">
            <fieldset className="space-y-2">
              <legend className="text-sm text-muted-foreground">{t.vault.autoLock}</legend>
              <div className="flex flex-wrap gap-2">
                {AUTO_LOCK_OPTIONS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    aria-pressed={vault.autoLockMinutes === n}
                    onClick={() => void setVaultAutoLock(n)}
                    className="rounded-full border border-border px-3 py-1 text-sm text-muted-foreground aria-pressed:border-primary/60 aria-pressed:bg-primary/15 aria-pressed:text-foreground"
                  >
                    {t.vault.minutes.replace("{n}", String(n))}
                  </button>
                ))}
              </div>
            </fieldset>
            <Button
              variant="ghost"
              className="px-0"
              onClick={async () => {
                const code = await regenerateRecoveryCode();
                onOpenChange(false);
                onRecoveryCode(code);
              }}
            >
              {t.vault.regenerateCode}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
