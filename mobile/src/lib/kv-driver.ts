import type { KVDriver } from "@mindcocoon/core/storage/driver";
import Storage from "expo-sqlite/kv-store";

/** The subset of expo-sqlite/kv-store we use (string values only). */
export interface StringKvStore {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  getAllKeys(): Promise<string[]>;
}

const PREFIX = "mc:";

/** Core's KVDriver on SQLite: JSON values under an "mc:" namespace. */
export function createKvDriver(store: StringKvStore = Storage): KVDriver {
  return {
    async get<T>(key: string) {
      const raw = await store.getItem(PREFIX + key);
      return raw === null ? undefined : (JSON.parse(raw) as T);
    },
    async set(key, value) {
      await store.setItem(PREFIX + key, JSON.stringify(value));
    },
    async del(key) {
      await store.removeItem(PREFIX + key);
    },
    async keys() {
      return (await store.getAllKeys()).filter((k) => k.startsWith(PREFIX)).map((k) => k.slice(PREFIX.length));
    },
  };
}
