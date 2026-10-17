"use client";

import { Pause, Play } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/components/providers/i18n-provider";
import { useAudio } from "@/hooks/use-audio";
import { useMoodLogs } from "@/hooks/use-mood-logs";
import { pickTonightTrack } from "@mindcocoon/core/audio/tonight";
import { toggleTrack } from "@/lib/audio/engine";
import { dayKey, dayKeyFromISO } from "@mindcocoon/core/dates";
import { SOUND_TRACKS } from "@mindcocoon/core/sounds";

/** Tonight's music, picked for the latest check-in today. Plays alongside ambient sounds. */
export function TonightCard({ now }: { now: Date }) {
  const { t } = useI18n();
  const audio = useAudio();
  const { logs } = useMoodLogs();
  const today = logs.find((l) => dayKeyFromISO(l.createdAt) === dayKey(now)) ?? null;
  const mood = today?.mood ?? null;
  const track = pickTonightTrack(SOUND_TRACKS, mood, now);
  const playing = audio.playing.includes(track.id);
  const name = t.sounds[track.id as keyof typeof t.sounds];

  async function toggle() {
    try {
      await toggleTrack(track.id);
    } catch {
      toast.error(t.sanctuary.playError);
    }
  }

  return (
    <section id="tonight" aria-labelledby="tonight-title" className="scroll-mt-24 rounded-2xl bg-surface/60 p-6">
      <h2 id="tonight-title" className="text-sm text-muted-foreground">
        {t.sanctuary.tonightTitle}
      </h2>
      <div className="mt-3 flex items-center gap-5">
        <button
          type="button"
          onClick={() => void toggle()}
          aria-pressed={playing}
          aria-label={`${playing ? t.sanctuary.pause : t.sanctuary.play}: ${name}`}
          className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity hover:opacity-90"
        >
          {playing ? <Pause className="size-5" aria-hidden /> : <Play className="size-5 translate-x-px" aria-hidden />}
        </button>
        <div className="min-w-0">
          <p className="font-serif text-2xl">{name}</p>
          <p className="text-sm text-muted-foreground">
            {mood
              ? t.sanctuary.tonightFor.replace("{mood}", t.mood.states[mood].label.toLowerCase())
              : t.sanctuary.tonightAny}
          </p>
        </div>
      </div>
    </section>
  );
}
