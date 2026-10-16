import { decryptString, encryptString } from "@/lib/crypto";
import { getStorage } from "@/lib/storage";
import type { JournalEntry, MoodLog, UnlockedDek } from "@/types";

/** Everything worth backing up. Journal entries and notes are already encrypted inside. */
export interface Snapshot {
  version: 1;
  createdAt: string;
  journal: JournalEntry[];
  moods: MoodLog[];
}

export async function buildSnapshot(): Promise<Snapshot> {
  const storage = getStorage();
  return {
    version: 1,
    createdAt: new Date().toISOString(),
    journal: await storage.journal.list(),
    moods: await storage.moods.list(),
  };
}

/** Encrypts the whole snapshot (moods and tags included) with the data key. */
export function sealSnapshot(snapshot: Snapshot, dek: UnlockedDek): Promise<string> {
  return encryptString(dek.key, JSON.stringify(snapshot));
}

export async function openSnapshot(ciphertext: string, dek: UnlockedDek): Promise<Snapshot> {
  return JSON.parse(await decryptString(dek.key, ciphertext)) as Snapshot;
}

export function isEmptySnapshot(s: Snapshot) {
  return s.journal.length === 0 && s.moods.length === 0;
}

/** True when every entry and log in `remote` also exists in `local` (local is the same or newer). */
export function containsAll(local: Snapshot, remote: Snapshot) {
  const journal = new Set(local.journal.map((e) => e.id));
  const moods = new Set(local.moods.map((m) => m.id));
  return remote.journal.every((e) => journal.has(e.id)) && remote.moods.every((m) => moods.has(m.id));
}
