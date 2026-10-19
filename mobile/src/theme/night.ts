import { AppState } from "react-native";
import { isNightHour } from "./night-hours";

/**
 * Whether it's late night right now. Checked once a minute (and on returning to the app) by a
 * single shared timer, and listeners are told only when it flips — so themed screens don't
 * re-render all the time.
 */
const CHECK_MS = 60_000;
let night: boolean | null = null;
let timer: ReturnType<typeof setInterval> | null = null;
let appSub: { remove(): void } | null = null;
const listeners = new Set<() => void>();

function check() {
  const now = isNightHour(new Date());
  if (now !== night) {
    night = now;
    listeners.forEach((l) => l());
  }
}

export function isNightNow(): boolean {
  if (night === null) night = isNightHour(new Date());
  return night;
}

export function subscribeNight(listener: () => void) {
  listeners.add(listener);
  if (!timer) {
    timer = setInterval(check, CHECK_MS);
    appSub = AppState.addEventListener?.("change", (s) => {
      if (s === "active") check();
    }) ?? null;
  }
  return () => {
    listeners.delete(listener);
    if (!listeners.size && timer) {
      clearInterval(timer);
      timer = null;
      appSub?.remove();
      appSub = null;
    }
  };
}

export function __resetNightForTests() {
  night = null;
  if (timer) clearInterval(timer);
  timer = null;
  appSub?.remove?.();
  appSub = null;
}
