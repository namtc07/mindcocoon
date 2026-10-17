import { expect, it } from "vitest";
import { decryptString, encryptString } from "@mindcocoon/core/crypto";
import { createIndexedDBDriver } from "@mindcocoon/core/storage/driver";
import { createLocalAdapter } from "@mindcocoon/core/storage/local";

it("keeps one non-extractable device key in IndexedDB", async () => {
  const db = `device-key-test-${crypto.randomUUID()}`;
  const first = await createLocalAdapter(createIndexedDBDriver(db)).vaultKeys.getOrCreateDeviceKey();
  const second = await createLocalAdapter(createIndexedDBDriver(db)).vaultKeys.getOrCreateDeviceKey();
  expect(first.extractable).toBe(false);

  const envelope = await encryptString(first, "same key");
  expect(await decryptString(second, envelope)).toBe("same key");

  const other = await createLocalAdapter(createIndexedDBDriver(`device-key-test-${crypto.randomUUID()}`)).vaultKeys.getOrCreateDeviceKey();
  await expect(decryptString(other, envelope)).rejects.toThrow();
});
