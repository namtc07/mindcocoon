import { createStore, del, get, keys, set, type UseStore } from "idb-keyval";

/**
 * Minimal key-value driver. Repositories are written against this interface,
 * so the backing store (IndexedDB, memory, a remote cache…) can be swapped.
 */
export interface KVDriver {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T): Promise<void>;
  del(key: string): Promise<void>;
  keys(): Promise<string[]>;
}

export function createMemoryDriver(): KVDriver {
  const map = new Map<string, unknown>();
  return {
    async get<T>(key: string) {
      return map.get(key) as T | undefined;
    },
    async set(key, value) {
      map.set(key, value);
    },
    async del(key) {
      map.delete(key);
    },
    async keys() {
      return [...map.keys()];
    },
  };
}

/**
 * IndexedDB driver. Values are stored with structured clone, which also lets us
 * persist non-extractable CryptoKey objects for the device-locked vault.
 */
export function createIndexedDBDriver(dbName = "mindcocoon", storeName = "kv"): KVDriver {
  let store: UseStore | null = null;
  const getStore = () => (store ??= createStore(dbName, storeName));
  return {
    get: (key) => get(key, getStore()),
    set: (key, value) => set(key, value, getStore()),
    del: (key) => del(key, getStore()),
    keys: async () => (await keys(getStore())).map(String),
  };
}

/** Picks IndexedDB in the browser and falls back to memory (SSR, private modes without IDB). */
export function createDefaultDriver(): KVDriver {
  if (typeof window === "undefined" || typeof indexedDB === "undefined") {
    return createMemoryDriver();
  }
  return createIndexedDBDriver();
}
