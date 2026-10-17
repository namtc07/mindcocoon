import { generateMnemonic, validateMnemonic } from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english.js";

/**
 * Client-side encryption primitives (Web Crypto, AES-GCM 256, PBKDF2-SHA256).
 * Envelope format: `v1.<base64 iv>.<base64 ciphertext>`.
 */

export const PBKDF2_ITERATIONS = 310_000;
const ENVELOPE_VERSION = "v1";

export function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

export function fromBase64(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export function isCryptoAvailable(): boolean {
  return typeof crypto !== "undefined" && typeof crypto.subtle !== "undefined";
}

export function randomBytes(length: number): Uint8Array<ArrayBuffer> {
  return crypto.getRandomValues(new Uint8Array(length));
}

/** Random, non-extractable key kept in IndexedDB to wrap the data key on this device. */
export function generateDeviceKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, false, [
    "encrypt",
    "decrypt",
  ]);
}

/** Imports raw data-key bytes as a non-extractable AES-GCM key. */
export function importDek(raw: Uint8Array<ArrayBuffer>): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", raw, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

export function generateSalt(): string {
  return toBase64(randomBytes(16));
}

export async function deriveKeyFromSecret(
  secret: string,
  salt: string,
  iterations: number,
): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
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

export async function encryptBytes(key: CryptoKey, bytes: Uint8Array<ArrayBuffer>): Promise<string> {
  const iv = randomBytes(12);
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, bytes);
  return [ENVELOPE_VERSION, toBase64(iv), toBase64(new Uint8Array(ciphertext))].join(".");
}

export async function decryptBytes(key: CryptoKey, envelope: string): Promise<Uint8Array<ArrayBuffer>> {
  const [version, iv, data] = envelope.split(".");
  if (version !== ENVELOPE_VERSION || !iv || !data) {
    throw new Error("Unrecognized encrypted envelope");
  }
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromBase64(iv) },
    key,
    fromBase64(data),
  );
  return new Uint8Array(plaintext);
}

export function encryptString(key: CryptoKey, plaintext: string): Promise<string> {
  return encryptBytes(key, new TextEncoder().encode(plaintext));
}

export async function decryptString(key: CryptoKey, envelope: string): Promise<string> {
  return new TextDecoder().decode(await decryptBytes(key, envelope));
}

export function isEnvelope(value: string): boolean {
  return value.startsWith(`${ENVELOPE_VERSION}.`);
}

// --- Recovery codes (12 BIP39 English words, 128 bits) ---------------------

export function generateRecoveryCode(): string {
  return generateMnemonic(wordlist, 128);
}

export function normalizeRecoveryCode(input: string): string {
  return input
    .toLowerCase()
    .replace(/[\s\-_,.]+/g, " ")
    .trim();
}

export function isValidRecoveryCode(input: string): boolean {
  return validateMnemonic(normalizeRecoveryCode(input), wordlist);
}
