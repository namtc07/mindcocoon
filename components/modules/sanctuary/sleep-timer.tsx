"use client";

import { useState } from "react";
import { useI18n } from "@/components/providers/i18n-provider";
import { useAudio } from "@/hooks/use-audio";
import { useNow } from "@/hooks/use-now";
import { setSleepTimer, type SleepMinutes } from "@/lib/audio/engine";
import { cn } from "@/lib/utils";

const OPTIONS: SleepMinutes[] = [10, 20, 30, 60];

export function SleepTimer() {
  const { t } = useI18n();
  const { sleepEndsAt } = useAudio();
  const now = useNow();
  const [chosen, setChosen] = useState<SleepMinutes | null>(null);
  const active = sleepEndsAt === null ? null : chosen;

  return (
    <fieldset className="space-y-3">
      <legend className="mb-3 text-sm text-muted-foreground">{t.sanctuary.sleepTimer}</legend>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          aria-pressed={sleepEndsAt === null}
          onClick={() => {
            setChosen(null);
            setSleepTimer(null);
          }}
          className={chip(sleepEndsAt === null)}
        >
          {t.sanctuary.sleepOff}
        </button>
        {OPTIONS.map((n) => (
          <button
            key={n}
            type="button"
            aria-pressed={active === n}
            onClick={() => {
              setChosen(n);
              setSleepTimer(n);
            }}
            className={chip(active === n)}
          >
            {t.sanctuary.minutes.replace("{n}", String(n))}
          </button>
        ))}
      </div>
      {sleepEndsAt !== null && now && (
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {t.sanctuary.sleepIn.replace(
            "{time}",
            t.sanctuary.minutes.replace("{n}", String(minutesLeft(sleepEndsAt - now.getTime()))),
          )}
        </p>
      )}
    </fieldset>
  );
}

function chip(active: boolean) {
  return cn(
    "rounded-full border px-3 py-1 text-sm transition-colors",
    active ? "border-primary/60 bg-primary/15 text-foreground" : "border-border text-muted-foreground hover:text-foreground",
  );
}

/** Whole minutes left on a timer the user set, rounded up (never shows 0 while running). */
export function minutesLeft(ms: number) {
  return Math.max(1, Math.ceil(ms / 60_000));
}
