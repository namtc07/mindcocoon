"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect } from "react";

/** One drifting fragment of released text. Offsets are generated in the click handler, not during render. */
export interface DissolveToken {
  text: string;
  dx: number;
  dy: number;
  rotate: number;
  delay: number;
}

export interface DissolveEmber {
  left: number;
  top: number;
  size: number;
  dx: number;
  dy: number;
  delay: number;
}

export interface DissolvePlan {
  tokens: DissolveToken[];
  embers: DissolveEmber[];
}

const DRIFT_MS = 1100;
const STAGGER_MS = 1300;
const REDUCED_MS = 600;
const CHAR_LIMIT = 600;

/** User-perceived characters, so Vietnamese diacritics stay attached to their letter. */
function graphemes(text: string): string[] {
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
    return Array.from(segmenter.segment(text), (s) => s.segment);
  }
  return Array.from(text);
}

/**
 * Splits text into fragments (characters for short text, words for long text)
 * and assigns each a random drift. Fragments near the end leave first, so the
 * text appears to burn away from the bottom up.
 */
export function planDissolve(text: string, random: () => number = Math.random): DissolvePlan {
  const normalized = text.normalize("NFC");
  const parts = normalized.length <= CHAR_LIMIT ? graphemes(normalized) : normalized.split(/(\s+)/);
  const n = Math.max(parts.length, 1);
  const tokens = parts.map((part, i) => ({
    text: part,
    dx: (random() - 0.5) * 60,
    dy: -(40 + random() * 100),
    rotate: (random() - 0.5) * 40,
    delay: ((n - 1 - i) / n) * STAGGER_MS + random() * 250,
  }));
  const embers = Array.from({ length: Math.min(48, 12 + Math.floor(text.length / 20)) }, () => ({
    left: random() * 100,
    top: 30 + random() * 70,
    size: 2 + random() * 3,
    dx: (random() - 0.5) * 80,
    dy: -(120 + random() * 220),
    delay: random() * STAGGER_MS,
  }));
  return { tokens, embers };
}

export function DissolveOverlay({ plan, onDone }: { plan: DissolvePlan; onDone: () => void }) {
  const reduceMotion = useReducedMotion();
  const total = reduceMotion ? REDUCED_MS : STAGGER_MS + 250 + DRIFT_MS + 200;

  useEffect(() => {
    const id = window.setTimeout(onDone, total);
    return () => window.clearTimeout(id);
  }, [onDone, total]);

  if (reduceMotion) {
    return (
      <motion.p
        aria-hidden
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: REDUCED_MS / 1000 }}
        className="vent-type whitespace-pre-wrap"
      >
        {plan.tokens.map((t) => t.text).join("")}
      </motion.p>
    );
  }

  return (
    <div aria-hidden className="pointer-events-none relative">
      <p className="vent-type whitespace-pre-wrap">
        {plan.tokens.map((token, i) =>
          /^\s+$/.test(token.text) ? (
            token.text
          ) : (
            <motion.span
              key={i}
              className="inline-block"
              initial={{ opacity: 1, x: 0, y: 0, rotate: 0, filter: "blur(0px)", color: "var(--foreground)" }}
              animate={{
                opacity: 0,
                x: token.dx,
                y: token.dy,
                rotate: token.rotate,
                filter: "blur(6px)",
                color: "var(--ember)",
              }}
              transition={{ duration: DRIFT_MS / 1000, delay: token.delay / 1000, ease: [0.4, 0, 0.6, 1] }}
            >
              {token.text}
            </motion.span>
          ),
        )}
      </p>
      {plan.embers.map((ember, i) => (
        <motion.span
          key={`e${i}`}
          className="absolute rounded-full bg-ember"
          style={{ left: `${ember.left}%`, top: `${ember.top}%`, width: ember.size, height: ember.size }}
          initial={{ opacity: 0, x: 0, y: 0 }}
          animate={{ opacity: [0, 0.9, 0], x: ember.dx, y: ember.dy }}
          transition={{ duration: 1.6, delay: ember.delay / 1000, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}
