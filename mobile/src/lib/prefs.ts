import type { SavedMix } from "@mindcocoon/core/audio/mixes";
import type { BreathPatternId } from "@mindcocoon/core/breathing";
import type { Locale } from "@mindcocoon/core/i18n/config";
import type { AudioPrefs } from "./audio/engine";
import { createKvDriver } from "./kv-driver";
import type { CachedFlags } from "./remote-config-core";

/** Small persisted preferences (language, appearance), readable synchronously after loadPrefs(). */
export interface Prefs {
  locale?: Locale;
  theme?: "dusk" | "mist";
  /** Epoch ms the heavy-week nudge was last shown (at most once a week). */
  heavyNudgeAt?: number;
  firstRunSeen?: boolean;
  customTags?: string[];
  /** Sanctuary mixer volumes and loop. */
  audio?: AudioPrefs;
  /** Last remote flags fetched from app_config. */
  flags?: CachedFlags;
  /** Premium sound id → epoch ms when its rewarded unlock ends. */
  unlocks?: Record<string, number>;
  /** Evening reminder hour, or null/undefined when off. */
  reminder?: { hour: 21 | 22 | 23 } | null;
  /** Face ID / fingerprint vault unlock is on (the gated Keychain item can't be probed without a prompt). */
  biometric?: true;
  /** Last breathing rhythm and length chosen. */
  breathing?: { pattern: BreathPatternId; minutes: 1 | 3 | 5 };
  /** Sound mixes the person saved (at most 5). */
  mixes?: SavedMix[];
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
