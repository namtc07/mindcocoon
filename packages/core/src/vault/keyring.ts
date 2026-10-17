import {
  PBKDF2_ITERATIONS,
  decryptBytes,
  deriveKeyFromSecret,
  encryptBytes,
  generateRecoveryCode,
  generateSalt,
  importDek,
  normalizeRecoveryCode,
  randomBytes,
} from "../crypto";
import type { KdfWrap, Keyring, UnlockedDek } from "../types";

/**
 * Key hierarchy for the vault. One random data key (DEK) encrypts all private
 * content; it is stored only "wrapped" by key-encryption keys:
 *
 * - device       — device key, present only when there is no passcode (auto-unlock)
 * - passcode     — PBKDF2(passcode)
 * - recovery     — PBKDF2(12-word recovery code)
 * - server       — PBKDF2(server secret); local only, never uploaded
 * - deviceReset  — device key, present with a passcode; usable after a 1-hour wait
 *
 * Changing a passcode only re-wraps the DEK; entries are never re-encrypted.
 */

export const DEVICE_RESET_WAIT_MS = 60 * 60 * 1000;
export const DEFAULT_AUTO_LOCK_MINUTES = 5;

let iterations = PBKDF2_ITERATIONS;

/** Lowers PBKDF2 cost so unit tests stay fast. Never call from app code. */
export function __setIterationsForTests(n: number) {
  iterations = n;
}

async function unwrap(kek: CryptoKey, wrapped: string): Promise<UnlockedDek | null> {
  try {
    const raw = await decryptBytes(kek, wrapped);
    return { raw, key: await importDek(raw) };
  } catch {
    return null;
  }
}

async function kdfWrap(secret: string, dek: UnlockedDek): Promise<KdfWrap> {
  const salt = generateSalt();
  const kek = await deriveKeyFromSecret(secret, salt, iterations);
  return { salt, iterations, wrapped: await encryptBytes(kek, dek.raw) };
}

async function kdfUnwrap(secret: string, wrap: KdfWrap | undefined) {
  if (!wrap) return null;
  const kek = await deriveKeyFromSecret(secret, wrap.salt, wrap.iterations);
  return unwrap(kek, wrap.wrapped);
}

export async function createKeyring(
  deviceKey: CryptoKey,
): Promise<{ keyring: Keyring; dek: UnlockedDek }> {
  const raw = randomBytes(32);
  const dek = { raw, key: await importDek(raw) };
  const keyring: Keyring = {
    version: 1,
    device: await encryptBytes(deviceKey, raw),
    autoLockMinutes: DEFAULT_AUTO_LOCK_MINUTES,
  };
  return { keyring, dek };
}

export function unlockWithDevice(k: Keyring, deviceKey: CryptoKey) {
  return k.device ? unwrap(deviceKey, k.device) : Promise.resolve(null);
}

export function unlockWithPasscode(k: Keyring, passcode: string) {
  return kdfUnwrap(passcode, k.passcode);
}

export function unlockWithRecoveryCode(k: Keyring, code: string) {
  return kdfUnwrap(normalizeRecoveryCode(code), k.recovery);
}

export function unlockWithServerSecret(k: Keyring, secret: string) {
  return k.server ? kdfUnwrap(secret, JSON.parse(k.server) as KdfWrap) : Promise.resolve(null);
}

export async function setPasscode(
  k: Keyring,
  dek: UnlockedDek,
  passcode: string,
  deviceKey: CryptoKey,
): Promise<Keyring> {
  const next: Keyring = {
    ...k,
    passcode: await kdfWrap(passcode, dek),
    deviceReset: await encryptBytes(deviceKey, dek.raw),
  };
  delete next.device;
  delete next.resetRequestedAt;
  return next;
}

export async function removePasscode(
  k: Keyring,
  dek: UnlockedDek,
  deviceKey: CryptoKey,
): Promise<Keyring> {
  const next: Keyring = { ...k, device: await encryptBytes(deviceKey, dek.raw) };
  delete next.passcode;
  delete next.deviceReset;
  delete next.resetRequestedAt;
  return next;
}

export async function setRecoveryCode(
  k: Keyring,
  dek: UnlockedDek,
): Promise<{ keyring: Keyring; code: string }> {
  const code = generateRecoveryCode();
  return { keyring: { ...k, recovery: await kdfWrap(code, dek) }, code };
}

/** Stores the server-secret wrap as JSON so it never shares a shape with exported wraps. */
export async function setServerWrap(k: Keyring, dek: UnlockedDek, secret: string): Promise<Keyring> {
  return { ...k, server: JSON.stringify(await kdfWrap(secret, dek)) };
}

export function requestDeviceReset(k: Keyring, now: number): Keyring {
  return { ...k, resetRequestedAt: now };
}

export function resetReadyAt(k: Keyring): number | null {
  return k.resetRequestedAt === undefined ? null : k.resetRequestedAt + DEVICE_RESET_WAIT_MS;
}

export async function completeDeviceReset(
  k: Keyring,
  deviceKey: CryptoKey,
  now: number,
): Promise<UnlockedDek | null> {
  const readyAt = resetReadyAt(k);
  if (readyAt === null || now < readyAt || !k.deviceReset) return null;
  return unwrap(deviceKey, k.deviceReset);
}

/**
 * The only wrap that may leave the device: the 128-bit recovery code. The passcode
 * wrap stays local — a short PIN could be brute-forced by whoever holds the backup.
 */
export function backupWraps(k: Keyring): Pick<Keyring, "recovery"> {
  return k.recovery ? { recovery: k.recovery } : {};
}

/** Builds a local keyring on a new device from restored wraps. */
export async function adoptBackupWraps(
  wraps: Pick<Keyring, "passcode" | "recovery">,
  dek: UnlockedDek,
  deviceKey: CryptoKey,
): Promise<Keyring> {
  const local = await encryptBytes(deviceKey, dek.raw);
  return {
    version: 1,
    ...wraps,
    ...(wraps.passcode ? { deviceReset: local } : { device: local }),
    autoLockMinutes: DEFAULT_AUTO_LOCK_MINUTES,
  };
}
