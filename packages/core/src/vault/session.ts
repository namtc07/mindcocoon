import { decryptString, encryptString, isCryptoAvailable } from "../crypto";
import { getStorage, newId } from "../storage/index";
import * as keyring from "./keyring";
import type {
  DecryptedJournalEntry,
  JournalEntry,
  JournalPayload,
  Keyring,
  UnlockedDek,
} from "../types";

/**
 * Vault session: owns the unlocked data key and the decrypted entries in memory.
 * Exposed as an external store for useSyncExternalStore (hooks/use-vault.ts).
 */

export type VaultStatus = "idle" | "loading" | "locked" | "unlocked" | "unsupported";

export interface VaultState {
  status: VaultStatus;
  hasPasscode: boolean;
  hasRecoveryCode: boolean;
  resetReadyAt: number | null;
  autoLockMinutes: number;
  entries: DecryptedJournalEntry[];
}

export class VaultLockedError extends Error {
  constructor() {
    super("Vault is locked");
    this.name = "VaultLockedError";
  }
}

const INITIAL_STATE: VaultState = {
  status: "idle",
  hasPasscode: false,
  hasRecoveryCode: false,
  resetReadyAt: null,
  autoLockMinutes: keyring.DEFAULT_AUTO_LOCK_MINUTES,
  entries: [],
};

let state: VaultState = INITIAL_STATE;
let ring: Keyring | null = null;
let deviceKey: CryptoKey | null = null;
let dek: UnlockedDek | null = null;
let initPromise: Promise<void> | null = null;
let generation = 0;
const listeners = new Set<() => void>();
const changeListeners = new Set<() => void>();

