"use client";

import { useEffect, useState } from "react";
import { RecoveryCodeCard } from "@/components/modules/vault/recovery-code-card";
import { useAuth } from "@/hooks/use-auth";
import { activateBackup, deactivateBackup } from "@/lib/backup/active";
import type { BackupEngine } from "@/lib/backup/engine";
import { ConflictDialog } from "./conflict-dialog";
import { RestoreDialog } from "./restore-dialog";

/** Runs backup for the signed-in user and asks before replacing anything. */
export function BackupController() {
  const auth = useAuth();
  const userId = auth.status === "signed-in" ? (auth.user?.id ?? null) : null;
  const [engine, setEngine] = useState<BackupEngine | null>(null);
  const [dialog, setDialog] = useState<"restore" | "conflict" | null>(null);
  const [recoveryCode, setRecoveryCode] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      deactivateBackup();
      return;
    }
    const next = activateBackup(userId);
    if (!next) return;
    let alive = true;
    const offCode = next.onRecoveryCode((code) => alive && setRecoveryCode(code));
    next
      .onSignedIn()
      .then((outcome) => {
        if (!alive) return;
        setEngine(next);
        if (outcome === "restore-available") setDialog("restore");
        if (outcome === "conflict") setDialog("conflict");
      })
      .catch((error) => console.warn("Backup check failed", error));
    return () => {
      alive = false;
      offCode();
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
          void engine?.pushNow();
        }}
        onUseBackup={() => setDialog("restore")}
      />
      <RecoveryCodeCard code={recoveryCode} onClose={() => setRecoveryCode(null)} />
    </>
  );
}
