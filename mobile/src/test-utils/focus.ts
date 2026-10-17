/* eslint-disable @typescript-eslint/no-require-imports */
import { useEffect } from "react";

/**
 * Replaces the mocked useFocusEffect so a test can "leave the tab": blur() runs every
 * focus-effect cleanup, as expo-router does when another tab takes focus.
 */
export function captureFocusEffects() {
  const router = require("expo-router") as { useFocusEffect: (cb: () => void | (() => void)) => void };
  const original = router.useFocusEffect;
  const cleanups = new Set<() => void>();
  router.useFocusEffect = function useCapturedFocusEffect(cb) {
    useEffect(() => {
      const cleanup = cb();
      if (cleanup) cleanups.add(cleanup);
      return () => {
        if (cleanup) cleanups.delete(cleanup);
        cleanup?.();
      };
    }, [cb]);
  };
  return {
    blur() {
      cleanups.forEach((c) => c());
      cleanups.clear();
    },
    restore() {
      router.useFocusEffect = original;
    },
  };
}
