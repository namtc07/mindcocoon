"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { RecoveryCodeCard } from "@/components/modules/vault/recovery-code-card";
import { useAuth } from "@/hooks/use-auth";
import { activateBackup, deactivateBackup } from "@/lib/backup/active";
import { isBackupEnabled, subscribeBackupPref } from "@/lib/backup/prefs";
import { getVaultState, subscribeVault } from "@/lib/vault/session";
import type { BackupEngine } from "@/lib/backup/engine";
import { ConflictDialog } from "./conflict-dialog";
import { RestoreDialog } from "./restore-dialog";

/** Runs backup for the signed-in user and asks before replacing anything. */
export function BackupController() {
  const auth = useAuth();
  const enabled = useSyncExternalStore(subscribeBackupPref, isBackupEnabled, () => false);
  const userId = enabled && auth.status === "signed-in" ? (auth.user?.id ?? null) : null;
  const [engine, setEngine] = useState<BackupEngine | null>(null);
  const [dialog, setDialog] = useState<"restore" | "conflict" | null>(null);
  const [recoveryCode, setRecoveryCode] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      deactivateBackup();
      return;
    }
    const activated = activateBackup(userId);
    if (!activated) return;
    const next = activated;
    let alive = true;
    let offVault: (() => void) | null = null;
    const offCode = next.onRecoveryCode((code) => alive && setRecoveryCode(code));

    function check() {
      next
        .onSignedIn()
        .then((outcome) => {
          if (!alive) return;
          setEngine(next);
          if (outcome === "restore-available") setDialog("restore");
          if (outcome === "conflict") setDialog("conflict");
          if (outcome === "deferred" && !offVault) {
            // Locked passcode vault: decide once the person unlocks it.
            offVault = subscribeVault(() => {
              if (getVaultState().status !== "unlocked") return;
              offVault?.();
              offVault = null;
              check();
            });
          }
        })
        .catch((error) => console.warn("Backup check failed", error));
    }
    check();
    return () => {
      alive = false;
      offCode();
      offVault?.();
    };
  }, [userId]);

  return (
    <>
      <RestoreDialog engine={engine} open={dialog === "restore"} onOpenChange={(open) => !open && setDialog(null)} />
      <ConflictDialog
        open={dialog === "conflict"}
        onOpenChange={(open) => !open && setDialog(null)}
        onKeepLocal={() => {
          setDialog(null);
          void engine?.keepLocal();
        }}
        onUseBackup={() => setDialog("restore")}
      />
      <RecoveryCodeCard code={recoveryCode} onClose={() => setRecoveryCode(null)} />
    </>
  );
}
