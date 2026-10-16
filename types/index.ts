/**
 * Shared data contracts. These are the canonical models for the web app,
 * the future mobile app and the Supabase schema (supabase/migrations).
 * Keep field names in sync with the SQL columns (snake_case there).
 */

export type MoodType = "peaceful" | "numb" | "heavy" | "anxious" | "hopeful";

export interface MoodLog {
  id: string;
  userId?: string;
  mood: MoodType;
  tags: string[];
  note?: string;
  createdAt: string;
}

export interface JournalEntry {
  id: string;
  userId?: string;
  /** Left empty when isEncrypted — the title lives inside the encrypted payload. */
  title?: string;
  /** Plain text, or an encrypted envelope (`v1.<iv>.<ciphertext>`) when isEncrypted. */
  content: string;
  isEncrypted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SoundTrack {
  id: string;
  title: string;
  category: string;
  src: string;
  isPremium: boolean;
}

/** Decrypted shape of an encrypted JournalEntry, only ever held in memory. */
export interface JournalPayload {
  title?: string;
  body: string;
}

export interface DecryptedJournalEntry extends Omit<JournalEntry, "content"> {
  title?: string;
  body: string;
}

export type VaultLockMode = "device" | "passcode";

/** Stored alongside the vault so the app knows how to derive the key. */
export interface VaultMeta {
  mode: VaultLockMode;
  /** base64 PBKDF2 salt (passcode mode only). */
  salt?: string;
  iterations?: number;
  /** Encrypted known string used to verify a passcode without decrypting entries. */
  verifier?: string;
  /** Minutes of inactivity / hidden tab before the vault locks again. */
  autoLockMinutes: number;
}
