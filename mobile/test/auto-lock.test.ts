import { setStorage } from "@mindcocoon/core/storage/index";
import { createMemoryDriver } from "@mindcocoon/core/storage/driver";
import { createLocalAdapter } from "@mindcocoon/core/storage/local";
import { __setIterationsForTests } from "@mindcocoon/core/vault/keyring";
import { __resetVaultForTests, getVaultState, initVault, setVaultPasscode } from "@mindcocoon/core/vault/session";
import { beforeEach, describe, expect, it } from "vitest";
import { createAutoLock } from "../src/lib/auto-lock";

type Listener = (state: string) => void;

function fakeAppState() {
  let listener: Listener | undefined;
  return {
    addEventListener: (_: "change", fn: Listener) => {
      listener = fn;
      return { remove: () => (listener = undefined) };
    },
    emit: (s: string) => listener?.(s),
  };
}

beforeEach(async () => {
  __setIterationsForTests(1_000);
  setStorage(createLocalAdapter(createMemoryDriver()));
  __resetVaultForTests();
  await initVault();
});

describe("mobile auto-lock", () => {
  it("locks a passcode vault after too long in the background", async () => {
    await setVaultPasscode("2468");
    let now = 0;
    const app = fakeAppState();
    const stop = createAutoLock({ appState: app, now: () => now }).start();
    app.emit("background");
    now = 6 * 60_000;
    app.emit("active");
    expect(getVaultState().status).toBe("locked");
    stop();
  });

  it("stays unlocked after a short trip away", async () => {
    await setVaultPasscode("2468");
    let now = 0;
    const app = fakeAppState();
    const stop = createAutoLock({ appState: app, now: () => now }).start();
    app.emit("background");
    now = 60_000;
    app.emit("active");
    expect(getVaultState().status).toBe("unlocked");
    stop();
  });

  it("locks after foreground inactivity", async () => {
    await setVaultPasscode("2468");
    let now = 0;
    const autoLock = createAutoLock({ appState: fakeAppState(), now: () => now });
    autoLock.markActivity();
    now = 6 * 60_000;
    autoLock.check();
    expect(getVaultState().status).toBe("locked");
  });
});
