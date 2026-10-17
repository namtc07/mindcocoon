import { describe, expect, it } from "vitest";
import { MAX_SAVED_MIXES, mixIds, mixMatches, PRESET_MIXES } from "@mindcocoon/core/audio/mixes";
import { SOUND_TRACKS } from "@mindcocoon/core/sounds";

describe("mixes", () => {
  it("presets only use free sounds", () => {
    const free = new Set(SOUND_TRACKS.filter((t) => !t.isPremium).map((t) => t.id));
    for (const p of PRESET_MIXES) for (const id of mixIds(p.mix)) expect(free.has(id)).toBe(true);
    expect(PRESET_MIXES.map((p) => p.id)).toEqual(["rainy-night", "by-the-fire", "sea-breeze", "rain-at-sea"]);
    expect(MAX_SAVED_MIXES).toBe(5);
  });

  it("mixIds keeps sounds with some volume", () => {
    expect(mixIds({ volumes: { rain: 0.7, ocean: 0 } })).toEqual(["rain"]);
  });

  it("a mix matches what is playing at about those volumes", () => {
    const mix = { volumes: { rain: 0.7, "night-wind": 0.3 } };
    expect(mixMatches(mix, ["night-wind", "rain"], { rain: 0.71, "night-wind": 0.3 })).toBe(true);
    expect(mixMatches(mix, ["rain"], { rain: 0.7 })).toBe(false);
    expect(mixMatches(mix, ["rain", "night-wind"], { rain: 0.4, "night-wind": 0.3 })).toBe(false);
  });
});
