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
  /** Plain text, or an encrypted envelope when isNoteEncrypted. */
  note?: string;
  isNoteEncrypted?: boolean;
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

/** Data-key wrap derived from a secret with PBKDF2. */
export interface KdfWrap {
  salt: string;
  iterations: number;
  wrapped: string;
}

/** Device-local key material for the vault (see lib/vault/keyring.ts). */
export interface Keyring {
  version: 1;
  /** DEK wrapped by the device key — present only when there is no passcode. */
  device?: string;
  passcode?: KdfWrap;
  recovery?: KdfWrap;
  /** DEK wrapped by the server secret — LOCAL ONLY, never uploaded. */
  server?: string;
  /** DEK wrapped by the device key while a passcode is set (1-hour reset path). */
  deviceReset?: string;
  resetRequestedAt?: number;
  autoLockMinutes: number;
}

export interface UnlockedDek {
  key: CryptoKey;
  raw: Uint8Array<ArrayBuffer>;
}
