import { createDefaultDriver } from "./driver";
import { createLocalAdapter } from "./local";
import type { StorageAdapter } from "./repositories";

export type * from "./repositories";

let adapter: StorageAdapter | null = null;

/**
 * Single entry point for persistence. Today this is local-first (IndexedDB).
 * To add cloud sync, return a Supabase-backed adapter here for signed-in users.
 */
export function getStorage(): StorageAdapter {
  adapter ??= createLocalAdapter(createDefaultDriver());
  return adapter;
}

/** Test / future-sync hook: swap the active adapter. */
export function setStorage(next: StorageAdapter) {
  adapter = next;
}

export function newId(): string {
  return crypto.randomUUID();
}
