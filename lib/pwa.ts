/** Installability and storage-persistence helpers. */

const DAY_MS = 86_400_000;
const HINT_EVERY_MS = 14 * DAY_MS;
const VISITS_KEY = "mc:visits";
const HINT_KEY = "mc:install-hint-at";
const PERSIST_KEY = "mc:persisted";

export interface InstallHintState {
  isIOS: boolean;
  standalone: boolean;
  visits: number;
  lastShownAt: number | null;
  path: string;
}

/** iOS Safari has no install prompt, so we explain "Add to Home Screen" — gently, rarely. */
export function shouldShowInstallHint(now: number, s: InstallHintState): boolean {
  if (!s.isIOS || s.standalone || s.visits < 2) return false;
  if (s.path.startsWith("/vent")) return false;
  return s.lastShownAt === null || now - s.lastShownAt >= HINT_EVERY_MS;
}

export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const nav = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia?.("(display-mode: standalone)").matches || nav.standalone === true;
}

export function isIOSSafari(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const iOS = /iPad|iPhone|iPod/.test(ua) || (ua.includes("Macintosh") && navigator.maxTouchPoints > 1);
  return iOS && /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
}

function readNumber(key: string): number | null {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? null : Number(raw);
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage blocked.
  }
}

/** Counts one visit per page load and returns the hint state for this device. */
export function recordVisit(path: string): InstallHintState {
  const visits = (readNumber(VISITS_KEY) ?? 0) + 1;
  write(VISITS_KEY, String(visits));
  return { isIOS: isIOSSafari(), standalone: isStandalone(), visits, lastShownAt: readNumber(HINT_KEY), path };
}

export function markInstallHintShown(now: number) {
  write(HINT_KEY, String(now));
}

/** Asks the browser not to evict our data (Safari wipes idle sites otherwise). Asked once. */
export async function requestPersistentStorage(): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.storage?.persist) return false;
  if (readNumber(PERSIST_KEY) !== null) return readNumber(PERSIST_KEY) === 1;
  const granted = await navigator.storage.persist().catch(() => false);
  write(PERSIST_KEY, granted ? "1" : "0");
  return granted;
}

// --- Install hint visibility (shown inline on Today, never as an overlay) ---------

let hintVisible = false;
const hintListeners = new Set<() => void>();

export function setInstallHintVisible(visible: boolean) {
  hintVisible = visible;
  hintListeners.forEach((l) => l());
}

export const getInstallHintVisible = () => hintVisible;

export function subscribeInstallHint(listener: () => void) {
  hintListeners.add(listener);
  return () => {
    hintListeners.delete(listener);
  };
}
