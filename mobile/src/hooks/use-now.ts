import { useSyncExternalStore } from "react";

/** Current time, refreshed every 5 s (same contract as the web hook). */
const BUCKET_MS = 5_000;
let cached: Date | null = null;

function getSnapshot() {
  const bucket = Math.floor(Date.now() / BUCKET_MS);
  if (!cached || Math.floor(cached.getTime() / BUCKET_MS) !== bucket) cached = new Date();
  return cached;
}

function subscribe(onChange: () => void) {
  const id = setInterval(onChange, BUCKET_MS);
  return () => clearInterval(id);
}

export function useNow(): Date {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
