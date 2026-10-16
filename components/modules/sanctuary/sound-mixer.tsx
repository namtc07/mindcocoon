"use client";

import { Pause, Play } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/components/providers/i18n-provider";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useAudio } from "@/hooks/use-audio";
import { setLoop, setMasterVolume, setTrackVolume, toggleTrack } from "@/lib/audio/engine";
import { AMBIENT_TRACKS } from "@/lib/sounds";
import { cn } from "@/lib/utils";

export function SoundMixer() {
  const { t } = useI18n();
  const audio = useAudio();

  async function toggle(id: string) {
    try {
      await toggleTrack(id);
    } catch {
      toast.error(t.sanctuary.playError);
    }
  }

  return (
    <section aria-labelledby="sounds-title" className="space-y-5">
      <h2 id="sounds-title" className="font-serif text-2xl">
        {t.sanctuary.soundsTitle}
      </h2>

      <ul className="space-y-1">
        {AMBIENT_TRACKS.map((track) => {
          const playing = audio.playing.includes(track.id);
          const name = t.sounds[track.id as keyof typeof t.sounds];
          return (
            <li key={track.id} className="flex items-center gap-4 py-2">
              <button
                type="button"
                onClick={() => void toggle(track.id)}
                aria-pressed={playing}
                aria-label={`${playing ? t.sanctuary.pause : t.sanctuary.play}: ${name}`}
                className={cn(
                  "flex size-11 shrink-0 items-center justify-center rounded-full border transition-colors",
                  playing ? "border-primary/60 bg-primary/15 text-primary" : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {playing ? <Pause className="size-4" aria-hidden /> : <Play className="size-4" aria-hidden />}
              </button>
              <span className={cn("w-24 shrink-0 text-sm", playing ? "text-foreground" : "text-muted-foreground")}>{name}</span>
              <Slider
                value={[audio.volumes[track.id] ?? 0.6]}
                min={0}
                max={1}
                step={0.01}
                onValueChange={([v]) => setTrackVolume(track.id, v)}
                aria-label={t.sanctuary.volumeFor.replace("{name}", name)}
                className="flex-1"
              />
            </li>
          );
        })}
      </ul>

      <div className="flex flex-wrap items-center gap-x-8 gap-y-4 border-t border-border pt-5">
        <label className="flex min-w-56 flex-1 items-center gap-4 text-sm text-muted-foreground">
          <span className="w-32 shrink-0">{t.sanctuary.master}</span>
          <Slider
            value={[audio.master]}
            min={0}
            max={1}
            step={0.01}
            onValueChange={([v]) => setMasterVolume(v)}
            aria-label={t.sanctuary.master}
            className="flex-1"
          />
        </label>
        <label className="flex items-center gap-3 text-sm text-muted-foreground">
          <Switch checked={audio.loop} onCheckedChange={setLoop} aria-label={t.sanctuary.loop} />
          {t.sanctuary.loop}
        </label>
      </div>
    </section>
  );
}
