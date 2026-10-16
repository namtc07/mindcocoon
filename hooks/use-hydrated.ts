"use client";

import { useSyncExternalStore } from "react";

const noop = () => () => {};

/** False during prerender and hydration, true afterwards. */
export function useHydrated() {
  return useSyncExternalStore(noop, () => true, () => false);
}
