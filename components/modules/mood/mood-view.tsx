"use client";

import { Trash2 } from "lucide-react";
import { AdBanner } from "@/components/modules/ads/ad-banner";
import { useI18n } from "@/components/providers/i18n-provider";
import { Button } from "@/components/ui/button";
import { useMoodLogs } from "@/hooks/use-mood-logs";
import { useNow } from "@/hooks/use-now";
import { formatShortDay, formatTime } from "@/lib/dates";
import { removeMood } from "@/lib/mood/store";
import { MOODS, MOOD_COLOR } from "@/lib/moods";
import { CheckinForm } from "./checkin-form";
import { MonthHeatmap } from "./month-heatmap";
import { tagLabel } from "./tag-label";
import { WeekStrip } from "./week-strip";

export function MoodView() {
  const { t, locale } = useI18n();
  const now = useNow();
  const { logs } = useMoodLogs();

  if (!now) return <div className="min-h-[60vh]" aria-busy />;

  return (
    <div className="space-y-14">
      <header>
        <h1 className="font-serif text-4xl">{t.moodPage.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t.moodPage.intro}</p>
      </header>

      <CheckinForm />

      <section className="space-y-4">
        <h2 className="text-sm text-muted-foreground">{t.moodPage.week}</h2>
        <WeekStrip logs={logs} now={now} />
      </section>

      <MonthHeatmap logs={logs} now={now} />

      <ul aria-label={t.moodPage.legend} className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
        {MOODS.map((m) => (
          <li key={m.id} className="flex items-center gap-2">
            <span className="size-3 rounded-full" style={{ backgroundColor: m.color }} />
            {t.mood.states[m.id].label}
          </li>
        ))}
      </ul>

      <section className="space-y-3">
        <h2 className="text-sm text-muted-foreground">{t.moodPage.history}</h2>
        {logs.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t.moodPage.emptyHistory}</p>
        ) : (
          <ul aria-label={t.moodPage.history}>
            {logs.slice(0, 30).map((log) => (
              <li key={log.id} className="flex items-center gap-3 border-t border-border py-3 first:border-t-0">
                <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: MOOD_COLOR[log.mood] }} />
                <span className="min-w-0 flex-1 text-sm">
                  <span className="text-foreground">{t.mood.states[log.mood].label}</span>
                  {log.tags.length > 0 && (
                    <span className="ml-2 text-muted-foreground">{log.tags.map((tag) => tagLabel(t, tag)).join(", ")}</span>
                  )}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatShortDay(new Date(log.createdAt), locale)}, {formatTime(log.createdAt, locale)}
                </span>
                <Button variant="ghost" size="icon-sm" aria-label={t.moodPage.deleteEntry} onClick={() => void removeMood(log.id)}>
                  <Trash2 aria-hidden />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <AdBanner placement="mood" />
    </div>
  );
}
