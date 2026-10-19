import type { SoundTrack } from "./types";

/**
 * Ambient and music catalogue. Files in /public/audio are procedurally generated
 * placeholders (scripts/generate-*.mjs) — swap `src` for licensed recordings
 * before launch. Titles come from the dictionaries (t.sounds.<id>).
 * Premium tracks stay in the catalogue for v1.1 but are hidden in v1.
 */
export const SOUND_TRACKS: SoundTrack[] = [
  { id: "rain", title: "Rain", category: "ambient", src: "/audio/rain.m4a", isPremium: false },
  { id: "ocean", title: "Ocean", category: "ambient", src: "/audio/ocean.m4a", isPremium: false },
  { id: "night-wind", title: "Night wind", category: "ambient", src: "/audio/night-wind.m4a", isPremium: false },
  { id: "campfire", title: "Campfire", category: "ambient", src: "/audio/campfire.m4a", isPremium: false },
  { id: "thunder", title: "Distant thunder", category: "ambient", src: "/audio/thunder.m4a", isPremium: true },
  { id: "stream", title: "Forest stream", category: "ambient", src: "/audio/stream.m4a", isPremium: true },
  { id: "singing-bowl", title: "Singing bowl", category: "ambient", src: "/audio/singing-bowl.m4a", isPremium: true },
  { id: "deep-hum", title: "Deep hum", category: "ambient", src: "/audio/deep-hum.m4a", isPremium: true },
  { id: "white-noise", title: "White noise", category: "noise", src: "/audio/white-noise.m4a", isPremium: false },
  { id: "pink-noise", title: "Pink noise", category: "noise", src: "/audio/pink-noise.m4a", isPremium: false },
  { id: "brown-noise", title: "Brown noise", category: "noise", src: "/audio/brown-noise.m4a", isPremium: false },
  { id: "piano-still", title: "Still", category: "music", src: "/audio/music/piano-still.m4a", isPremium: false, moods: ["heavy", "numb", "alone"] },
  { id: "piano-dawn", title: "Dawn", category: "music", src: "/audio/music/piano-dawn.m4a", isPremium: false, moods: ["hopeful", "peaceful", "joyful"] },
  { id: "lofi-rain", title: "Rain on the window", category: "music", src: "/audio/music/lofi-rain.m4a", isPremium: false, moods: ["anxious", "heavy", "angry"] },
  { id: "lofi-slow", title: "Slow down", category: "music", src: "/audio/music/lofi-slow.m4a", isPremium: false, moods: ["anxious", "numb", "confused"] },
  { id: "piano-drift", title: "Drift", category: "music", src: "/audio/music/piano-drift.m4a", isPremium: false, moods: ["peaceful", "thankful"] },
  { id: "piano-letter", title: "A letter", category: "music", src: "/audio/music/piano-letter.m4a", isPremium: false, moods: ["heavy", "hopeful", "alone"] },
];

export const TRACK_BY_ID = Object.fromEntries(SOUND_TRACKS.map((t) => [t.id, t])) as Record<string, SoundTrack>;

/** Ambient tracks offered in v1 (premium ones return with rewarded unlocks in v1.1). */
export const AMBIENT_TRACKS = SOUND_TRACKS.filter((t) => t.category === "ambient" && !t.isPremium);
export const MUSIC_TRACKS = SOUND_TRACKS.filter((t) => t.category === "music");
/** Steady colour noise (white, pink, brown) — synthesised, so these are final, not placeholders. */
export const NOISE_TRACKS = SOUND_TRACKS.filter((t) => t.category === "noise");
