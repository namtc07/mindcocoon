import * as Haptics from "expo-haptics";
import type { Ritual } from "@/components/vent/Dissolve";
import { createEffectChannel } from "./effects";
import { getPref } from "./prefs";

/** Short generated sounds for each way of letting go (scripts/generate-sfx.mjs). */
export const SFX_SOURCES: Record<Ritual, number> = {
  burn: require("../../assets/audio/sfx/burn.m4a"),
  float: require("../../assets/audio/sfx/float.m4a"),
  scatter: require("../../assets/audio/sfx/scatter.m4a"),
  fade: require("../../assets/audio/sfx/fade.m4a"),
};

const channel = createEffectChannel();
export const stopReleaseSound = channel.stop;

/** Plays the ritual's sound once (unless turned off in Settings), quietly, and frees it afterwards. */
export async function playReleaseSound(ritual: Ritual) {
  if (getPref("releaseSound") === false) return;
  await channel.play(SFX_SOURCES[ritual], 0.5);
}

/** A light touch matching the ritual: crackles for burning, one soft push to float, a gust for scattering. */
export function releaseHaptics(ritual: Ritual): ReturnType<typeof setTimeout>[] {
  const tap = (style: Haptics.ImpactFeedbackStyle) => void Haptics.impactAsync(style).catch(() => {});
  if (ritual === "burn") return [0, 280, 620].map((ms) => setTimeout(() => tap(Haptics.ImpactFeedbackStyle.Light), ms));
  if (ritual === "float") return [setTimeout(() => tap(Haptics.ImpactFeedbackStyle.Soft), 0)];
  if (ritual === "scatter") return [0, 120].map((ms) => setTimeout(() => tap(Haptics.ImpactFeedbackStyle.Medium), ms));
  return [];
}
