/**
 * Client-side encryption for the Private Vault (Web Crypto, AES-GCM 256).
 *
 * - Device mode: a random, non-extractable key stored in IndexedDB.
 * - Passcode mode: key derived with PBKDF2-SHA256; nothing about the passcode is stored.
 *
 * Envelope format: `v1.<base64 iv>.<base64 ciphertext>`.
 */

export const PBKDF2_ITERATIONS = 310_000;
const ENVELOPE_VERSION = "v1";
const VERIFIER_PLAINTEXT = "mindcocoon:vault:ok";

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export function isCryptoAvailable(): boolean {
  return typeof crypto !== "undefined" && typeof crypto.subtle !== "undefined";
}

export function generateDeviceKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, false, [
    "encrypt",
    "decrypt",
  ]);
}

export function generateSalt(): string {
  return toBase64(crypto.getRandomValues(new Uint8Array(16)));
}

export async function deriveKeyFromPasscode(
  passcode: string,
  salt: string,
  iterations = PBKDF2_ITERATIONS,
): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(passcode),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: fromBase64(salt), iterations, hash: "SHA-256" },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function encryptString(key: CryptoKey, plaintext: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(plaintext),
  );
  return [ENVELOPE_VERSION, toBase64(iv), toBase64(new Uint8Array(ciphertext))].join(".");
}

export async function decryptString(key: CryptoKey, envelope: string): Promise<string> {
  const [version, iv, data] = envelope.split(".");
  if (version !== ENVELOPE_VERSION || !iv || !data) {
    throw new Error("Unrecognized encrypted envelope");
  }
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromBase64(iv) },
    key,
    fromBase64(data),
  );
  return new TextDecoder().decode(plaintext);
}

export function createVerifier(key: CryptoKey): Promise<string> {
  return encryptString(key, VERIFIER_PLAINTEXT);
}

/** Resolves true only if `key` can decrypt the verifier (i.e. the passcode is right). */
export async function checkVerifier(key: CryptoKey, verifier: string): Promise<boolean> {
  try {
    return (await decryptString(key, verifier)) === VERIFIER_PLAINTEXT;
  } catch {
    return false;
  }
}
