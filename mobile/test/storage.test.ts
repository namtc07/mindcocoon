import { decryptString, encryptString } from "@mindcocoon/core/crypto";
import { getStorage, setStorage } from "@mindcocoon/core/storage/index";
import { __setIterationsForTests } from "@mindcocoon/core/vault/keyring";
import {
  __resetVaultForTests,
  getVaultState,
  initVault,
  regenerateRecoveryCode,
  saveVaultEntry,
  unlockWithRecoveryCode,
} from "@mindcocoon/core/vault/session";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createDeviceKeyStore } from "../src/lib/device-key";
import { createKvDriver } from "../src/lib/kv-driver";
import { createMobileAdapter } from "../src/lib/storage";
import { FakeKvStore } from "./fakes/expo-sqlite-kv-store";
import { FakeSecureStore } from "./fakes/expo-secure-store";

vi.mock("expo-sqlite/kv-store", async () => ({ default: new (await import("./fakes/expo-sqlite-kv-store")).FakeKvStore() }));
vi.mock("expo-secure-store", async () => {
  const fake = await import("./fakes/expo-secure-store");
  const store = new fake.FakeSecureStore();
  return {
    AFTER_FIRST_UNLOCK: fake.AFTER_FIRST_UNLOCK,
    getItemAsync: store.getItemAsync.bind(store),
    setItemAsync: store.setItemAsync.bind(store),
    deleteItemAsync: store.deleteItemAsync.bind(store),
  };
});

beforeEach(() => __setIterationsForTests(1_000));

describe("kv driver", () => {
  it("round-trips JSON values under an mc: namespace", async () => {
    const kv = new FakeKvStore();
    await kv.setItem("other-app", "x");
    const driver = createKvDriver(kv);
    await driver.set("journal:v1", [{ id: "a", n: 1 }]);
    expect(await driver.get("journal:v1")).toEqual([{ id: "a", n: 1 }]);
    expect(kv.data.get("mc:journal:v1")).toBe('[{"id":"a","n":1}]');
    expect(await driver.keys()).toEqual(["journal:v1"]);
    await driver.del("journal:v1");
    expect(await driver.get("journal:v1")).toBeUndefined();
  });
});

describe("device key", () => {
  it("is created once, kept in secure storage, and reused", async () => {
    const secure = new FakeSecureStore();
    const first = await createDeviceKeyStore(secure).getOrCreate();
    const second = await createDeviceKeyStore(secure).getOrCreate();
    expect(secure.data.size).toBe(1);
    expect(secure.lastOptions).toEqual({ keychainAccessible: 0 });
    expect(await decryptString(second, await encryptString(first, "same"))).toBe("same");
    expect(first.extractable).toBe(false);
  });

  it("shares one creation between concurrent callers", async () => {
    const secure = new FakeSecureStore();
    const store = createDeviceKeyStore(secure);
    const [a, b] = await Promise.all([store.getOrCreate(), store.getOrCreate()]);
    expect(await decryptString(b, await encryptString(a, "one"))).toBe("one");
  });
});

describe("mobile adapter + vault", () => {
  it("comes up locked, not empty, when the device key was lost (e.g. restored backup)", async () => {
    const kv = new FakeKvStore();
    const secure = new FakeSecureStore();
    setStorage(createMobileAdapter({ kv, secure }));
    __resetVaultForTests();
    await initVault();
    await saveVaultEntry({ body: "kept through a restore" });
    const code = await regenerateRecoveryCode();

    secure.data.clear(); // the Keychain/Keystore item did not survive
    setStorage(createMobileAdapter({ kv, secure }));
    __resetVaultForTests();
    await initVault();

    expect(getVaultState().status).toBe("locked");
    expect(await getStorage().journal.list()).toHaveLength(1);
    expect(await unlockWithRecoveryCode(code)).toBe(true);
    expect(getVaultState().entries[0].body).toBe("kept through a restore");
  });

  it("is installed into core by the bootstrap module", async () => {
    await import("../src/bootstrap");
    await getStorage().moods.add({ id: "m1", mood: "peaceful", tags: [], createdAt: new Date().toISOString() });
    const kvModule = (await import("expo-sqlite/kv-store")).default as unknown as FakeKvStore;
    expect(kvModule.data.has("mc:moods:v1")).toBe(true);
  });
});