function setState(patch: Partial<VaultState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

function emitChange() {
  changeListeners.forEach((l) => l());
}

export function subscribeVault(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export const getVaultState = () => state;
export const getVaultServerState = () => INITIAL_STATE;

/** Fires after any change that alters what is persisted (entries or key wraps). */
export function onVaultChange(listener: () => void) {
  changeListeners.add(listener);
  return () => {
    changeListeners.delete(listener);
  };
}

export function getUnlockedDek(): UnlockedDek | null {
  return dek;
}

function requireDek(): UnlockedDek {
  if (!dek) throw new VaultLockedError();
  return dek;
}

async function saveRing(next: Keyring) {
  ring = next;
  await getStorage().vaultKeys.setKeyring(next);
  setState({
    hasPasscode: Boolean(next.passcode),
    hasRecoveryCode: Boolean(next.recovery),
    resetReadyAt: keyring.resetReadyAt(next),
    autoLockMinutes: next.autoLockMinutes,
  });
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

async function openWith(unlocked: UnlockedDek, gen = generation) {
  const stored = await getStorage().journal.list();
  const entries = await Promise.all(stored.map((e) => decryptEntry(unlocked.key, e)));
  if (gen !== generation) return;
  dek = unlocked;
  setState({ entries, status: "unlocked" });
}

/** Idempotent. A vault without a passcode unlocks on its own. */
export function initVault(): Promise<void> {
  initPromise ??= (async () => {
    // A reset (wipe, restore, tests) bumps the generation; an overtaken init must not
    // write its keys or entries over the newer state.
    const gen = generation;
    const stale = () => gen !== generation;
    if (!isCryptoAvailable()) {
      setState({ status: "unsupported" });
      return;
    }
    setState({ status: "loading" });
    const storage = getStorage();
    const key = await storage.vaultKeys.getOrCreateDeviceKey();
    if (stale()) return;
    deviceKey = key;

    const existing = await storage.vaultKeys.getKeyring();
    if (stale()) return;
    if (!existing) {
      const created = await keyring.createKeyring(key);
      if (stale()) return;
      await saveRing(created.keyring);
      await openWith(created.dek, gen);
      return;
    }
    await saveRing(existing);
    const unlocked = await keyring.unlockWithDevice(existing, key);
    if (stale()) return;
    if (unlocked) await openWith(unlocked, gen);
    else setState({ status: "locked" });
  })().catch((error) => {
    initPromise = null;
    setState({ status: "locked" });
    throw error;
  });
  return initPromise;
}

/**
 * After unlocking by another route, make sure this device can open the vault on its own
 * again: if the device key no longer opens its wrap (phone restored without its Keychain /
 * Keystore item), persist a new device key and re-wrap the data key with it.
 */
async function repairDeviceWrap(unlocked: UnlockedDek) {
  const current = requireRing();
  if (deviceKey && (await keyring.deviceWrapOpens(current, deviceKey))) return;
  deviceKey = await getStorage().vaultKeys.replaceDeviceKey();
  await saveRing(await keyring.rewrapForDevice(current, unlocked, deviceKey));
}

async function tryUnlock(attempt: Promise<UnlockedDek | null>) {
  const unlocked = await attempt;
  if (!unlocked) return false;
  await repairDeviceWrap(unlocked);
  await openWith(unlocked);
  return true;
}

export async function unlockWithPasscode(passcode: string) {
  return ring ? tryUnlock(keyring.unlockWithPasscode(ring, passcode)) : false;
}

export async function unlockWithRecoveryCode(code: string) {
  return ring ? tryUnlock(keyring.unlockWithRecoveryCode(ring, code)) : false;
}

export async function unlockWithServerSecret(secret: string) {
  return ring ? tryUnlock(keyring.unlockWithServerSecret(ring, secret)) : false;
}

export function lockVault() {
  if (!state.hasPasscode) return;
  dek = null;
  setState({ status: "locked", entries: [] });
}

export async function saveVaultEntry(input: { title?: string; body: string }) {
  const { key } = requireDek();
  const now = new Date().toISOString();
  const entry: DecryptedJournalEntry = {
    id: newId(),
    title: input.title?.trim() || undefined,
    body: input.body,
    isEncrypted: true,
    createdAt: now,
    updatedAt: now,
  };
  await getStorage().journal.put(await encryptEntry(key, entry));
  setState({ entries: [entry, ...state.entries] });
  emitChange();
  return entry;
}

export async function updateVaultEntry(id: string, input: { title?: string; body: string }) {
  const { key } = requireDek();
  const current = state.entries.find((e) => e.id === id);
  if (!current) return;
  const next: DecryptedJournalEntry = {
    ...current,
    title: input.title?.trim() || undefined,
    body: input.body,
    updatedAt: new Date().toISOString(),
  };
  await getStorage().journal.put(await encryptEntry(key, next));
  setState({ entries: state.entries.map((e) => (e.id === id ? next : e)) });
  emitChange();
}

export async function deleteVaultEntry(id: string) {
  await getStorage().journal.remove(id);
  setState({ entries: state.entries.filter((e) => e.id !== id) });
  emitChange();
}

function requireRing(): Keyring {
  if (!ring || !deviceKey) throw new Error("Vault is not initialised");
  return ring;
}

/** Sets or changes the passcode. Creates a recovery code the first time. */
export async function setVaultPasscode(passcode: string): Promise<{ recoveryCode: string | null }> {
  const unlocked = requireDek();
  let next = requireRing();
  let recoveryCode: string | null = null;
  if (!next.recovery) {
    const withCode = await keyring.setRecoveryCode(next, unlocked);
    next = withCode.keyring;
    recoveryCode = withCode.code;
  }
  await saveRing(await keyring.setPasscode(next, unlocked, passcode, deviceKey!));
  emitChange();
  return { recoveryCode };
}

export async function removeVaultPasscode() {
  const unlocked = requireDek();
  await saveRing(await keyring.removePasscode(requireRing(), unlocked, deviceKey!));
  emitChange();
}

export async function regenerateRecoveryCode(): Promise<string> {
  const { keyring: next, code } = await keyring.setRecoveryCode(requireRing(), requireDek());
  await saveRing(next);
  emitChange();
  return code;
}

/** Ensures a recovery code exists (needed before the first cloud backup). */
export async function ensureRecoveryCode(): Promise<string | null> {
  return requireRing().recovery ? null : regenerateRecoveryCode();
}

export async function requestPasscodeReset() {
  await saveRing(keyring.requestDeviceReset(requireRing(), Date.now()));
}

/** Completes the 1-hour same-device reset. Returns false while the wait is not over. */
export async function completePasscodeReset(newPasscode: string): Promise<boolean> {
  const current = requireRing();
  const unlocked = await keyring.completeDeviceReset(current, deviceKey!, Date.now());
  if (!unlocked) return false;
  await saveRing(await keyring.setPasscode(current, unlocked, newPasscode, deviceKey!));
  await openWith(unlocked);
  emitChange();
  return true;
}

/** True when the recovery code opens this vault. Does not unlock the session. */
export async function checkRecoveryCode(code: string) {
  return ring ? (await keyring.unlockWithRecoveryCode(ring, code)) !== null : false;
}

/** True when the server secret opens this vault. Does not unlock the session. */
export async function checkServerSecret(secret: string) {
  return ring ? (await keyring.unlockWithServerSecret(ring, secret)) !== null : false;
}

async function resetWith(attempt: Promise<UnlockedDek | null>, newPasscode: string) {
  const unlocked = await attempt;
  if (!unlocked) return false;
  await repairDeviceWrap(unlocked);
  await saveRing(await keyring.setPasscode(requireRing(), unlocked, newPasscode, deviceKey!));
  await openWith(unlocked);
  emitChange();
  return true;
}

/**
 * Forgot-passcode resets: the new passcode is written first, and only then does the
 * vault open — so the person never ends up unlocked but still stuck with the old one.
 */
export function resetPasscodeWithRecoveryCode(code: string, newPasscode: string) {
  return resetWith(keyring.unlockWithRecoveryCode(requireRing(), code), newPasscode);
}

export function resetPasscodeWithServerSecret(secret: string, newPasscode: string) {
  return resetWith(keyring.unlockWithServerSecret(requireRing(), secret), newPasscode);
}

/** Sets a new passcode while unlocked by another route (recovery code, server secret). */
export async function replacePasscode(newPasscode: string) {
  await saveRing(await keyring.setPasscode(requireRing(), requireDek(), newPasscode, deviceKey!));
  emitChange();
}

/** Stores the local-only server wrap so a signed-in user can reset a forgotten passcode. */
export async function attachServerSecret(secret: string) {
  await saveRing(await keyring.setServerWrap(requireRing(), requireDek(), secret));
}

export function getBackupWraps() {
  return keyring.backupWraps(requireRing());
}

export async function setVaultAutoLock(minutes: number) {
  await saveRing({ ...requireRing(), autoLockMinutes: minutes });
}

export async function encryptField(text: string): Promise<string> {
  return encryptString(requireDek().key, text);
}

export async function decryptField(envelope: string): Promise<string> {
  return decryptString(requireDek().key, envelope);
}

/** Re-reads keyring and entries from storage (after a restore replaced them). */
export async function reloadVault() {
  dek = null;
  ring = null;
  initPromise = null;
  await initVault();
}

/** Deletes every entry and all key material. Irreversible. */
export async function wipeVault() {
  const storage = getStorage();
  await storage.journal.clear();
  await storage.vaultKeys.clear();
  __resetVaultForTests();
  await initVault();
  emitChange();
}

/** Clears module state. Tests use it to simulate a fresh page load. */
export function __resetVaultForTests() {
  generation++;
  state = INITIAL_STATE;
  ring = null;
  deviceKey = null;
  dek = null;
  initPromise = null;
}

// --- Auto-lock (pure; platforms wire their own activity and visibility events) ------

/** True when a passcode vault has been idle (or hidden) longer than its auto-lock limit. */
export function isIdleTooLong(
  since: number,
  now: number,
  s: Pick<VaultState, "hasPasscode" | "status" | "autoLockMinutes">,
): boolean {
  return s.hasPasscode && s.status === "unlocked" && now - since > s.autoLockMinutes * 60_000;
}
