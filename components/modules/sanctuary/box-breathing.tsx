"use client";

import { useReducedMotion } from "framer-motion";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useI18n } from "@/components/providers/i18n-provider";
import { Button } from "@/components/ui/button";
import { breathAt, type BreathPhase } from "@/lib/breathing";

const SIZE = 220;
const PAD = 20;
const SIDE = SIZE - PAD * 2;

/** Dot position along the square: up the left on inhale, across the top on hold, down the right on exhale, back along the bottom. */
function dotPosition(phase: BreathPhase, progress: number) {
  const p = progress;
  switch (phase) {
    case "inhale":
      return { x: PAD, y: PAD + SIDE * (1 - p) };
    case "hold-in":
      return { x: PAD + SIDE * p, y: PAD };
    case "exhale":
      return { x: PAD + SIDE, y: PAD + SIDE * p };
    case "hold-out":
      return { x: PAD + SIDE * (1 - p), y: PAD + SIDE };
  }
}

function innerScale(phase: BreathPhase, progress: number) {
  if (phase === "inhale") return 0.6 + 0.4 * progress;
  if (phase === "hold-in") return 1;
  if (phase === "exhale") return 1 - 0.4 * progress;
  return 0.6;
}

export function BoxBreathing() {
  const { t } = useI18n();
  const reduceMotion = useReducedMotion();
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const frame = useRef<number | null>(null);

  // Next.js hides this page with <Activity> on navigation: stop and reset rather than resume mid-breath.
  useLayoutEffect(() => {
    return () => {
      setStartedAt(null);
      setElapsed(0);
    };
  }, []);

  useEffect(() => {
    if (startedAt === null) return;
    const tick = () => {
      setElapsed(performance.now() - startedAt);
      frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, [startedAt]);

  const running = startedAt !== null;
  const state = breathAt(elapsed);
  const finished = running && state.done;
  const phaseLabel: Record<BreathPhase, string> = {
    inhale: t.sanctuary.inhale,
    "hold-in": t.sanctuary.holdIn,
    exhale: t.sanctuary.exhale,
    "hold-out": t.sanctuary.holdOut,
  };
  const scale = running && !finished ? innerScale(state.phase, state.progress) : 0.6;
  const dot = dotPosition(state.phase, state.progress);
  const innerSide = SIDE * 0.62 * scale;

  return (
    <section id="breathe" aria-labelledby="breathe-title" className="space-y-6 scroll-mt-24">
      <div>
        <h2 id="breathe-title" className="font-serif text-2xl">
          {t.sanctuary.breatheTitle}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{t.sanctuary.breatheIntro}</p>
      </div>

      <div className="flex flex-col items-center gap-6 rounded-2xl bg-surface/60 px-6 py-8 sm:flex-row sm:items-center sm:gap-10">
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden className="shrink-0">
          <rect x={PAD} y={PAD} width={SIDE} height={SIDE} rx={18} fill="none" stroke="var(--border)" strokeWidth={2} />
          <rect
            x={SIZE / 2 - innerSide / 2}
            y={SIZE / 2 - innerSide / 2}
            width={innerSide}
            height={innerSide}
            rx={14}
            fill="var(--primary)"
            opacity={running && !finished ? 0.28 + 0.2 * scale : 0.18}
          />
          {running && !finished && !reduceMotion && <circle cx={dot.x} cy={dot.y} r={7} fill="var(--primary)" />}
        </svg>

        <div className="min-w-0 flex-1 space-y-4 text-center sm:text-left" aria-live="polite">
          {finished ? (
            <p className="font-serif text-xl">{t.sanctuary.done}</p>
          ) : running ? (
            <>
              <p className="font-serif text-3xl">{phaseLabel[state.phase]}</p>
              <p className="text-4xl text-muted-foreground tabular-nums" aria-hidden>
                {state.secondsLeft}
              </p>
            </>
          ) : null}
          <Button
            size="lg"
            variant={running && !finished ? "ghost" : "default"}
            className="rounded-full"
            onClick={() => {
              if (running && !finished) {
                setStartedAt(null);
                setElapsed(0);
              } else {
                setElapsed(0);
                setStartedAt(performance.now());
              }
            }}
          >
            {running && !finished ? t.sanctuary.stop : finished ? t.sanctuary.again : t.sanctuary.start}
          </Button>
        </div>
      </div>
    </section>
  );
}
