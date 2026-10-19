import { decryptField, encryptField } from "@mindcocoon/core/vault/session";
import { useEffect, useSyncExternalStore } from "react";
import { createKvDriver } from "./kv-driver";

/**
 * The worry box: a worry set down tonight rests (encrypted, `v1.`) until the next morning, when
 * the person decides to let it go, keep it in the vault, or keep it another day.
 */

export interface StoredWorry {
  id: string;
  /** Encrypted with the vault's data key. */
  text: string;
  createdAt: string;
  /** ISO time from which it can be read again (next 06:00). */
  openAt: string;
}

const KEY = "worries:v1";
const MORNING_HOUR = 6;
const driver = createKvDriver();
let cache: StoredWorry[] | null = null;
const EMPTY: StoredWorry[] = [];
const listeners = new Set<() => void>();

/** 06:00 the same night if it's before six, otherwise 06:00 the next day. */
export function nextMorning(now: Date): Date {
  const morning = new Date(now.getFullYear(), now.getMonth(), now.getDate(), MORNING_HOUR, 0);
  if (now.getHours() >= MORNING_HOUR) morning.setDate(morning.getDate() + 1);
  return morning;
}

async function save(list: StoredWorry[]) {
  cache = list;
  await driver.set(KEY, list);
  listeners.forEach((l) => l());
}

export async function getWorries(): Promise<StoredWorry[]> {
  cache ??= (await driver.get<StoredWorry[]>(KEY)) ?? [];
  return cache;
}

/** Throws VaultLockedError when a passcode vault is locked (the text can't be encrypted). */
export async function addWorry(text: string, now = new Date()) {
  const worry: StoredWorry = {
    id: `${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
    text: await encryptField(text.trim()),
    createdAt: now.toISOString(),
    openAt: nextMorning(now).toISOString(),
  };
  await save([...(await getWorries()), worry]);
}

export function isReady(worry: StoredWorry, now: Date) {
  return new Date(worry.openAt).getTime() <= now.getTime();
}

export async function readWorry(id: string): Promise<string> {
  const worry = (await getWorries()).find((w) => w.id === id);
  if (!worry) throw new Error("No such worry");
  return decryptField(worry.text);
}

export async function removeWorry(id: string) {
  await save((await getWorries()).filter((w) => w.id !== id));
}

export async function keepAnotherDay(id: string, now = new Date()) {
  const openAt = nextMorning(now).toISOString();
  await save((await getWorries()).map((w) => (w.id === id ? { ...w, openAt } : w)));
}

export async function clearWorries() {
  cache = [];
  await driver.del(KEY);
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** The stored worries (loaded on first use). */
export function useWorries(): StoredWorry[] {
  const list = useSyncExternalStore(subscribe, () => cache ?? EMPTY, () => EMPTY);
  useEffect(() => {
    if (cache === null) void getWorries().then(() => listeners.forEach((l) => l()));
  }, []);
  return list;
}

export async function __resetWorriesForTests() {
  await clearWorries();
  cache = null;
}
