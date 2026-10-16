"use client";

import { Moon, Pause, Play, Square } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { minutesLeft } from "@/components/modules/sanctuary/sleep-timer";
import { stripLocale, useI18n } from "@/components/providers/i18n-provider";
import { useAudio } from "@/hooks/use-audio";
import { useNow } from "@/hooks/use-now";
import { pauseAll, resumeAll, stopAll } from "@/lib/audio/engine";
import { cn } from "@/lib/utils";

/** Persistent player: bottom-right pill on desktop, above the tab bar on mobile, above the vent overlay. */
export function MiniAudioBar() {
  const { t, href } = useI18n();
  const audio = useAudio();
  const now = useNow();
  const path = stripLocale(usePathname());
  const active = audio.playing.length ? audio.playing : audio.held;
  if (!active.length) return null;

  const playing = audio.playing.length > 0;
  const names = active.map((id) => t.sounds[id as keyof typeof t.sounds]).join(" + ");
  const immersive = path.startsWith("/vent");

  return (
    <div
      role="region"
      aria-label={t.sanctuary.nowPlaying}
      className={cn(
        "fixed right-3 left-3 z-50 flex items-center gap-2 rounded-full border border-border bg-popover/95 py-1.5 pr-1.5 pl-4 shadow-lg backdrop-blur md:right-6 md:bottom-6 md:left-auto md:max-w-sm",
        immersive ? "bottom-4" : "bottom-[calc(4.75rem+env(safe-area-inset-bottom))]",
      )}
    >
      <Link href={href("/sanctuary")} className="min-w-0 flex-1 truncate text-sm text-foreground">
        {names}
      </Link>
      {audio.sleepEndsAt !== null && now && (
        <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground tabular-nums">
          <Moon className="size-3.5" aria-hidden />
          <span className="sr-only">{t.sanctuary.sleepTimer}</span>
          {t.sanctuary.minutes.replace("{n}", String(minutesLeft(audio.sleepEndsAt - now.getTime())))}
        </span>
      )}
      <button
        type="button"
        onClick={() => (playing ? pauseAll() : void resumeAll())}
        aria-label={playing ? t.sanctuary.pauseAll : t.sanctuary.resumeAll}
        className="flex size-9 items-center justify-center rounded-full text-foreground hover:bg-accent"
      >
        {playing ? <Pause className="size-4" aria-hidden /> : <Play className="size-4" aria-hidden />}
      </button>
      <button
        type="button"
        onClick={stopAll}
        aria-label={t.sanctuary.stopAll}
        className="flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
      >
        <Square className="size-3.5" aria-hidden />
      </button>
    </div>
  );
}
