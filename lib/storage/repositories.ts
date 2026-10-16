import type { JournalEntry, Keyring, MoodLog } from "@/types";

/**
 * Repository contracts. The local implementation lives in ./local.ts.
 * A Supabase implementation only needs to satisfy these same interfaces
 * (see CLAUDE.md and supabase/migrations/0001_init.sql).
 */

export interface MoodRepository {
  list(): Promise<MoodLog[]>;
  add(log: MoodLog): Promise<void>;
  remove(id: string): Promise<void>;
  clear(): Promise<void>;
}

export interface JournalRepository {
  list(): Promise<JournalEntry[]>;
  get(id: string): Promise<JournalEntry | undefined>;
  put(entry: JournalEntry): Promise<void>;
  /** Replaces every entry at once — used when re-keying the vault. */
  replaceAll(entries: JournalEntry[]): Promise<void>;
  remove(id: string): Promise<void>;
  clear(): Promise<void>;
}

/** Device-only vault material. Never synced: keys stay on the device. */
export interface VaultKeyRepository {
  getKeyring(): Promise<Keyring | undefined>;
  setKeyring(keyring: Keyring): Promise<void>;
  getDeviceKey(): Promise<CryptoKey | undefined>;
  setDeviceKey(key: CryptoKey): Promise<void>;
  clear(): Promise<void>;
}

export interface StorageAdapter {
  moods: MoodRepository;
  journal: JournalRepository;
  vaultKeys: VaultKeyRepository;
}
