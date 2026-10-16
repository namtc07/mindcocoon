"use client";

import { useSyncExternalStore } from "react";

/**
 * Current time, refreshed every few seconds. Returns null during prerender and
 * hydration so date-dependent UI never mismatches between server and client.
 */
const BUCKET_MS = 5_000;
let cached: Date | null = null;

function getSnapshot() {
  const bucket = Math.floor(Date.now() / BUCKET_MS);
  if (!cached || Math.floor(cached.getTime() / BUCKET_MS) !== bucket) cached = new Date();
  return cached;
}

function subscribe(onChange: () => void) {
  const id = window.setInterval(onChange, BUCKET_MS);
  return () => window.clearInterval(id);
}

export function useNow(): Date | null {
  return useSyncExternalStore(subscribe, getSnapshot, () => null);
}
