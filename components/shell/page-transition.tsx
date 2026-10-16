"use client";

import { motion, useAnimationControls, useReducedMotion } from "framer-motion";
import { useLayoutEffect, type ReactNode } from "react";

/**
 * Fades a page in. The layout effect re-runs whenever Next.js reveals a page
 * kept alive in <Activity>, so returning to a route animates too.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const controls = useAnimationControls();
  const reduceMotion = useReducedMotion();

  useLayoutEffect(() => {
    controls.set(reduceMotion ? { opacity: 0 } : { opacity: 0, y: 6 });
    void controls.start({ opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } });
  }, [controls, reduceMotion]);

  return <motion.div animate={controls}>{children}</motion.div>;
}
