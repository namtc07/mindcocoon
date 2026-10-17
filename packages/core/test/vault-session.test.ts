// @vitest-environment node
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createMemoryDriver } from "@mindcocoon/core/storage/driver";
import { getStorage, setStorage } from "@mindcocoon/core/storage/index";
import { createLocalAdapter } from "@mindcocoon/core/storage/local";
import { DEVICE_RESET_WAIT_MS, __setIterationsForTests } from "@mindcocoon/core/vault/keyring";
import {
  VaultLockedError,
  __resetVaultForTests,
  completePasscodeReset,
  decryptField,
  deleteVaultEntry,
  encryptField,
  getVaultState,
  initVault,
  lockVault,
  onVaultChange,
  regenerateRecoveryCode,
  removeVaultPasscode,
  requestPasscodeReset,
  saveVaultEntry,
  setVaultPasscode,
  unlockWithPasscode,
  unlockWithRecoveryCode,
  updateVaultEntry,
} from "@mindcocoon/core/vault/session";

beforeAll(() => __setIterationsForTests(1_000));

beforeEach(() => {
  setStorage(createLocalAdapter(createMemoryDriver()));
  __resetVaultForTests();
});

describe("vault session", () => {
  it("opens a fresh vault without a passcode", async () => {
    await initVault();
    expect(getVaultState()).toMatchObject({ status: "unlocked", hasPasscode: false, entries: [] });
  });

  it("stores entries only as encrypted envelopes", async () => {
    await initVault();
    const entry = await saveVaultEntry({ title: "Night", body: "secret words" });
    const stored = await getStorage().journal.list();
    expect(stored).toHaveLength(1);
    expect(stored[0].content).toMatch(/^v1\./);
    expect(stored[0].title).toBeUndefined();
    expect(stored[0].isEncrypted).toBe(true);
    expect(JSON.stringify(stored)).not.toContain("secret words");
    expect(JSON.stringify(stored)).not.toContain("Night");
    expect(getVaultState().entries[0]).toMatchObject({ id: entry.id, title: "Night", body: "secret words" });
  });

  it("updates and deletes entries", async () => {
    await initVault();
    const entry = await saveVaultEntry({ body: "first" });
    await updateVaultEntry(entry.id, { title: "t", body: "second" });
    expect(getVaultState().entries[0]).toMatchObject({ title: "t", body: "second" });
    await deleteVaultEntry(entry.id);
    expect(getVaultState().entries).toEqual([]);
    expect(await getStorage().journal.list()).toEqual([]);
  });

  it("locks behind a passcode and returns a recovery code the first time", async () => {
    await initVault();
    await saveVaultEntry({ body: "hello" });
    const { recoveryCode } = await setVaultPasscode("2468");
    expect(recoveryCode?.split(" ")).toHaveLength(12);
    expect(getVaultState()).toMatchObject({ hasPasscode: true, hasRecoveryCode: true });

    lockVault();
    expect(getVaultState()).toMatchObject({ status: "locked", entries: [] });
    await expect(encryptField("x")).rejects.toBeInstanceOf(VaultLockedError);

    expect(await unlockWithPasscode("0000")).toBe(false);
    expect(await unlockWithPasscode("2468")).toBe(true);
    expect(getVaultState().entries[0].body).toBe("hello");

    const second = await setVaultPasscode("1357");
    expect(second.recoveryCode).toBeNull();
  });

  it("stays locked after a reload when a passcode is set", async () => {
    await initVault();
    await setVaultPasscode("2468");
    __resetVaultForTests();
    await initVault();
    expect(getVaultState()).toMatchObject({ status: "locked", hasPasscode: true });
  });

  it("unlocks with the recovery code", async () => {
    await initVault();
    const { recoveryCode } = await setVaultPasscode("2468");
    lockVault();
    expect(await unlockWithRecoveryCode("abandon ".repeat(11) + "about")).toBe(false);
    expect(await unlockWithRecoveryCode(recoveryCode!)).toBe(true);
  });

  it("regenerates the recovery code and invalidates the old one", async () => {
    await initVault();
    const { recoveryCode: old } = await setVaultPasscode("2468");
    const fresh = await regenerateRecoveryCode();
    lockVault();
    expect(await unlockWithRecoveryCode(old!)).toBe(false);
    expect(await unlockWithRecoveryCode(fresh)).toBe(true);
  });

  it("resets the passcode on this device only after an hour", async () => {
    const now = vi.spyOn(Date, "now");
    now.mockReturnValue(1_000_000);
    await initVault();
    await saveVaultEntry({ body: "kept" });
    await setVaultPasscode("2468");
    lockVault();

    await requestPasscodeReset();
    expect(getVaultState().resetReadyAt).toBe(1_000_000 + DEVICE_RESET_WAIT_MS);

    now.mockReturnValue(1_000_000 + DEVICE_RESET_WAIT_MS - 1);
    expect(await completePasscodeReset("1111")).toBe(false);

    now.mockReturnValue(1_000_000 + DEVICE_RESET_WAIT_MS);
    expect(await completePasscodeReset("1111")).toBe(true);
    expect(getVaultState()).toMatchObject({ status: "unlocked", resetReadyAt: null });
    expect(getVaultState().entries[0].body).toBe("kept");

    lockVault();
    expect(await unlockWithPasscode("2468")).toBe(false);
    expect(await unlockWithPasscode("1111")).toBe(true);
  });

  it("removes the passcode and auto-unlocks again", async () => {
    await initVault();
    await setVaultPasscode("2468");
    await removeVaultPasscode();
    __resetVaultForTests();
    await initVault();
    expect(getVaultState()).toMatchObject({ status: "unlocked", hasPasscode: false });
  });

  it("encrypts and decrypts single fields", async () => {
    await initVault();
    const envelope = await encryptField("a note");
    expect(envelope).toMatch(/^v1\./);
    expect(await decryptField(envelope)).toBe("a note");
  });

  it("notifies change listeners once per persisted change", async () => {
    await initVault();
    const listener = vi.fn();
    const off = onVaultChange(listener);
    await saveVaultEntry({ body: "one" });
    expect(listener).toHaveBeenCalledTimes(1);
    off();
    await saveVaultEntry({ body: "two" });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("ignores an initialisation that was overtaken by a reset", async () => {
    // First storage gets its own vault and an entry.
    await initVault();
    await saveVaultEntry({ body: "old device" });

    // Start a new init, then reset onto fresh storage before it finishes (wipe/restore do this).
    __resetVaultForTests();
    const stale = initVault();
    __resetVaultForTests();
    setStorage(createLocalAdapter(createMemoryDriver()));
    await initVault();
    await stale.catch(() => {});

    const entry = await saveVaultEntry({ body: "new storage" });
    __resetVaultForTests();
    await initVault();
    expect(getVaultState().entries.map((e) => e.id)).toEqual([entry.id]);
  });
});
