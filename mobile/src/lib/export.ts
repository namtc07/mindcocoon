import { dayKey } from "@mindcocoon/core/dates";
import { clearMoods } from "@mindcocoon/core/mood/store";
import { getStorage } from "@mindcocoon/core/storage/index";
import type { JournalEntry, MoodLog } from "@mindcocoon/core/types";
import { wipeVault } from "@mindcocoon/core/vault/session";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { clearPrefs } from "./prefs";

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

/** Writes the export to the cache folder and opens the share sheet (Files, AirDrop, Drive…). */
export async function shareExport() {
  const file = new File(Paths.cache, `mindcocoon-export-${dayKey(new Date())}.json`);
  if (file.exists) file.delete();
  await file.write(JSON.stringify(await buildExport(), null, 2));
  await Sharing.shareAsync(file.uri, { mimeType: "application/json", UTI: "public.json", dialogTitle: "MindCocoon" });
}

/** Removes every journal entry, check-in, key (incl. the Keychain/Keystore item) and preference. */
export async function eraseEverything() {
  await wipeVault();
  await clearMoods();
  await clearPrefs();
}
