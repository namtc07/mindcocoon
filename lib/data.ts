import { dayKey } from "@/lib/dates";
import { clearMoods } from "@/lib/mood/store";
import { getStorage } from "@/lib/storage";
import { wipeVault } from "@/lib/vault/session";
import type { JournalEntry, MoodLog } from "@/types";

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

export async function downloadExport() {
  const file = await buildExport();
  const blob = new Blob([JSON.stringify(file, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `mindcocoon-export-${dayKey(new Date())}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Removes every journal entry, check-in, key and app preference on this device. */
export async function eraseEverything() {
  await wipeVault();
  await clearMoods();
  try {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith("mc:") || key.startsWith("mindcocoon:")) localStorage.removeItem(key);
    }
  } catch {
    // Storage blocked: nothing persisted there anyway.
  }
}
