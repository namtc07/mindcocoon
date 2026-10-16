import type { SoundTrack } from "@/types";

/**
 * Ambient catalogue. The files in /public/audio are procedurally generated
 * placeholders (scripts/generate-ambient.mjs) — swap `src` for licensed
 * recordings or a CDN URL without touching the player.
 */
export const SOUND_TRACKS: SoundTrack[] = [
  { id: "rain", title: "Rain", category: "Weather", src: "/audio/rain.wav", isPremium: false },
  { id: "ocean", title: "Ocean", category: "Water", src: "/audio/ocean.wav", isPremium: false },
  {
    id: "night-wind",
    title: "Night wind",
    category: "Weather",
    src: "/audio/night-wind.wav",
    isPremium: false,
  },
  {
    id: "campfire",
    title: "Campfire",
    category: "Fire",
    src: "/audio/campfire.wav",
    isPremium: false,
  },
  {
    id: "thunder",
    title: "Distant thunder",
    category: "Weather",
    src: "/audio/thunder.wav",
    isPremium: true,
  },
  { id: "stream", title: "Forest stream", category: "Water", src: "/audio/stream.wav", isPremium: true },
  {
    id: "singing-bowl",
    title: "Singing bowl",
    category: "Tones",
    src: "/audio/singing-bowl.wav",
    isPremium: true,
  },
  {
    id: "deep-hum",
    title: "Deep hum",
    category: "Tones",
    src: "/audio/deep-hum.wav",
    isPremium: true,
  },
];

export const TRACK_BY_ID = Object.fromEntries(SOUND_TRACKS.map((t) => [t.id, t])) as Record<
  string,
  SoundTrack
>;
