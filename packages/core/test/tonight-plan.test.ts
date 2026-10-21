import { describe, expect, it } from "vitest";
import { PRESET_MIXES } from "@mindcocoon/core/audio/mixes";
import { BREATH_PATTERNS } from "@mindcocoon/core/breathing";
import { PROMPT_COUNT } from "@mindcocoon/core/prompts";
import { MUSIC_TRACKS } from "@mindcocoon/core/sounds";
import { tonightPlan } from "@mindcocoon/core/tonight-plan";

const START = new Date(2026, 9, 1, 21, 0);
const day = (offset: number) => new Date(START.getFullYear(), START.getMonth(), START.getDate() + offset, 21, 0);

describe("tonight's plan", () => {
  it("is stable for a whole day and always picks real catalogue entries", () => {
    const a = tonightPlan("user-a", new Date(2026, 9, 21, 6, 0));
    const b = tonightPlan("user-a", new Date(2026, 9, 21, 23, 30));
    expect(a).toEqual(b);
    expect(a.promptIndex).toBeGreaterThanOrEqual(0);
    expect(a.promptIndex).toBeLessThan(PROMPT_COUNT);
    expect(BREATH_PATTERNS[a.pattern]).toBeDefined();
    expect(PRESET_MIXES.map((p) => p.id)).toContain(a.mix);
    expect(MUSIC_TRACKS.map((t) => t.id)).toContain(a.trackId);
  });

  it("never repeats the same combination within 14 days", () => {
    for (const seed of ["user-a", "user-b", "another-seed"]) {
      const seen = new Set<string>();
      for (let i = 0; i < 14; i++) {
        const key = JSON.stringify(tonightPlan(seed, day(i)));
        expect(seen.has(key), `${seed} day ${i}`).toBe(false);
        seen.add(key);
      }
      expect(seen.size).toBe(14);
    }
  });

  it("the seed actually shapes the plan (different people, different evenings)", () => {
    const plans = new Set(Array.from({ length: 10 }, (_, i) => JSON.stringify(tonightPlan(`seed-${i}`, START))));
    expect(plans.size).toBeGreaterThan(1);
  });

  it("keeps rotating past two weeks without breaking", () => {
    const keys = Array.from({ length: 60 }, (_, i) => JSON.stringify(tonightPlan("user-a", day(i))));
    expect(new Set(keys).size).toBeGreaterThan(40);
  });
});
