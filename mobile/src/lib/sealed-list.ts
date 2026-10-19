import { decryptField, encryptField } from "@mindcocoon/core/vault/session";
import { useEffect, useSyncExternalStore } from "react";
import { createKvDriver } from "./kv-driver";

/**
 * A small list of private texts kept on this device, each encrypted with the vault's data key
 * (`v1.`), plus plain metadata (dates, choices). Used by the jar of light moments and the letters
 * to your future self. Storage first, then memory: a failed write leaves nothing half-saved.
 */
export type Sealed<M> = { id: string; text: string; createdAt: string } & M;

export function createSealedList<M extends object>(key: string) {
  const driver = createKvDriver();
  let cache: Sealed<M>[] | null = null;
  const EMPTY: Sealed<M>[] = [];
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((l) => l());

  async function save(next: Sealed<M>[]) {
    await driver.set(key, next);
    cache = next;
    emit();
  }

  async function list(): Promise<Sealed<M>[]> {
    cache ??= (await driver.get<Sealed<M>[]>(key)) ?? [];
    return cache;
  }

  return {
    list,
    /** Throws VaultLockedError when a passcode vault is locked (the text can't be encrypted). */
    async add(text: string, meta: M, now = new Date()) {
      const item = {
        ...meta,
        id: `${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
        text: await encryptField(text.trim()),
        createdAt: now.toISOString(),
      } as Sealed<M>;
      await save([...(await list()), item]);
      return item;
    },
    async read(id: string): Promise<string> {
      const item = (await list()).find((i) => i.id === id);
      if (!item) throw new Error("Not found");
      return decryptField(item.text);
    },
    async remove(id: string) {
      await save((await list()).filter((i) => i.id !== id));
    },
    async clear() {
      cache = [];
      await driver.del(key);
      emit();
    },
    /** The stored items (loaded on first use). */
    use(): Sealed<M>[] {
      const items = useSyncExternalStore(
        (l) => {
          listeners.add(l);
          return () => listeners.delete(l);
        },
        () => cache ?? EMPTY,
        () => EMPTY,
      );
      useEffect(() => {
        if (cache === null) list().then(emit).catch(() => {});
      }, []);
      return items;
    },
    async __reset() {
      cache = [];
      await driver.del(key);
      cache = null;
      emit();
    },
  };
}
