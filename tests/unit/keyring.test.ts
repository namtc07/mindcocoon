// @vitest-environment node
import { beforeAll, describe, expect, it } from "vitest";
import {
  generateDeviceKey,
  generateRecoveryCode,
  isValidRecoveryCode,
  normalizeRecoveryCode,
} from "@/lib/crypto";
import {
  DEVICE_RESET_WAIT_MS,
  __setIterationsForTests,
  adoptBackupWraps,
  backupWraps,
  completeDeviceReset,
  createKeyring,
  removePasscode,
  requestDeviceReset,
  resetReadyAt,
  setPasscode,
  setRecoveryCode,
  setServerWrap,
  unlockWithDevice,
  unlockWithPasscode,
  unlockWithRecoveryCode,
  unlockWithServerSecret,
} from "@/lib/vault/keyring";

beforeAll(() => {
  __setIterationsForTests(1_000);
});

describe("recovery codes", () => {
  it("are 12 valid words", () => {
    const code = generateRecoveryCode();
    expect(code.split(" ")).toHaveLength(12);
    expect(isValidRecoveryCode(code)).toBe(true);
  });

  it("normalize case, dashes and spacing", () => {
    expect(normalizeRecoveryCode("  Abandon-ABILITY \n able  ")).toBe("abandon ability able");
  });

  it("reject typos", () => {
    const words = generateRecoveryCode().split(" ");
    words[0] = "notaword";
    expect(isValidRecoveryCode(words.join(" "))).toBe(false);
  });
});

describe("keyring", () => {
  it("unlocks a fresh vault with the device key only", async () => {
    const deviceKey = await generateDeviceKey();
    const { keyring, dek } = await createKeyring(deviceKey);
    expect(keyring.device).toMatch(/^v1\./);
    expect((await unlockWithDevice(keyring, deviceKey))!.raw).toEqual(dek.raw);
    expect(await unlockWithDevice(keyring, await generateDeviceKey())).toBeNull();
  });

  it("requires the passcode once one is set", async () => {
    const deviceKey = await generateDeviceKey();
    const { keyring, dek } = await createKeyring(deviceKey);
    const locked = await setPasscode(keyring, dek, "2468", deviceKey);
    expect(locked.device).toBeUndefined();
    expect(locked.deviceReset).toMatch(/^v1\./);
    expect(await unlockWithDevice(locked, deviceKey)).toBeNull();
    expect(await unlockWithPasscode(locked, "1357")).toBeNull();
    expect((await unlockWithPasscode(locked, "2468"))!.raw).toEqual(dek.raw);
  });

  it("keeps the same data key when the passcode changes", async () => {
    const deviceKey = await generateDeviceKey();
    const { keyring, dek } = await createKeyring(deviceKey);
    const first = await setPasscode(keyring, dek, "2468", deviceKey);
    const changed = await setPasscode(first, dek, "9999", deviceKey);
    expect(await unlockWithPasscode(changed, "2468")).toBeNull();
    expect((await unlockWithPasscode(changed, "9999"))!.raw).toEqual(dek.raw);
  });

  it("goes back to device unlock when the passcode is removed", async () => {
    const deviceKey = await generateDeviceKey();
    const { keyring, dek } = await createKeyring(deviceKey);
    const locked = await setPasscode(keyring, dek, "2468", deviceKey);
    const open = await removePasscode(locked, dek, deviceKey);
    expect(open.passcode).toBeUndefined();
    expect(open.deviceReset).toBeUndefined();
    expect((await unlockWithDevice(open, deviceKey))!.raw).toEqual(dek.raw);
  });

  it("unlocks with a recovery code typed loosely", async () => {
    const deviceKey = await generateDeviceKey();
    const { keyring, dek } = await createKeyring(deviceKey);
    const { keyring: withCode, code } = await setRecoveryCode(keyring, dek);
    const messy = `  ${code.toUpperCase().replace(/ /g, "-")} `;
    expect((await unlockWithRecoveryCode(withCode, messy))!.raw).toEqual(dek.raw);
    expect(await unlockWithRecoveryCode(withCode, generateRecoveryCode())).toBeNull();
  });

  it("allows a device reset only after the full hour", async () => {
    const deviceKey = await generateDeviceKey();
    const { keyring, dek } = await createKeyring(deviceKey);
    const locked = await setPasscode(keyring, dek, "2468", deviceKey);
    expect(await completeDeviceReset(locked, deviceKey, Date.now())).toBeNull();

    const requested = requestDeviceReset(locked, 1_000);
    expect(resetReadyAt(requested)).toBe(1_000 + DEVICE_RESET_WAIT_MS);
    expect(await completeDeviceReset(requested, deviceKey, 1_000 + 3_599_999)).toBeNull();
    expect((await completeDeviceReset(requested, deviceKey, 1_000 + 3_600_000))!.raw).toEqual(dek.raw);
  });

  it("unlocks with the server secret", async () => {
    const deviceKey = await generateDeviceKey();
    const { keyring, dek } = await createKeyring(deviceKey);
    const withServer = await setServerWrap(keyring, dek, "server-secret");
    expect((await unlockWithServerSecret(withServer, "server-secret"))!.raw).toEqual(dek.raw);
    expect(await unlockWithServerSecret(withServer, "other")).toBeNull();
  });

  it("never exports device or server wraps for backup", async () => {
    const deviceKey = await generateDeviceKey();
    const { keyring, dek } = await createKeyring(deviceKey);
    const { keyring: withCode } = await setRecoveryCode(keyring, dek);
    const locked = await setPasscode(withCode, dek, "2468", deviceKey);
    const full = await setServerWrap(locked, dek, "server-secret");
    const wraps = backupWraps(full);
    expect(Object.keys(wraps)).toEqual(["recovery"]);
  });

  it("adopts backup wraps on a new device", async () => {
    const oldDevice = await generateDeviceKey();
    const { keyring, dek } = await createKeyring(oldDevice);
    const { keyring: withCode } = await setRecoveryCode(keyring, dek);

    const newDevice = await generateDeviceKey();
    const open = await adoptBackupWraps(backupWraps(withCode), dek, newDevice);
    expect((await unlockWithDevice(open, newDevice))!.raw).toEqual(dek.raw);

    // A passcode never travels: the restored device opens without one until the user sets a new one.
    const locked = await setPasscode(withCode, dek, "2468", oldDevice);
    const adoptedLocked = await adoptBackupWraps(backupWraps(locked), dek, newDevice);
    expect(adoptedLocked.passcode).toBeUndefined();
    expect((await unlockWithDevice(adoptedLocked, newDevice))!.raw).toEqual(dek.raw);
  });
});
