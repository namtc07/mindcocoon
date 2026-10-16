"use client";

import { useSyncExternalStore } from "react";
import { getActiveBackup, subscribeActiveBackup } from "@/lib/backup/active";
import type { BackupStatus } from "@/lib/backup/engine";

const noopSubscribe = () => () => {};

/** The signed-in user's backup engine and its status (null/idle when not signed in). */
export function useBackup(): { status: BackupStatus; active: boolean } {
  const engine = useSyncExternalStore(subscribeActiveBackup, getActiveBackup, () => null);
  const status = useSyncExternalStore(
    engine ? engine.subscribe : noopSubscribe,
    () => engine?.status() ?? "idle",
    () => "idle" as const,
  );
  return { status, active: engine !== null };
}
