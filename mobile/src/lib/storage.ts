import { createLocalAdapter } from "@mindcocoon/core/storage/local";
import type { StorageAdapter } from "@mindcocoon/core/storage/repositories";
import { createDeviceKeyStore, type SecureKeyStore } from "./device-key";
import { createKvDriver, type StringKvStore } from "./kv-driver";

/** Core storage on the phone: SQLite for data, the Keychain/Keystore for the device key. */
export function createMobileAdapter(deps: { kv?: StringKvStore; secure?: SecureKeyStore } = {}): StorageAdapter {
  const driver = createKvDriver(deps.kv);
  const base = createLocalAdapter(driver);
  const deviceKey = createDeviceKeyStore(deps.secure, async () => (await base.vaultKeys.getKeyring()) !== undefined);
  return {
    ...base,
    vaultKeys: {
      ...base.vaultKeys,
      getOrCreateDeviceKey: () => deviceKey.getOrCreate(),
      replaceDeviceKey: () => deviceKey.replace(),
      async clear() {
        await base.vaultKeys.clear();
        await deviceKey.clear();
      },
    },
  };
}
