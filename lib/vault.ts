import {
  PBKDF2_ITERATIONS,
  checkVerifier,
  createVerifier,
  decryptString,
  deriveKeyFromPasscode,
  encryptString,
  generateDeviceKey,
  generateSalt,
  isCryptoAvailable,
} from "@/lib/crypto";
import { getStorage, newId } from "@/lib/storage";
import type {
  DecryptedJournalEntry,
  JournalEntry,
  JournalPayload,
  VaultLockMode,
  VaultMeta,
} from "@/types";

/**
 * Vault session: owns the in-memory key and decrypted entries.
 * The key never leaves memory in passcode mode and is dropped on lock.
 * Exposed as a tiny external store for useSyncExternalStore (see hooks/use-vault.ts).
 */

export type VaultStatus = "idle" | "loading" | "locked" | "unlocked" | "unsupported";

export interface VaultState {
  status: VaultStatus;
  mode: VaultLockMode;
  autoLockMinutes: number;
  entries: DecryptedJournalEntry[];
}

const DEFAULT_META: VaultMeta = { mode: "device", autoLockMinutes: 5 };

let state: VaultState = {
  status: "idle",
  mode: "device",
  autoLockMinutes: DEFAULT_META.autoLockMinutes,
  entries: [],
};
let key: CryptoKey | null = null;
let initPromise: Promise<void> | null = null;
const listeners = new Set<() => void>();

