import { PRESET_MIXES, type PresetMixId } from "@mindcocoon/core/audio/mixes";
import type { PracticeId } from "@mindcocoon/core/practices";
import type { Suggestion } from "@mindcocoon/core/feelings";
import { router } from "expo-router";
import { audio } from "./audio";
import { setPref } from "./prefs";

/** Opens Sanctuary at breathing with the suggested rhythm and length selected (not started). */
export async function openSuggestedBreathing(breath: Suggestion["breath"]) {
  await setPref("breathing", breath);
  router.push({ pathname: "/sanctuary", params: { section: "breathe" } });
}

/** Plays a ready-made mix (presets only use free sounds). */
export function playPreset(id: PresetMixId) {
  const preset = PRESET_MIXES.find((p) => p.id === id);
  return preset ? audio.applyMix(preset.mix, () => true) : Promise.resolve();
}

export function openPractice(id: PracticeId) {
  router.push({ pathname: "/practices/[id]", params: { id } });
}
