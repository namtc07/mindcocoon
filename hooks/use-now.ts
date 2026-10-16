"use client";

import { useSyncExternalStore } from "react";

/**
 * Current time, refreshed every minute. Returns null during prerender / hydration
 * so date-dependent UI never mismatches between server and client.
 */
let cached: Date | null = null;

function getSnapshot() {
  const minute = Math.floor(Date.now() / 60_000);
  if (!cached || Math.floor(cached.getTime() / 60_000) !== minute) cached = new Date();
  return cached;
}

function subscribe(onChange: () => void) {
  const id = window.setInterval(onChange, 30_000);
  return () => window.clearInterval(id);
}

export function useNow(): Date | null {
  return useSyncExternalStore(subscribe, getSnapshot, () => null);
}
