import type { Keyring } from "@/types";

export type BackupWraps = Pick<Keyring, "passcode" | "recovery">;

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
