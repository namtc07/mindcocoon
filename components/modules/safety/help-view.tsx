"use client";

import { Phone } from "lucide-react";
import { useI18n } from "@/components/providers/i18n-provider";
import { useNow } from "@/hooks/use-now";
import type { Locale } from "@/lib/i18n/config";
import { FIND_A_HELPLINE_URL, HOTLINES, isOpenNow, telHref, type Hotline } from "@/lib/safety/hotlines";

const HOME_COUNTRY: Record<Locale, string | null> = { vi: "VN", en: null };

function HotlineItem({ line, now }: { line: Hotline; now: Date | null }) {
  const { t, locale } = useI18n();
  const open = now ? isOpenNow(line, now) : true;
  const hours =
    line.hours === "24/7"
      ? t.safety.allHours
      : t.safety.hoursRange.replace("{open}", line.hours.open).replace("{close}", line.hours.close);

  return (
    <li className="flex items-center justify-between gap-4 border-t border-border py-4 first:border-t-0">
      <div className="min-w-0">
        <p className="font-medium text-foreground">{line.name[locale]}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">
          <span className="font-serif text-lg text-foreground/90">{line.phone}</span>
          <span className="mx-2" aria-hidden>
            ·
          </span>
          {hours}
        </p>
        <p className="mt-1 flex flex-wrap gap-x-3 text-xs">
          <span className={open ? "text-primary" : "text-muted-foreground"}>
            {open ? t.safety.openNow : t.safety.closedNow}
          </span>
          {line.audience === "youth" && <span className="text-muted-foreground">{t.safety.youth}</span>}
        </p>
      </div>
      <a
        href={telHref(line.phone)}
        className="inline-flex shrink-0 items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
      >
        <Phone className="size-4" aria-hidden />
        {t.safety.call}
      </a>
    </li>
  );
}

/** Support lines, ordered: the user's country first, then lines answering right now. Works offline. */
export function HelpView() {
  const { t, locale } = useI18n();
  const now = useNow();
  const home = HOME_COUNTRY[locale];
  const byOpen = (a: Hotline, b: Hotline) =>
    Number(now ? isOpenNow(b, now) : 0) - Number(now ? isOpenNow(a, now) : 0);
  const local = HOTLINES.filter((h) => h.country === home).sort(byOpen);
  const others = HOTLINES.filter((h) => h.country !== home).sort(byOpen);

  return (
    <div className="space-y-10">
      <header>
        <h1 className="font-serif text-4xl leading-tight text-balance">{t.safety.helpTitle}</h1>
        <p className="mt-3 text-muted-foreground">{t.safety.helpIntro}</p>
      </header>

      {process.env.NODE_ENV !== "production" && HOTLINES.some((h) => !h.verified) && (
        <p className="rounded-lg border border-dashed border-ember/50 px-3 py-2 text-sm text-ember">
          {t.safety.unverified}
        </p>
      )}

      {local.length > 0 && <ul className="rounded-2xl bg-surface/60 px-5">{local.map((h) => <HotlineItem key={h.id} line={h} now={now} />)}</ul>}

      <section className="space-y-3">
        {local.length > 0 && <h2 className="text-sm text-muted-foreground">{t.safety.otherCountries}</h2>}
        <ul className="rounded-2xl bg-surface/60 px-5">
          {others.map((h) => (
            <HotlineItem key={h.id} line={h} now={now} />
          ))}
        </ul>
        <a
          href={FIND_A_HELPLINE_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-block pt-2 text-primary underline-offset-4 hover:underline"
        >
          {t.safety.findHelpline}
        </a>
      </section>

      <p className="text-sm text-muted-foreground">{t.safety.disclaimer}</p>
    </div>
  );
}
