/* eslint-disable @typescript-eslint/no-require-imports */
import { useEffect } from "react";

/**
 * Replaces the mocked useFocusEffect so a test can "leave the tab": blur() runs every
 * focus-effect cleanup, as expo-router does when another tab takes focus; focus() runs them again.
 */
export function captureFocusEffects() {
  const router = require("expo-router") as { useFocusEffect: (cb: () => void | (() => void)) => void };
  const original = router.useFocusEffect;
  const cleanups = new Set<() => void>();
  const callbacks = new Set<() => void | (() => void)>();
  router.useFocusEffect = function useCapturedFocusEffect(cb) {
    useEffect(() => {
      callbacks.add(cb);
      const cleanup = cb();
      if (cleanup) cleanups.add(cleanup);
      return () => {
        callbacks.delete(cb);
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
    /** The tab takes focus again: every focus effect runs once more. */
    focus() {
      callbacks.forEach((cb) => {
        const cleanup = cb();
        if (cleanup) cleanups.add(cleanup);
      });
    },
    restore() {
      router.useFocusEffect = original;
    },
  };
}
