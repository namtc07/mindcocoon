import type { Keyring } from "@/types";

/** Only the recovery wrap is uploaded (see keyring.backupWraps). */
export type BackupWraps = Pick<Keyring, "recovery">;

/** What the server stores: ciphertext plus the wraps that need a user secret to open. */
export interface RemoteBackup {
  ciphertext: string;
  wraps: BackupWraps;
  updatedAt: string;
}

export interface BackupRemote {
  fetch(): Promise<RemoteBackup | null>;
  put(backup: Omit<RemoteBackup, "updatedAt">): Promise<void>;
  /** The server half for same-device passcode resets; created on first request. */
  getServerSecret(): Promise<string>;
}
