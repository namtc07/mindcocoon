import { getSupabase } from "@/lib/supabase/client";
import { createBackupEngine, type BackupEngine } from "./engine";
import { createSupabaseRemote } from "./supabase-remote";

/** The backup engine for the signed-in user (null when signed out or not configured). */

let active: { userId: string; engine: BackupEngine; stop: () => void } | null = null;
const listeners = new Set<() => void>();

export function subscribeActiveBackup(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getActiveBackup(): BackupEngine | null {
  return active?.engine ?? null;
}

/** Starts (or keeps) the engine for this user; returns it, or null without Supabase. */
export function activateBackup(userId: string): BackupEngine | null {
  if (active?.userId === userId) return active.engine;
  deactivateBackup();
  const supabase = getSupabase();
  if (!supabase) return null;
  const engine = createBackupEngine(createSupabaseRemote(supabase, userId));
  active = { userId, engine, stop: engine.start() };
  listeners.forEach((l) => l());
  return engine;
}

export function deactivateBackup() {
  if (!active) return;
  active.stop();
  active = null;
  listeners.forEach((l) => l());
}

/** Fetches the server half for a passcode reset on this device. */
export async function fetchServerSecret(userId: string): Promise<string | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  return createSupabaseRemote(supabase, userId).getServerSecret();
}
