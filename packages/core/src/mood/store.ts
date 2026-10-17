import { getStorage, newId } from "../storage/index";
import { decryptField, encryptField, getUnlockedDek } from "../vault/session";
import type { MoodLog, MoodType } from "../types";

/**
 * Shared, in-memory view of mood logs backed by the storage adapter.
 * Several screens stay mounted at once (Next.js keeps recent routes alive in
 * <Activity>), so they all read this one store instead of loading separately.
 * Notes are encrypted with the vault key; mood and tags stay readable so the
 * timeline works while the vault is locked.
 */

export interface MoodState {
  status: "idle" | "loading" | "ready";
  logs: MoodLog[];
}

const INITIAL_STATE: MoodState = { status: "idle", logs: [] };
let state: MoodState = INITIAL_STATE;
const listeners = new Set<() => void>();
const changeListeners = new Set<() => void>();

function setState(next: MoodState) {
  state = next;
  listeners.forEach((l) => l());
}

export function subscribeMoods(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Fires after any persisted change (used by cloud backup). */
export function onMoodChange(listener: () => void) {
  changeListeners.add(listener);
  return () => {
    changeListeners.delete(listener);
  };
}

export const getMoodState = () => state;
export const getMoodServerState = () => INITIAL_STATE;

export async function loadMoods(force = false) {
  if (state.status !== "idle" && !force) return;
  setState({ ...state, status: "loading" });
  const logs = await getStorage().moods.list();
  setState({ status: "ready", logs });
}

/** Rejects with VaultLockedError when a note is given and the vault is locked. */
export async function addMood(input: { mood: MoodType; tags: string[]; note?: string }) {
  const note = input.note?.trim();
  const log: MoodLog = {
    id: newId(),
    mood: input.mood,
    tags: input.tags,
    createdAt: new Date().toISOString(),
    ...(note ? { note: await encryptField(note), isNoteEncrypted: true } : {}),
  };
  await getStorage().moods.add(log);
  setState({ ...state, logs: [log, ...state.logs] });
  changeListeners.forEach((l) => l());
  return log;
}

/**
 * Changes the mood of a check-in, keeping its tags and (still encrypted) note.
 * Adds the new log before removing the old one so nothing is lost on failure.
 */
export async function changeMood(previous: MoodLog, mood: MoodType): Promise<MoodLog> {
  const log: MoodLog = { ...previous, id: newId(), mood, createdAt: new Date().toISOString() };
  await getStorage().moods.add(log);
  await getStorage().moods.remove(previous.id);
  setState({ ...state, logs: [log, ...state.logs.filter((l) => l.id !== previous.id)] });
  changeListeners.forEach((l) => l());
  return log;
}

/** Decrypted note, or null when there is none or the vault is locked. */
export async function readNote(log: MoodLog): Promise<string | null> {
  if (!log.note) return null;
  if (!log.isNoteEncrypted) return log.note;
  if (!getUnlockedDek()) return null;
  return decryptField(log.note);
}

export async function removeMood(id: string) {
  await getStorage().moods.remove(id);
  setState({ ...state, logs: state.logs.filter((l) => l.id !== id) });
  changeListeners.forEach((l) => l());
}

export async function clearMoods() {
  await getStorage().moods.clear();
  setState({ status: "ready", logs: [] });
  changeListeners.forEach((l) => l());
}

export function __resetMoodsForTests() {
  state = INITIAL_STATE;
}
