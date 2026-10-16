// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createBackupEngine } from "@/lib/backup/engine";
import type { BackupRemote, RemoteBackup } from "@/lib/backup/remote";
import { buildSnapshot, openSnapshot, sealSnapshot } from "@/lib/backup/snapshot";
import { __resetMoodsForTests, addMood, getMoodState, loadMoods } from "@/lib/mood/store";
import { getStorage, setStorage } from "@/lib/storage";
import { createMemoryDriver } from "@/lib/storage/driver";
import { createLocalAdapter } from "@/lib/storage/local";
import { __setIterationsForTests } from "@/lib/vault/keyring";
import {
  __resetVaultForTests,
  attachServerSecret,
  getUnlockedDek,
  getVaultState,
  initVault,
  lockVault,
  regenerateRecoveryCode,
  saveVaultEntry,
  setVaultPasscode,
  unlockWithServerSecret,
} from "@/lib/vault/session";

class MemoryRemote implements BackupRemote {
  stored: RemoteBackup | null = null;
  failures = 0;
  put = vi.fn(async (backup: Omit<RemoteBackup, "updatedAt">) => {
    if (this.failures > 0) {
      this.failures--;
      throw new Error("offline");
    }
    this.stored = { ...backup, updatedAt: new Date().toISOString() };
  });
  async fetch() {
    return this.stored;
  }
  async getServerSecret() {
    return "server-secret";
  }
}

/** A fresh "device": empty storage and fresh module state. */
async function newDevice() {
  setStorage(createLocalAdapter(createMemoryDriver()));
  __resetVaultForTests();
  __resetMoodsForTests();
  await initVault();
  await loadMoods();
}

async function seed() {
  await saveVaultEntry({ title: "night", body: "secret journal words" });
  await addMood({ mood: "heavy", tags: ["work"], note: "private note" });
}

