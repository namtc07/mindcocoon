/**
 * Anonymous open counts (Task 18 adds the sending side).
 * Preference: on by default, stored locally, exposed as an external store.
 */

const ENABLED_KEY = "mc:analytics";
const listeners = new Set<() => void>();

export function isAnalyticsEnabled(): boolean {
  try {
    return localStorage.getItem(ENABLED_KEY) !== "off";
  } catch {
    return true;
  }
}

export function setAnalyticsEnabled(on: boolean) {
  try {
    localStorage.setItem(ENABLED_KEY, on ? "on" : "off");
  } catch {
    // Storage blocked: nothing is sent without storage anyway.
  }
  listeners.forEach((l) => l());
}

export function subscribeAnalyticsPref(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
