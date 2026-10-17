import type { Locale } from "@mindcocoon/core/i18n/config";
import { createKvDriver } from "./kv-driver";

/** Small persisted preferences (language, appearance), readable synchronously after loadPrefs(). */
export interface Prefs {
  locale?: Locale;
  theme?: "dusk" | "mist";
  /** Epoch ms the heavy-week nudge was last shown (at most once a week). */
  heavyNudgeAt?: number;
  firstRunSeen?: boolean;
  customTags?: string[];
}

const KEY = "prefs:v1";
const driver = createKvDriver();
let prefs: Prefs = {};
let loaded: Promise<void> | null = null;
const listeners = new Set<() => void>();

export function loadPrefs(): Promise<void> {
  loaded ??= driver.get<Prefs>(KEY).then((stored) => {
    prefs = { ...stored, ...prefs };
    listeners.forEach((l) => l());
  });
  return loaded;
}

export function getPref<K extends keyof Prefs>(key: K): Prefs[K] {
  return prefs[key];
}

export async function setPref<K extends keyof Prefs>(key: K, value: Prefs[K]) {
  prefs = { ...prefs, [key]: value };
  listeners.forEach((l) => l());
  await driver.set(KEY, prefs);
}

export function subscribePrefs(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Forgets every preference (used by "Erase everything"). */
export async function clearPrefs() {
  prefs = {};
  listeners.forEach((l) => l());
  await driver.del(KEY);
}
