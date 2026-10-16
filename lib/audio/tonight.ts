import { dayKey } from "@/lib/dates";
import type { MoodType, SoundTrack } from "@/types";

/** Tonight's music: a track tagged with the mood (else any music), stable for the whole day. */
export function pickTonightTrack(tracks: SoundTrack[], mood: MoodType | null, date: Date): SoundTrack {
  const music = tracks.filter((t) => t.category === "music");
  const matching = mood ? music.filter((t) => t.moods?.includes(mood)) : [];
  const pool = matching.length ? matching : music;
  let hash = 7;
  for (const ch of dayKey(date) + (mood ?? "")) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return pool[hash % pool.length];
}