beforeEach(async () => {
  __setIterationsForTests(1_000);
  await newDevice();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("snapshots", () => {
  it("round-trip and reveal nothing", async () => {
    await seed();
    const snapshot = await buildSnapshot();
    const sealed = await sealSnapshot(snapshot, getUnlockedDek()!);
    expect(await openSnapshot(sealed, getUnlockedDek()!)).toEqual(snapshot);
    for (const plain of ["secret journal words", "private note", "heavy", "work", "night"]) {
      expect(sealed).not.toContain(plain);
    }
  });
});

describe("backup engine", () => {
  it("uploads only the recovery wrap (a short passcode could be brute-forced server-side)", async () => {
    await seed();
    await regenerateRecoveryCode();
    await setVaultPasscode("2468");
    await attachServerSecret("server-secret");
    const remote = new MemoryRemote();
    await createBackupEngine(remote).pushNow();
    expect(Object.keys(remote.stored!.wraps)).toEqual(["recovery"]);
    expect(JSON.stringify(remote.stored)).not.toContain("secret journal words");
  });

  it("restores everything on a new device with the recovery code", async () => {
    await seed();
    const code = await regenerateRecoveryCode();
    const remote = new MemoryRemote();
    await createBackupEngine(remote).pushNow();
    const originalEntries = getVaultState().entries;
    const originalMoods = getMoodState().logs;

    await newDevice();
    const engine = createBackupEngine(remote);
    expect(await engine.onSignedIn()).toBe("restore-available");
    expect(await engine.restore("abandon ".repeat(11) + "about")).toBe(false);
    expect(getVaultState().entries).toEqual([]);

    expect(await engine.restore(code)).toBe(true);
    expect(getVaultState().entries).toEqual(originalEntries);
    expect(getMoodState().logs).toEqual(originalMoods);
  });

  it("never overwrites anything when both sides have different data", async () => {
    await seed();
    await regenerateRecoveryCode();
    const remote = new MemoryRemote();
    await createBackupEngine(remote).pushNow();

    await newDevice();
    await saveVaultEntry({ body: "a different device" });
    const before = await getStorage().journal.list();
    remote.put.mockClear();

    expect(await createBackupEngine(remote).onSignedIn()).toBe("conflict");
    expect(remote.put).not.toHaveBeenCalled();
    expect(await getStorage().journal.list()).toEqual(before);
  });

  it("pushes local data when there is no backup yet", async () => {
    await seed();
    await regenerateRecoveryCode();
    const remote = new MemoryRemote();
    expect(await createBackupEngine(remote).onSignedIn()).toBe("pushed");
    expect(remote.stored).not.toBeNull();
  });

  it("asks for a recovery code before the first upload", async () => {
    await seed();
    const remote = new MemoryRemote();
    const engine = createBackupEngine(remote);
    const codes: string[] = [];
    engine.onRecoveryCode((code) => codes.push(code));
    await engine.pushNow();
    expect(codes).toHaveLength(1);
    expect(getVaultState().hasRecoveryCode).toBe(true);
    expect(remote.stored?.wraps.recovery).toBeDefined();
  });

  it("retries after failures until it is backed up", async () => {
    vi.useFakeTimers();
    await seed();
    await regenerateRecoveryCode();
    const remote = new MemoryRemote();
    const engine = createBackupEngine(remote);
    const stop = engine.start();
    await engine.onSignedIn(); // no backup yet → pushed, automatic backups armed
    remote.put.mockClear();
    remote.failures = 2;

    // WebCrypto resolves on the real event loop, so wait for each step instead of asserting immediately.
    await saveVaultEntry({ body: "one more" });
    await vi.advanceTimersByTimeAsync(5_000);
    await vi.waitFor(() => expect(engine.status()).toBe("error"));
    await vi.advanceTimersByTimeAsync(5_000);
    await vi.waitFor(() => expect(remote.put).toHaveBeenCalledTimes(2));
    await vi.advanceTimersByTimeAsync(10_000);
    await vi.waitFor(() => expect(engine.status()).toBe("synced"));
    expect(remote.put).toHaveBeenCalledTimes(3);
    stop();
  });

  it("lets a signed-in user reset a forgotten passcode with the server secret", async () => {
    await setVaultPasscode("2468");
    await attachServerSecret("server-secret");
    lockVault();
    expect(await unlockWithServerSecret("server-secret")).toBe(true);
  });

  it("does not push anything while a restore decision is pending", async () => {
    vi.useFakeTimers();
    await seed();
    await regenerateRecoveryCode();
    const remote = new MemoryRemote();
    await createBackupEngine(remote).pushNow();
    const original = remote.stored;

    await newDevice();
    remote.put.mockClear();
    const engine = createBackupEngine(remote);
    const stop = engine.start();
    expect(await engine.onSignedIn()).toBe("restore-available");
    await addMood({ mood: "peaceful", tags: [] });
    await vi.advanceTimersByTimeAsync(20_000);
    // Let any real WebCrypto work triggered by the timers finish before asserting.
    vi.useRealTimers();
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(remote.put).not.toHaveBeenCalled();
    expect(remote.stored).toBe(original);
    stop();
  });

  it("waits for the vault to be unlocked instead of reporting a conflict", async () => {
    await seed();
    await regenerateRecoveryCode();
    await setVaultPasscode("2468");
    const remote = new MemoryRemote();
    await createBackupEngine(remote).pushNow();
    remote.put.mockClear();

    // Next launch: passcode vault starts locked.
    __resetVaultForTests();
    await initVault();
    const engine = createBackupEngine(remote);
    expect(await engine.onSignedIn()).toBe("deferred");
    expect(remote.put).not.toHaveBeenCalled();
  });

  it("opens the vault itself before deciding (no false conflict on launch)", async () => {
    await seed();
    await regenerateRecoveryCode();
    const remote = new MemoryRemote();
    await createBackupEngine(remote).pushNow();

    // Next launch: nothing has opened the vault yet.
    __resetVaultForTests();
    expect(await createBackupEngine(remote).onSignedIn()).toBe("pushed");
  });
});
