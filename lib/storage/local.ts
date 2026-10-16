import type { JournalEntry, Keyring, MoodLog } from "@/types";
import type { KVDriver } from "./driver";
import type { StorageAdapter } from "./repositories";

const KEYS = {
  moods: "moods:v1",
  journal: "journal:v1",
  keyring: "vault:keyring",
  deviceKey: "vault:device-key",
} as const;

const byNewest = (a: { createdAt: string }, b: { createdAt: string }) =>
  b.createdAt.localeCompare(a.createdAt);

export function createLocalAdapter(driver: KVDriver): StorageAdapter {
  const readList = async <T>(key: string) => (await driver.get<T[]>(key)) ?? [];

  return {
    moods: {
      async list() {
        return (await readList<MoodLog>(KEYS.moods)).sort(byNewest);
      },
      async add(log) {
        const logs = await readList<MoodLog>(KEYS.moods);
        await driver.set(KEYS.moods, [...logs, log]);
      },
      replaceAll: (logs) => driver.set(KEYS.moods, logs),
      async remove(id) {
        const logs = await readList<MoodLog>(KEYS.moods);
        await driver.set(
          KEYS.moods,
          logs.filter((l) => l.id !== id),
        );
      },
      clear: () => driver.del(KEYS.moods),
    },

    journal: {
      async list() {
        return (await readList<JournalEntry>(KEYS.journal)).sort(byNewest);
      },
      async get(id) {
        return (await readList<JournalEntry>(KEYS.journal)).find((e) => e.id === id);
      },
      async put(entry) {
        const entries = await readList<JournalEntry>(KEYS.journal);
        const rest = entries.filter((e) => e.id !== entry.id);
        await driver.set(KEYS.journal, [...rest, entry]);
      },
      replaceAll: (entries) => driver.set(KEYS.journal, entries),
      async remove(id) {
        const entries = await readList<JournalEntry>(KEYS.journal);
        await driver.set(
          KEYS.journal,
          entries.filter((e) => e.id !== id),
        );
      },
      clear: () => driver.del(KEYS.journal),
    },

    vaultKeys: {
      getKeyring: () => driver.get<Keyring>(KEYS.keyring),
      setKeyring: (keyring) => driver.set(KEYS.keyring, keyring),
      getDeviceKey: () => driver.get<CryptoKey>(KEYS.deviceKey),
      setDeviceKey: (key) => driver.set(KEYS.deviceKey, key),
      async clear() {
        await driver.del(KEYS.keyring);
        await driver.del(KEYS.deviceKey);
      },
    },
  };
}