function setState(patch: Partial<VaultState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

export function subscribeVault(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getVaultState() {
  return state;
}

const SERVER_STATE: VaultState = { ...state };
export function getVaultServerState() {
  return SERVER_STATE;
}

async function decryptEntry(k: CryptoKey, entry: JournalEntry): Promise<DecryptedJournalEntry> {
  const { content, ...rest } = entry;
  if (!entry.isEncrypted) return { ...rest, body: content };
  const payload = JSON.parse(await decryptString(k, content)) as JournalPayload;
  return { ...rest, title: payload.title, body: payload.body };
}

async function encryptEntry(k: CryptoKey, entry: DecryptedJournalEntry): Promise<JournalEntry> {
  const { body, title, ...rest } = entry;
  const payload: JournalPayload = { title, body };
  return {
    ...rest,
    title: undefined,
    content: await encryptString(k, JSON.stringify(payload)),
    isEncrypted: true,
  };
}

async function loadEntries(k: CryptoKey) {
  const stored = await getStorage().journal.list();
  const entries = await Promise.all(stored.map((e) => decryptEntry(k, e)));
  setState({ entries, status: "unlocked" });
}

async function readMeta(): Promise<VaultMeta> {
  return (await getStorage().vaultKeys.getMeta()) ?? DEFAULT_META;
}

/** Idempotent. Device-mode vaults unlock automatically; passcode vaults stay locked. */
export function initVault(): Promise<void> {
  initPromise ??= (async () => {
    if (!isCryptoAvailable()) {
      setState({ status: "unsupported" });
      return;
    }
    setState({ status: "loading" });
    const storage = getStorage();
    const meta = await readMeta();
    setState({ mode: meta.mode, autoLockMinutes: meta.autoLockMinutes });

    if (meta.mode === "passcode") {
      setState({ status: "locked" });
      return;
    }
    let deviceKey = await storage.vaultKeys.getDeviceKey();
    if (!deviceKey) {
      deviceKey = await generateDeviceKey();
      await storage.vaultKeys.setDeviceKey(deviceKey);
      await storage.vaultKeys.setMeta(meta);
    }
    key = deviceKey;
    await loadEntries(deviceKey);
  })().catch((error) => {
    initPromise = null;
    setState({ status: "locked" });
    throw error;
  });
  return initPromise;
}

/** Returns false when the passcode is wrong. */
export async function unlockVault(passcode: string): Promise<boolean> {
  const meta = await readMeta();
  if (meta.mode !== "passcode" || !meta.salt || !meta.verifier) return false;
  const candidate = await deriveKeyFromPasscode(passcode, meta.salt, meta.iterations);
  if (!(await checkVerifier(candidate, meta.verifier))) return false;
  key = candidate;
  await loadEntries(candidate);
  markActivity();
  return true;
}

export function lockVault() {
  if (state.mode !== "passcode") return;
  key = null;
  setState({ status: "locked", entries: [] });
}

function requireKey(): CryptoKey {
  if (!key) throw new Error("Vault is locked");
  return key;
}

export async function saveVaultEntry(input: { title?: string; body: string }) {
  const k = requireKey();
  const now = new Date().toISOString();
  const entry: DecryptedJournalEntry = {
    id: newId(),
    title: input.title?.trim() || undefined,
    body: input.body,
    isEncrypted: true,
    createdAt: now,
    updatedAt: now,
  };
  await getStorage().journal.put(await encryptEntry(k, entry));
  setState({ entries: [entry, ...state.entries] });
  return entry;
}

export async function updateVaultEntry(id: string, input: { title?: string; body: string }) {
  const k = requireKey();
  const current = state.entries.find((e) => e.id === id);
  if (!current) return;
  const next: DecryptedJournalEntry = {
    ...current,
    title: input.title?.trim() || undefined,
    body: input.body,
    updatedAt: new Date().toISOString(),
  };
  await getStorage().journal.put(await encryptEntry(k, next));
  setState({ entries: state.entries.map((e) => (e.id === id ? next : e)) });
}

export async function deleteVaultEntry(id: string) {
  await getStorage().journal.remove(id);
  setState({ entries: state.entries.filter((e) => e.id !== id) });
}

/** Re-encrypts every entry with `nextKey`. Requires an unlocked vault. */
async function rekey(nextKey: CryptoKey) {
  const reencrypted = await Promise.all(state.entries.map((e) => encryptEntry(nextKey, e)));
  await getStorage().journal.replaceAll(reencrypted);
  key = nextKey;
}

/** Turns on (or changes) the passcode. The vault must be unlocked. */
export async function setVaultPasscode(passcode: string) {
  requireKey();
  const storage = getStorage();
  const salt = generateSalt();
  const nextKey = await deriveKeyFromPasscode(passcode, salt);
  await rekey(nextKey);
  const meta: VaultMeta = {
    mode: "passcode",
    salt,
    iterations: PBKDF2_ITERATIONS,
    verifier: await createVerifier(nextKey),
    autoLockMinutes: state.autoLockMinutes,
  };
  await storage.vaultKeys.setMeta(meta);
  await storage.vaultKeys.deleteDeviceKey();
  setState({ mode: "passcode" });
  markActivity();
}

/** Removes the passcode and falls back to a device key. The vault must be unlocked. */
export async function removeVaultPasscode() {
  requireKey();
  const storage = getStorage();
  const deviceKey = await generateDeviceKey();
  await rekey(deviceKey);
  await storage.vaultKeys.setDeviceKey(deviceKey);
  await storage.vaultKeys.setMeta({ mode: "device", autoLockMinutes: state.autoLockMinutes });
  setState({ mode: "device" });
}

export async function setVaultAutoLock(minutes: number) {
  const meta = await readMeta();
  await getStorage().vaultKeys.setMeta({ ...meta, autoLockMinutes: minutes });
  setState({ autoLockMinutes: minutes });
}

/** Deletes every entry and all key material. Irreversible. */
export async function wipeVault() {
  const storage = getStorage();
  await storage.journal.clear();
  await storage.vaultKeys.clear();
  key = null;
  initPromise = null;
  setState({ entries: [], mode: "device", autoLockMinutes: DEFAULT_META.autoLockMinutes });
  await initVault();
}

// --- Auto-lock ------------------------------------------------------------

let lastActivity = 0;
let hiddenAt: number | null = null;
let autoLockStarted = false;

function markActivity() {
  lastActivity = Date.now();
}

function shouldLock(since: number) {
  return (
    state.mode === "passcode" &&
    state.status === "unlocked" &&
    Date.now() - since > state.autoLockMinutes * 60_000
  );
}

/** Locks a passcode vault after inactivity or after the tab has been hidden too long. */
export function startVaultAutoLock() {
  if (autoLockStarted || typeof window === "undefined") return;
  autoLockStarted = true;
  markActivity();
  for (const evt of ["pointerdown", "keydown", "scroll"]) {
    window.addEventListener(evt, markActivity, { passive: true });
  }
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      hiddenAt = Date.now();
    } else if (hiddenAt !== null) {
      if (shouldLock(hiddenAt)) lockVault();
      hiddenAt = null;
    }
  });
  window.setInterval(() => {
    if (shouldLock(lastActivity)) lockVault();
  }, 30_000);
}
