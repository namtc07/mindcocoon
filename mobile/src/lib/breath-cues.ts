import type { BreathPhase } from "@mindcocoon/core/breathing";
import * as Haptics from "expo-haptics";
import { createEffectChannel } from "./effects";

/** Soft tones marking each breathing phase, so it can be followed with eyes closed. */
export const BREATH_CUE_SOURCES = {
  inhale: require("../../assets/audio/sfx/breath-in.m4a") as number,
  hold: require("../../assets/audio/sfx/breath-hold.m4a") as number,
  exhale: require("../../assets/audio/sfx/breath-out.m4a") as number,
};

const channel = createEffectChannel();
export const stopBreathCues = channel.stop;

export function playBreathCue(phase: BreathPhase) {
  const key = phase === "inhale" ? "inhale" : phase === "exhale" ? "exhale" : "hold";
  void channel.play(BREATH_CUE_SOURCES[key], key === "hold" ? 0.35 : 0.5);
  if (key !== "hold") void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}
