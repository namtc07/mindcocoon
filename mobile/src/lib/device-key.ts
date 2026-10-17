import { fromBase64, importDek, toBase64 } from "@mindcocoon/core/crypto";
import * as SecureStore from "expo-secure-store";

/** The subset of expo-secure-store we use. */
export interface SecureKeyStore {
  getItemAsync(key: string): Promise<string | null>;
  setItemAsync(key: string, value: string, options?: { keychainAccessible?: number }): Promise<void>;
  deleteItemAsync(key: string): Promise<void>;
}

const KEY = "mc.device-key";

/**
 * The device key lives in the Keychain (iOS) / Keystore-backed storage (Android) as 32 random
 * bytes, readable after first unlock so night-time use with a locked screen still works.
 *
 * If the key is missing while a vault already exists (phone restored without its Keychain item,
 * or a read that failed), we NEVER write a new one here: an in-memory key is returned, the vault
 * opens "locked", and core calls replace() only after the vault was unlocked another way.
 */
export function createDeviceKeyStore(
  secure: SecureKeyStore = SecureStore,
  hasExistingVault: () => Promise<boolean> = async () => false,
) {
  let pending: Promise<CryptoKey> | null = null;

  async function persistNew(): Promise<CryptoKey> {
    const raw = crypto.getRandomValues(new Uint8Array(32));
    await secure.setItemAsync(KEY, toBase64(raw), { keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK });
    return importDek(raw);
  }

  return {
    getOrCreate(): Promise<CryptoKey> {
      pending ??= (async () => {
        const stored = await secure.getItemAsync(KEY);
        if (stored) return importDek(fromBase64(stored));
        if (await hasExistingVault()) return importDek(crypto.getRandomValues(new Uint8Array(32)));
        return persistNew();
      })().catch((error) => {
        pending = null;
        throw error;
      });
      return pending;
    },
    /** Saves a fresh key (the vault was just unlocked another way and will be re-wrapped). */
    async replace(): Promise<CryptoKey> {
      const key = await persistNew();
      pending = Promise.resolve(key);
      return key;
    },
    async clear() {
      pending = null;
      await secure.deleteItemAsync(KEY);
    },
  };
}
