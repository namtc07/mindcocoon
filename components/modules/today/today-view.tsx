"use client";

import { Feather, Music2, Wind, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { AdBanner } from "@/components/modules/ads/ad-banner";
import { InstallHint } from "@/components/modules/pwa/install-hint";
import { HeavyNudge } from "@/components/modules/safety/heavy-nudge";
import { useI18n } from "@/components/providers/i18n-provider";
import { useNow } from "@/hooks/use-now";
import { formatDay, partOfDay } from "@/lib/dates";
import { QuickCheckin } from "./quick-checkin";
import { ReflectionPrompt } from "./reflection-prompt";

function EntryLink({ href, icon: Icon, title, body }: { href: string; icon: LucideIcon; title: string; body: string }) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-4 border-t border-border py-5 outline-none first:border-t-0 focus-visible:bg-accent/40"
    >
      <Icon className="mt-0.5 size-5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" aria-hidden />
      <span>
        <span className="block font-medium text-foreground">{title}</span>
        <span className="mt-0.5 block text-sm text-muted-foreground">{body}</span>
      </span>
    </Link>
  );
}

export function TodayView() {
  const { t, locale, href } = useI18n();
  const now = useNow();

  if (!now) return <div className="min-h-[60vh]" aria-busy />;

  return (
    <div className="space-y-14">
      <header>
        <p className="text-sm text-muted-foreground">{formatDay(now, locale)}</p>
        <h1 className="mt-1 text-lg text-foreground/90">{t.today.greeting[partOfDay(now)]}</h1>
      </header>

      <HeavyNudge now={now} />
      <ReflectionPrompt now={now} />
      <QuickCheckin />

      <nav aria-label={t.nav.primary} className="rounded-2xl bg-surface/60 px-5">
        <EntryLink href={href("/vent")} icon={Feather} title={t.today.tiles.ventTitle} body={t.today.tiles.ventBody} />
        <EntryLink
          href={href("/sanctuary#breathe")}
          icon={Wind}
          title={t.today.tiles.breatheTitle}
          body={t.today.tiles.breatheBody}
        />
        <EntryLink
          href={href("/sanctuary#tonight")}
          icon={Music2}
          title={t.today.tiles.musicTitle}
          body={t.today.tiles.musicBody}
        />
      </nav>

      <InstallHint />
      <AdBanner placement="today" />
    </div>
  );
}
