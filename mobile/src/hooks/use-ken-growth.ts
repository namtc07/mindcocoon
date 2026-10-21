import { companionState, overnightReveal, type CompanionState } from "@mindcocoon/core/companion";
import { dayKey } from "@mindcocoon/core/dates";
import { promptAt } from "@mindcocoon/core/prompts";
import type { MoodLog } from "@mindcocoon/core/types";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useI18n } from "@/i18n/i18n";
import { eveningDays } from "@/lib/companion-core";
import { getPref, setPref, subscribePrefs } from "@/lib/prefs";
import { planForTonight } from "@/lib/tonight-plan";
import { buildTonightWidgetState } from "@/lib/widget-state-core";
import type { SleepNight } from "@/lib/sleep-log-core";

const NO_NIGHTS: SleepNight[] = [];
const readSleepLog = () => getPref("sleepLog") ?? NO_NIGHTS;
const readKenSeen = () => getPref("kenSeen");

type KenSeen = { on: string; stage: number };

/**
 * Kén's growth on Today: the stage from every evening the person has shown up, and whether
 * an overnight change is waiting to be noticed. The day's first render freezes the "last
 * seen" baseline (before the effect below moves it), so the change can be shown for the
 * whole visit and noticed once — never nagged again tomorrow for the same change.
 */
export function useKenGrowth(now: Date, logs: readonly MoodLog[]): { state: CompanionState; changed: boolean } {
  const { locale } = useI18n();
  const sleepLog = useSyncExternalStore(subscribePrefs, readSleepLog, readSleepLog);
  const seen = useSyncExternalStore(subscribePrefs, readKenSeen, readKenSeen);
  const days = eveningDays(logs, sleepLog);
  const state = companionState(days, now);
  const today = dayKey(now);

  // Freeze this day's baseline during render (React's "adjust state when props change"
  // pattern): the first render of a day adopts the stored baseline; later pref writes
  // from the effect must not move it, or the reveal would vanish as soon as it is saved.
  const [baseline, setBaseline] = useState<{ day: string; seen: KenSeen | null }>({ day: "", seen: null });
  if (baseline.day !== today) setBaseline({ day: today, seen: seen ?? null });
  const changed = baseline.day === today && overnightReveal(baseline.seen, state, days, now);

  const handledDay = useRef<string | null>(null);
  useEffect(() => {
    if (handledDay.current === today) return;
    handledDay.current = today;
    void setPref("kenSeen", { on: today, stage: state.stage });
    void setPref("widgetState", buildTonightWidgetState(state, promptAt(locale, planForTonight(now).promptIndex), today));
    // Once a day is the contract; the values above are this day's snapshot.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now]);

  return { state, changed };
}
