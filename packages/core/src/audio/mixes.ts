/** Ready-made sound mixes and the shape of mixes people save. Free sounds only in presets. */

export interface Mix {
  /** Sound id → volume (0..1); ids at 0 are not part of the mix. */
  volumes: Record<string, number>;
}

export type PresetMixId = "rainy-night" | "by-the-fire" | "sea-breeze" | "rain-at-sea";

export const PRESET_MIXES: { id: PresetMixId; mix: Mix }[] = [
  { id: "rainy-night", mix: { volumes: { rain: 0.7, "night-wind": 0.3 } } },
  { id: "by-the-fire", mix: { volumes: { campfire: 0.7, rain: 0.25 } } },
  { id: "sea-breeze", mix: { volumes: { ocean: 0.7, "night-wind": 0.35 } } },
  { id: "rain-at-sea", mix: { volumes: { rain: 0.5, ocean: 0.4, "night-wind": 0.2 } } },
];

/** A mix someone saved; `n` numbers it ("My mix 2") so the name follows the app's language. */
export interface SavedMix {
  id: string;
  n: number;
  mix: Mix;
  createdAt: string;
}

export const MAX_SAVED_MIXES = 5;

export function mixIds(mix: Mix): string[] {
  return Object.entries(mix.volumes)
    .filter(([, v]) => v > 0)
    .map(([id]) => id);
}

/** True when exactly the mix's sounds are playing, each within ±0.05 of its volume. */
export function mixMatches(mix: Mix, playing: string[], volumes: Record<string, number>): boolean {
  const ids = mixIds(mix);
  if (ids.length !== playing.length || !ids.every((id) => playing.includes(id))) return false;
  return ids.every((id) => Math.abs((volumes[id] ?? 0) - mix.volumes[id]) <= 0.05);
}
