import { breathAt, breathAtPattern, BREATH_PATTERNS, BREATH_PHASES } from "@mindcocoon/core/breathing";
import { describe, expect, it } from "vitest";
import { breathAtPatternWorklet, breathAtWorklet, breathScale, dotPosition, innerScale, PAD, SIZE } from "../src/lib/breath-geometry";

describe("box-breathing geometry", () => {
  it("the dot climbs the left side on inhale", () => {
    expect(SIZE).toBe(220);
    expect(PAD).toBe(20);
    expect(dotPosition("inhale", 0)).toEqual({ x: 20, y: 200 });
    expect(dotPosition("inhale", 1)).toEqual({ x: 20, y: 20 });
    expect(dotPosition("hold-in", 0.5)).toEqual({ x: 110, y: 20 });
    expect(dotPosition("exhale", 1)).toEqual({ x: 200, y: 200 });
    expect(dotPosition("hold-out", 1)).toEqual({ x: 20, y: 200 });
  });

  it("innerScale grows on inhale and shrinks on exhale", () => {
    expect(innerScale("inhale", 0)).toBeCloseTo(0.6);
    expect(innerScale("inhale", 1)).toBeCloseTo(1);
    expect(innerScale("hold-in", 0.3)).toBe(1);
    expect(innerScale("exhale", 0)).toBeCloseTo(1);
    expect(innerScale("exhale", 1)).toBeCloseTo(0.6);
    expect(innerScale("hold-out", 0.3)).toBe(0.6);
  });

  it("breathAtWorklet agrees with core breathAt", () => {
    for (const ms of [0, 3_999, 4_000, 37_500, 63_999]) {
      const core = breathAt(ms);
      const w = breathAtWorklet(ms);
      expect(BREATH_PHASES[w.phaseIndex]).toBe(core.phase);
      expect(w.progress).toBeCloseTo(core.progress);
    }
  });

  it("breathAtPatternWorklet agrees with core for 4-7-8", () => {
    const p = BREATH_PATTERNS.relax;
    for (const ms of [0, 3_999, 4_000, 10_999, 11_000, 18_999, 19_000, 30_500]) {
      const core = breathAtPattern(p, 3, ms);
      const w = breathAtPatternWorklet(p.phases, ms);
      expect(p.phases[w.phaseIndex].phase).toBe(core.phase);
      expect(w.progress).toBeCloseTo(core.progress);
    }
  });

  it("breathScale grows on inhale, holds, shrinks on exhale", () => {
    expect(breathScale("inhale", 0.5)).toBeCloseTo(0.8);
    expect(breathScale("hold-in", 0.9)).toBe(1);
    expect(breathScale("exhale", 0.5)).toBeCloseTo(0.8);
    expect(breathScale("hold-out", 0.1)).toBe(0.6);
  });
});
