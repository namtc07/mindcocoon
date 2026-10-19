import type { SavedMix } from "@mindcocoon/core/audio/mixes";
import type { BreathPatternId } from "@mindcocoon/core/breathing";
import type { Locale } from "@mindcocoon/core/i18n/config";
import type { OnboardingIntent } from "@mindcocoon/core/onboarding";
import type { AudioPrefs } from "./audio/engine";
import { createKvDriver } from "./kv-driver";
import type { PlanId } from "./purchases/plan";
import type { CachedFlags } from "./remote-config-core";
import type { CachedContent } from "./remote-content-core";

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
  /** How Vent lets words go: "burn" | "float" | "scatter" | "fade". */
  ritual?: "burn" | "float" | "scatter" | "fade";
  /** Day key on which "Not now" hid the suggestion card. */
  suggestHiddenOn?: string;
  /** Play a short sound when letting go in Vent (on unless set to false). */
  releaseSound?: boolean;
  /** Softer "midnight" colours from 22:00 to 06:00 (on unless set to false). */
  nightDim?: boolean;
  /** Tone + light vibration at each breathing phase (on unless set to false). */
  breathCues?: boolean;
  /** Why the person came (welcome screens); only reorders Today. */
  intents?: OnboardingIntent[];
  /** Writing ideas card on Today (on unless set to false). */
  writingPrompts?: boolean;
  /** Extra mix slots earned with rewarded ads (0–5, on top of the five). */
  extraMixSlots?: number;
  /** Epoch ms until which no banner or native ad shows (earned with one rewarded ad). */
  adFreeUntil?: number;
  /** Spoken guidance for breathing and practices (off unless set to true). */
  voiceGuide?: boolean;
  /** MindCocoon Pro: which plan, since when (set by a purchase or restore). */
  pro?: { plan: PlanId; since: number };
  /** Development only: plans "bought" in the test store, so Restore can find them. */
  testPurchases?: PlanId[];
  /** Kén's Sunday letter (on unless set to false). */
  weeklyLetter?: boolean;
  /** The Sunday (day key) whose letter was read. */
  letterReadOn?: string;
  /** Writing ideas, stories and practices published after this version (from Supabase). */
  remoteContent?: CachedContent;
  /** Day key on which Kén last brought back a light moment (at most once a day). */
  momentShownOn?: string;
  /** Which part of Sanctuary was open last. */
  sanctuaryTab?: "sounds" | "breathe" | "practices";
  /** Optional name for the greeting (device only). */
  name?: string;
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
