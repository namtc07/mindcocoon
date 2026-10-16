"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { useI18n } from "@/components/providers/i18n-provider";
import { Button } from "@/components/ui/button";
import { dayKey, dayKeyFromISO, formatDay, formatTime, formatWeekdayInitial } from "@/lib/dates";
import { monthGrid } from "@/lib/mood/selectors";
import { readNote } from "@/lib/mood/store";
import { MOOD_COLOR } from "@/lib/moods";
import { cn } from "@/lib/utils";
import type { MoodLog } from "@/types";
import { tagLabel } from "./tag-label";

function NoteText({ log }: { log: MoodLog }) {
  const [note, setNote] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    readNote(log).then((value) => alive && setNote(value));
    return () => {
      alive = false;
    };
  }, [log]);
  return note ? <p className="mt-1 text-sm text-foreground/90">{note}</p> : null;
}

function DayDetail({ logs, date }: { logs: MoodLog[]; date: Date }) {
  const { t, locale } = useI18n();
  const key = dayKey(date);
  const dayLogs = logs.filter((l) => dayKeyFromISO(l.createdAt) === key);

  return (
    <div className="rounded-xl bg-surface p-4" aria-live="polite">
      <p className="text-sm text-muted-foreground">{formatDay(date, locale)}</p>
      {dayLogs.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">{t.moodPage.emptyDay}</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {dayLogs.map((log) => (
            <li key={log.id} className="flex gap-3">
              <span className="mt-1 size-3 shrink-0 rounded-full" style={{ backgroundColor: MOOD_COLOR[log.mood] }} />
              <div>
                <p className="text-sm">
                  <span className="text-foreground">{t.mood.states[log.mood].label}</span>
                  <span className="ml-2 text-muted-foreground">{formatTime(log.createdAt, locale)}</span>
                </p>
                {log.tags.length > 0 && (
                  <p className="text-xs text-muted-foreground">{log.tags.map((tag) => tagLabel(t, tag)).join(", ")}</p>
                )}
                <NoteText log={log} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Monday-first calendar; each day takes the colour of its last check-in. */
export function MonthHeatmap({ logs, now }: { logs: MoodLog[]; now: Date }) {
  const { t, locale } = useI18n();
  const todayId = useId();
  const [cursor, setCursor] = useState({ year: now.getFullYear(), month: now.getMonth() });
  const [selected, setSelected] = useState<Date | null>(null);
  const cells = monthGrid(logs, cursor.year, cursor.month);
  const todayKey = dayKey(now);
  const monthLabel = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(
    new Date(cursor.year, cursor.month, 1),
  );
  const weekdays = Array.from({ length: 7 }, (_, i) => formatWeekdayInitial(new Date(2026, 0, 5 + i), locale));
  const atCurrentMonth = cursor.year === now.getFullYear() && cursor.month === now.getMonth();

  function shift(delta: number) {
    setSelected(null);
    setCursor(({ year, month }) => {
      const d = new Date(year, month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  }

  return (
    <section aria-label={t.moodPage.month} className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-xl capitalize">{monthLabel}</h2>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" aria-label={t.moodPage.prevMonth} onClick={() => shift(-1)}>
            <ChevronLeft aria-hidden />
          </Button>
          <Button variant="ghost" size="icon" aria-label={t.moodPage.nextMonth} onClick={() => shift(1)} disabled={atCurrentMonth}>
            <ChevronRight aria-hidden />
          </Button>
        </div>
      </div>

      <span id={todayId} hidden>
        {t.moodPage.today}
      </span>

      <div className="grid max-w-md grid-cols-7 gap-[2px]">
        {weekdays.map((d, i) => (
          <span key={`w${i}`} className="pb-1 text-center text-xs text-muted-foreground" aria-hidden>
            {d}
          </span>
        ))}
        {cells.map((cell, i) => {
          if (!cell) return <span key={`blank${i}`} aria-hidden />;
          const isToday = cell.dayKey === todayKey;
          const label = `${formatDay(cell.date, locale)}: ${cell.log ? t.mood.states[cell.log.mood].label : t.moodPage.noMood}`;
          const isSelected = selected !== null && dayKey(selected) === cell.dayKey;
          return (
            <button
              key={cell.dayKey}
              type="button"
              aria-label={label}
              aria-describedby={isToday ? todayId : undefined}
              aria-pressed={isSelected}
              title={label}
              onClick={() => setSelected(cell.date)}
              className={cn(
                "relative aspect-square rounded-[4px] text-[11px] outline-none focus-visible:ring-2 focus-visible:ring-ring",
                cell.log ? "text-white/90" : "bg-muted/60 text-muted-foreground",
                isSelected && "ring-2 ring-foreground/80",
              )}
              style={cell.log ? { backgroundColor: MOOD_COLOR[cell.log.mood] } : undefined}
            >
              {cell.date.getDate()}
              {isToday && <span aria-hidden className="absolute inset-x-0 bottom-1 mx-auto size-1 rounded-full bg-current" />}
            </button>
          );
        })}
      </div>

      {selected && <DayDetail logs={logs} date={selected} />}
    </section>
  );
}
