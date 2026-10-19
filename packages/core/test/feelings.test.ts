import { describe, expect, it } from "vitest";
import { PRESET_MIXES } from "@mindcocoon/core/audio/mixes";
import { BREATH_PATTERNS } from "@mindcocoon/core/breathing";
import { FEELINGS, MAX_FEELINGS, MOOD_METER, suggestionFor } from "@mindcocoon/core/feelings";
import { en } from "@mindcocoon/core/i18n/dictionaries/en";
import { vi } from "@mindcocoon/core/i18n/dictionaries/vi";
import { MOODS } from "@mindcocoon/core/moods";
import { getPractice } from "@mindcocoon/core/practices";

describe("feelings", () => {
  it("every mood has eight feeling words with en+vi labels", () => {
    expect(MAX_FEELINGS).toBe(3);
    for (const { id } of MOODS) {
      expect(FEELINGS[id]).toHaveLength(8);
      for (const word of FEELINGS[id]) {
        expect(en.feelings.words[word as keyof typeof en.feelings.words]).toBeTruthy();
        expect(vi.feelings.words[word as keyof typeof vi.feelings.words]).toBeTruthy();
      }
    }
    const all = MOODS.flatMap((m) => FEELINGS[m.id]);
    expect(new Set(all).size).toBe(all.length);
  });

  it("keeps the original five words first (stored ids stay valid)", () => {
    expect(FEELINGS.heavy.slice(0, 5)).toEqual(["exhausted", "lonely", "sad", "hurt", "disappointed"]);
    expect(FEELINGS.anxious.slice(0, 5)).toEqual(["worried", "overwhelmed", "restless", "scared", "irritated"]);
  });

  it("places each mood on its own spot of the energy × pleasantness meter", () => {
    const spots = MOODS.map((m) => `${MOOD_METER[m.id].energy},${MOOD_METER[m.id].pleasant}`);
    expect(new Set(spots).size).toBe(MOODS.length);
    expect(MOOD_METER.anxious).toEqual({ energy: 1, pleasant: -1 });
    expect(MOOD_METER.hopeful).toEqual({ energy: 1, pleasant: 1 });
    expect(MOOD_METER.heavy).toEqual({ energy: -1, pleasant: -1 });
    expect(MOOD_METER.peaceful).toEqual({ energy: -1, pleasant: 1 });
    expect(MOOD_METER.numb).toEqual({ energy: 0, pleasant: 0 });
    for (const d of [en, vi]) expect(Object.values(d.feelings.meter).every(Boolean)).toBe(true);
  });

  it("suggestionFor covers every mood with real presets, practices and patterns", () => {
    for (const { id } of MOODS) {
      const s = suggestionFor(id);
      expect(BREATH_PATTERNS[s.breath.pattern]).toBeTruthy();
      expect(PRESET_MIXES.some((p) => p.id === s.mix)).toBe(true);
      expect(getPractice("en", s.practice)).toBeTruthy();
    }
    expect(suggestionFor("anxious")).toEqual({ breath: { pattern: "calm", minutes: 3 }, mix: "rain-at-sea", practice: "grounding" });
    expect(suggestionFor("heavy")).toEqual({ breath: { pattern: "relax", minutes: 3 }, mix: "rainy-night", practice: "kind-letter" });
  });
});
