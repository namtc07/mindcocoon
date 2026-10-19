import { createAudioPlayer } from "expo-audio";
import * as Haptics from "expo-haptics";
import type { Ritual } from "@/components/vent/Dissolve";
import { getPref } from "./prefs";

/** Short generated sounds for each way of letting go (scripts/generate-sfx.mjs). */
export const SFX_SOURCES: Record<Ritual, number> = {
  burn: require("../../assets/audio/sfx/burn.m4a"),
  float: require("../../assets/audio/sfx/float.m4a"),
  scatter: require("../../assets/audio/sfx/scatter.m4a"),
  fade: require("../../assets/audio/sfx/fade.m4a"),
};

const VOLUME = 0.5;
const MAX_MS = 6_000;

type OneShot = ReturnType<typeof createAudioPlayer>;
let current: OneShot | null = null;
let cleanup: ReturnType<typeof setTimeout> | null = null;

export function stopReleaseSound() {
  if (cleanup) clearTimeout(cleanup);
  cleanup = null;
  if (!current) return;
  try {
    current.pause();
    current.remove();
  } catch {
    // Already released.
  }
  current = null;
}

/** Plays the ritual's sound once (unless turned off in Settings), quietly, and frees it afterwards. */
export function playReleaseSound(ritual: Ritual) {
  if (getPref("releaseSound") === false) return;
  stopReleaseSound();
  try {
    const player = createAudioPlayer(SFX_SOURCES[ritual]);
    player.volume = VOLUME;
    player.play();
    current = player;
    cleanup = setTimeout(stopReleaseSound, MAX_MS);
  } catch {
    // Sound is a nicety; letting go works without it.
  }
}

/** A light touch matching the ritual: crackles for burning, one soft push to float, a gust for scattering. */
export function releaseHaptics(ritual: Ritual): ReturnType<typeof setTimeout>[] {
  const tap = (style: Haptics.ImpactFeedbackStyle) => void Haptics.impactAsync(style).catch(() => {});
  if (ritual === "burn") return [0, 280, 620].map((ms) => setTimeout(() => tap(Haptics.ImpactFeedbackStyle.Light), ms));
  if (ritual === "float") return [setTimeout(() => tap(Haptics.ImpactFeedbackStyle.Soft), 0)];
  if (ritual === "scatter") return [0, 120].map((ms) => setTimeout(() => tap(Haptics.ImpactFeedbackStyle.Medium), ms));
  return [];
}
