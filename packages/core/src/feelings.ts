import type { PresetMixId } from "./audio/mixes";
import type { BreathPatternId } from "./breathing";
import type { PracticeId } from "./practices";
import type { MoodType } from "./types";

/**
 * More precise words under each of the five moods (labels in the dictionaries: `feelings.words.<id>`).
 * Naming a feeling precisely is itself calming; nothing here scores or judges it.
 */
export const FEELINGS: Record<MoodType, string[]> = {
  peaceful: ["calm", "content", "relieved", "grateful", "safe"],
  hopeful: ["excited", "motivated", "proud", "loved", "curious"],
  numb: ["empty", "tired", "bored", "disconnected", "flat"],
  heavy: ["exhausted", "lonely", "sad", "hurt", "disappointed"],
  anxious: ["worried", "overwhelmed", "restless", "scared", "irritated"],
};

export const MAX_FEELINGS = 3;

/** Feeling words that belong to this mood (others are dropped, e.g. after changing the mood). */
export function feelingsFor(mood: MoodType, words: string[] | undefined): string[] {
  return (words ?? []).filter((w) => FEELINGS[mood].includes(w)).slice(0, MAX_FEELINGS);
}

/** Something gentle to try for a feeling — offered, never required. */
export interface Suggestion {
  breath: { pattern: BreathPatternId; minutes: 1 | 3 };
  mix: PresetMixId;
  practice: PracticeId;
}

const SUGGESTIONS: Record<MoodType, Suggestion> = {
  peaceful: { breath: { pattern: "box", minutes: 1 }, mix: "sea-breeze", practice: "three-good-things" },
  hopeful: { breath: { pattern: "box", minutes: 1 }, mix: "by-the-fire", practice: "three-good-things" },
  numb: { breath: { pattern: "box", minutes: 1 }, mix: "by-the-fire", practice: "grounding" },
  heavy: { breath: { pattern: "relax", minutes: 3 }, mix: "rainy-night", practice: "kind-letter" },
  anxious: { breath: { pattern: "calm", minutes: 3 }, mix: "rain-at-sea", practice: "grounding" },
};

export function suggestionFor(mood: MoodType): Suggestion {
  return SUGGESTIONS[mood];
}
