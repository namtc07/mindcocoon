/** Backup is on by default after sign-in; people can turn it off (spec §6.1). */

const KEY = "mc:backup";
const listeners = new Set<() => void>();

export function isBackupEnabled(): boolean {
  try {
    return localStorage.getItem(KEY) !== "off";
  } catch {
    return true;
  }
}

export function setBackupEnabled(on: boolean) {
  try {
    localStorage.setItem(KEY, on ? "on" : "off");
  } catch {
    // Storage blocked: the choice applies to this session only.
  }
  listeners.forEach((l) => l());
}

export function subscribeBackupPref(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
