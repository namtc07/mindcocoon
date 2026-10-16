"use client";

import { useI18n } from "@/components/providers/i18n-provider";
import { useNow } from "@/hooks/use-now";
import { BoxBreathing } from "./box-breathing";
import { SleepTimer } from "./sleep-timer";
import { SoundMixer } from "./sound-mixer";
import { TonightCard } from "./tonight-card";

export function SanctuaryView() {
  const { t } = useI18n();
  const now = useNow();

  return (
    <div className="space-y-14">
      <header>
        <h1 className="font-serif text-4xl">{t.sanctuary.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t.sanctuary.intro}</p>
      </header>
      <BoxBreathing />
      {now && <TonightCard now={now} />}
      <SoundMixer />
      <SleepTimer />
    </div>
  );
}
