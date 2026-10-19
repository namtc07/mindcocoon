import type { PresetMixId } from "./audio/mixes";
import type { BreathPatternId } from "./breathing";
import type { PracticeId } from "./practices";
import type { MoodType } from "./types";

/**
 * More precise words under each of the five moods (labels in the dictionaries: `feelings.words.<id>`).
 * Naming a feeling precisely is itself calming; nothing here scores or judges it.
 */
export const FEELINGS: Record<MoodType, string[]> = {
  peaceful: ["calm", "content", "relieved", "grateful", "safe", "at-ease", "cozy", "balanced"],
  hopeful: ["excited", "motivated", "proud", "loved", "curious", "inspired", "playful", "confident"],
  numb: ["empty", "tired", "bored", "disconnected", "flat", "distant", "drained", "meh"],
  heavy: ["exhausted", "lonely", "sad", "hurt", "disappointed", "grieving", "ashamed", "homesick"],
  anxious: ["worried", "overwhelmed", "restless", "scared", "irritated", "tense", "panicky", "jealous"],
  angry: ["frustrated", "resentful", "bitter", "impatient", "betrayed", "defensive", "fed-up", "offended"],
  confused: ["unsure", "torn", "lost", "stuck", "doubtful", "foggy", "conflicted", "hesitant"],
  alone: ["left-out", "isolated", "abandoned", "longing", "misunderstood", "unseen", "forgotten", "apart"],
  thankful: ["appreciative", "fortunate", "moved", "humbled", "cared-for", "supported", "warm", "valued"],
  joyful: ["happy", "cheerful", "delighted", "amused", "energized", "free", "lighthearted", "silly"],
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
  angry: { breath: { pattern: "calm", minutes: 3 }, mix: "rainy-night", practice: "unsent-letter" },
  confused: { breath: { pattern: "box", minutes: 3 }, mix: "sea-breeze", practice: "grounding" },
  alone: { breath: { pattern: "relax", minutes: 3 }, mix: "by-the-fire", practice: "kind-letter" },
  thankful: { breath: { pattern: "box", minutes: 1 }, mix: "sea-breeze", practice: "three-good-things" },
  joyful: { breath: { pattern: "box", minutes: 1 }, mix: "by-the-fire", practice: "three-good-things" },
};

export function suggestionFor(mood: MoodType): Suggestion {
  return SUGGESTIONS[mood];
}
