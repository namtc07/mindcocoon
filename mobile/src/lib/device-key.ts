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
 * If it is ever missing while a vault exists, the vault simply opens "locked" and the
 * recovery code (or passcode) brings it back — a fresh key never overwrites existing wraps.
 */
export function createDeviceKeyStore(secure: SecureKeyStore = SecureStore) {
  let pending: Promise<CryptoKey> | null = null;
  return {
    getOrCreate(): Promise<CryptoKey> {
      pending ??= (async () => {
        const stored = await secure.getItemAsync(KEY);
        if (stored) return importDek(fromBase64(stored));
        const raw = crypto.getRandomValues(new Uint8Array(32));
        await secure.setItemAsync(KEY, toBase64(raw), { keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK });
        return importDek(raw);
      })().catch((error) => {
        pending = null;
        throw error;
      });
      return pending;
    },
    async clear() {
      pending = null;
      await secure.deleteItemAsync(KEY);
    },
  };
}
