import { dayKey } from "@mindcocoon/core/dates";
import { clearMoods } from "@mindcocoon/core/mood/store";
import { getStorage } from "@mindcocoon/core/storage/index";
import type { JournalEntry, MoodLog } from "@mindcocoon/core/types";
import { wipeVault } from "@mindcocoon/core/vault/session";
import { File, Paths } from "expo-file-system";
import { useSyncExternalStore } from "react";
import * as Sharing from "expo-sharing";
import { audio } from "./audio";
import { clearPrefs } from "./prefs";
import { cancelReminder } from "./reminder";
import { disableBiometric } from "./biometric";

export interface ExportFile {
  app: "MindCocoon";
  version: 1;
  exportedAt: string;
  /** Journal entries stay as encrypted envelopes. */
  journal: JournalEntry[];
  /** Notes stay encrypted; mood and tags are readable. */
  moods: MoodLog[];
}

export async function buildExport(): Promise<ExportFile> {
  const storage = getStorage();
  return {
    app: "MindCocoon",
    version: 1,
    exportedAt: new Date().toISOString(),
    journal: await storage.journal.list(),
    moods: await storage.moods.list(),
  };
}

const EXPORT_PREFIX = "mindcocoon-export-";

/** Writes the export to the cache folder, opens the share sheet, then deletes the copy. */
export async function shareExport() {
  const file = new File(Paths.cache, `${EXPORT_PREFIX}${dayKey(new Date())}.json`);
  if (file.exists) file.delete();
  await file.write(JSON.stringify(await buildExport(), null, 2));
  try {
    await Sharing.shareAsync(file.uri, { mimeType: "application/json", UTI: "public.json", dialogTitle: "MindCocoon" });
  } finally {
    // Moods and tags are readable in it: don't leave it lying in the cache.
    if (file.exists) file.delete();
  }
}

function deleteLeftoverExports() {
  try {
    for (const item of Paths.cache.list()) if (item instanceof File && item.name.startsWith(EXPORT_PREFIX)) item.delete();
  } catch {
    // Nothing to clean up.
  }
}

let eraseCount = 0;
const eraseListeners = new Set<() => void>();

export const getEraseCount = () => eraseCount;

/** Changes after every erase; the root layout keys the whole app on it so every screen starts fresh. */
export function useEraseCount() {
  return useSyncExternalStore(
    (l) => {
      eraseListeners.add(l);
      return () => {
        eraseListeners.delete(l);
      };
    },
    getEraseCount,
    getEraseCount,
  );
}

/** Removes every journal entry, check-in, key (incl. the Keychain/Keystore item), preference and export copy. */
export async function eraseEverything() {
  audio.reset();
  await cancelReminder().catch(() => {});
  await disableBiometric();
  await wipeVault();
  await clearMoods();
  await clearPrefs();
  deleteLeftoverExports();
  eraseCount++;
  eraseListeners.forEach((l) => l());
}
