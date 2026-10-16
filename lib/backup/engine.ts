import { generateDeviceKey } from "@/lib/crypto";
import { loadMoods, onMoodChange } from "@/lib/mood/store";
import { getStorage } from "@/lib/storage";
import { DEFAULT_AUTO_LOCK_MINUTES, adoptBackupWraps, unlockWithPasscode, unlockWithRecoveryCode } from "@/lib/vault/keyring";
import {
  attachServerSecret,
  ensureRecoveryCode,
  getBackupWraps,
  getUnlockedDek,
  onVaultChange,
  reloadVault,
  unlockWithPasscode as unlockSessionWithPasscode,
  unlockWithRecoveryCode as unlockSessionWithRecoveryCode,
} from "@/lib/vault/session";
import type { Keyring } from "@/types";
import type { BackupRemote } from "./remote";
import { buildSnapshot, containsAll, isEmptySnapshot, openSnapshot, sealSnapshot } from "./snapshot";

/**
 * End-to-end-encrypted backup. The server only ever receives sealed snapshots and
 * the passcode/recovery wraps; the device and server-secret wraps never leave.
 * v1 is backup + restore, not multi-device sync: it never merges, and it never
 * overwrites a backup it cannot prove is older than this device's data.
 */

export type BackupStatus = "idle" | "pending" | "synced" | "error";
export type SignInOutcome = "pushed" | "restore-available" | "conflict";
export type RestoreSecret = { recoveryCode: string } | { passcode: string };

const DEBOUNCE_MS = 5_000;
const RETRY_START_MS = 5_000;
const RETRY_MAX_MS = 5 * 60_000;

export function createBackupEngine(remote: BackupRemote) {
  let status: BackupStatus = "idle";
  let debounce: ReturnType<typeof setTimeout> | null = null;
  let retry: ReturnType<typeof setTimeout> | null = null;
  let retryDelay = RETRY_START_MS;
  const statusListeners = new Set<() => void>();
  const codeListeners = new Set<(code: string) => void>();

  function setStatus(next: BackupStatus) {
    status = next;
    statusListeners.forEach((l) => l());
  }

  function clearTimers() {
    if (debounce) clearTimeout(debounce);
    if (retry) clearTimeout(retry);
    debounce = retry = null;
  }

  /** Seals and uploads the current data. Waits (pending) while the vault is locked. */
  async function pushNow(): Promise<void> {
    const dek = getUnlockedDek();
    if (!dek) {
      setStatus("pending");
      return;
    }
    const code = await ensureRecoveryCode();
    if (code) codeListeners.forEach((l) => l(code));
    const ciphertext = await sealSnapshot(await buildSnapshot(), dek);
    try {
      await remote.put({ ciphertext, wraps: getBackupWraps() });
      retryDelay = RETRY_START_MS;
      setStatus("synced");
    } catch {
      setStatus("error");
      retry = setTimeout(() => void pushNow(), retryDelay);
      retryDelay = Math.min(retryDelay * 2, RETRY_MAX_MS);
    }
  }

  function schedulePush() {
    setStatus("pending");
    clearTimers();
    debounce = setTimeout(() => void pushNow(), DEBOUNCE_MS);
  }

  /** Replaces this device's data with the backup. Returns false when the secret is wrong. */
  async function restore(secret: RestoreSecret): Promise<boolean> {
    const backup = await remote.fetch();
    if (!backup) return false;
    const temp: Keyring = { version: 1, ...backup.wraps, autoLockMinutes: DEFAULT_AUTO_LOCK_MINUTES };
    const dek =
      "recoveryCode" in secret
        ? await unlockWithRecoveryCode(temp, secret.recoveryCode)
        : await unlockWithPasscode(temp, secret.passcode);
    if (!dek) return false;

    const snapshot = await openSnapshot(backup.ciphertext, dek);
    const storage = getStorage();
    let deviceKey = await storage.vaultKeys.getDeviceKey();
    if (!deviceKey) {
      deviceKey = await generateDeviceKey();
      await storage.vaultKeys.setDeviceKey(deviceKey);
    }
    await storage.journal.replaceAll(snapshot.journal);
    await storage.moods.replaceAll(snapshot.moods);
    await storage.vaultKeys.setKeyring(await adoptBackupWraps(backup.wraps, dek, deviceKey));

    await reloadVault();
    if (!getUnlockedDek()) {
      if ("recoveryCode" in secret) await unlockSessionWithRecoveryCode(secret.recoveryCode);
      else await unlockSessionWithPasscode(secret.passcode);
    }
    await loadMoods(true);
    setStatus("synced");
    return true;
  }

  /** Decides what to do right after sign-in. Never overwrites either side on its own. */
  async function onSignedIn(): Promise<SignInOutcome> {
    if (getUnlockedDek()) {
      try {
        await attachServerSecret(await remote.getServerSecret());
      } catch {
        // Not fatal: the passcode can still be reset with the recovery code.
      }
    }
    const backup = await remote.fetch();
    const local = await buildSnapshot();
    if (!backup) {
      await pushNow();
      return "pushed";
    }
    if (isEmptySnapshot(local)) return "restore-available";

    const dek = getUnlockedDek();
    if (dek) {
      try {
        const remoteSnapshot = await openSnapshot(backup.ciphertext, dek);
        if (containsAll(local, remoteSnapshot)) {
          await pushNow();
          return "pushed";
        }
      } catch {
        // Different data key: this backup came from another vault.
      }
    }
    return "conflict";
  }

  return {
    /** Starts debounced pushes on every vault or mood change. Returns a stop function. */
    start() {
      const offVault = onVaultChange(schedulePush);
      const offMood = onMoodChange(schedulePush);
      return () => {
        offVault();
        offMood();
        clearTimers();
      };
    },
    pushNow,
    restore,
    onSignedIn,
    status: () => status,
    subscribe(listener: () => void) {
      statusListeners.add(listener);
      return () => {
        statusListeners.delete(listener);
      };
    },
    /** Fires when a recovery code had to be created before the first upload; show it to the user. */
    onRecoveryCode(listener: (code: string) => void) {
      codeListeners.add(listener);
      return () => {
        codeListeners.delete(listener);
      };
    },
  };
}

export type BackupEngine = ReturnType<typeof createBackupEngine>;
