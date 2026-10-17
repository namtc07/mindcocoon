"use client";

import { useI18n } from "@/components/providers/i18n-provider";
import { formatShortDay, formatWeekdayInitial } from "@mindcocoon/core/dates";
import { weekStrip } from "@mindcocoon/core/mood/selectors";
import { MOOD_COLOR } from "@mindcocoon/core/moods";
import type { MoodLog } from "@mindcocoon/core/types";

/** Seven dots, oldest to today. An empty day is an outline ring, never a zero. */
export function WeekStrip({ logs, now }: { logs: MoodLog[]; now: Date }) {
  const { t, locale } = useI18n();
  const days = weekStrip(logs, now);

  return (
    <ul aria-label={t.moodPage.week} className="grid grid-cols-7 gap-2">
      {days.map((day) => {
        const label = day.log ? t.mood.states[day.log.mood].label : t.moodPage.noMood;
        return (
          <li
            key={day.dayKey}
            title={`${formatShortDay(day.date, locale)}: ${label}`}
            className="flex flex-col items-center gap-2"
          >
            {day.log ? (
              <span
                data-mood={day.log.mood}
                className="size-7 rounded-full"
                style={{ backgroundColor: MOOD_COLOR[day.log.mood] }}
              />
            ) : (
              <span className="size-7 rounded-full border border-dashed border-muted-foreground/40" />
            )}
            <span className="text-xs text-muted-foreground" aria-hidden>
              {formatWeekdayInitial(day.date, locale)}
            </span>
            <span className="sr-only">{`${formatShortDay(day.date, locale)}: ${label}`}</span>
          </li>
        );
      })}
    </ul>
  );
}
